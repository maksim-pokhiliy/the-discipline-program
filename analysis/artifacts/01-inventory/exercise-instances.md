# Exercise instances

Карточка на каждое уникальное упражнение. Нормализованное имя case-insensitive, без `[ ]`-модификаторов в хвосте и без leading-count'а. Если строка в исходнике содержит `[ ]`-аннотации (вес, оборудование, side-указание, URL и т.п.) — они сохранены inline в `occurrences`.

Сортировка: по убыванию числа уникальных contexts (block-instance × sheet × day), внутри — по имени.

Замечания по нормализации (не ошибки):

- Composite-строки вида `DB Snatches + DB squats` хранятся как одно упражнение со своим именем — нет дробления на компоненты на этом этапе.
- Compound-row'ы вида `30 sec PLANK + 30 sec LEFT side PLANK + ...` нормализуются с сохранением `sec`-юнитов (LEAD_COUNT не съедает число, за которым идёт `sec`/`min`).
- Composite-row'ы вида `traverses + N bar dips + traverses + N bar dips` — каждый numeric-вариант (N=5,7,8,9,...) разлогался в отдельную карточку, чтобы не терять numeric-семантику.
- В вариантах `RUN 5 km` vs `5 km run` нормализация различается из-за порядка слов; merge не делается, raws сохранены.
- Композитные строки с инкорпорированными `[ weight ]` annotation'ами в **середине** имени (`KB [ 24 kg ] single arm row`, `DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses`) остаются с внутренним bracket'ом в имени — потеря для дедупа допустима, raws всегда есть.
- `ANY exercise for ABS` (один из CORE MUSCLES плейсхолдеров) при отдельной встрече пропускается, но если строка `ANY exercise for ABS + DB seated good morning` — то учитывается с этим именем целиком как сводный row.

---

### strict pull-ups

occurrences (23):

- `strict pull-ups`
- `10 strict pull-ups [ neutral grip ]`
- `5 strict pull-ups`
- `5 strict pull-ups [ neutral grip ]`
- `10 strict pull-ups`
- `15 strict pull-ups`
- `12 strict pull-ups`
- `9 strict pull-ups`
- `7 strict pull-ups [ neutral grip ]`
- `18 strict pull-ups`
- `14 strict pull-ups`
- `15 strict pull-ups [ before BAR DIPS complex ]`
- `15 strict pull-ups [ after BAR DIPS complex ]`
- `strict pull-ups [ neutral grip ]`
- `6 strict pull-ups`
- `12 strict pull-ups [ before BAR DIPS complex ]`
- `12 strict pull-ups [ after BAR DIPS complex and before NEXT block ]`
- `12 strict pull-ups [ after BAR DIPS complex ]`
- `9 strict pull-ups [ after BAR DIPS complex ]`
- `15 strict pull-ups [ after BAR DIPS complex and before NEXT block ]`
- `21 strict pull-ups`
- `21 strict pull-ups [ before BAR DIPS complex ]`
- `20 strict pull-ups`

contexts (61):

- sheet-01 / WED / 1ST / Basic GYMNASTICS
- sheet-01 / SAT / 1ST / GYMNASTICS
- sheet-02 / WED / 1ST / Basic GYMNASTICS
- sheet-02 / SAT / 1ST / GYMNASTICS
- sheet-03 / WED / 1ST / Basic GYMNASTICS
- sheet-03 / SAT / 1ST / GYMNASTICS
- sheet-04 / WED / 1ST / Basic GYMNASTICS
- sheet-04 / SAT / 1ST / GYMNASTICS
- sheet-05 / WED / 1ST / STRENGTH ENDURANCE
- sheet-05 / SAT / 1ST / GYMNASTICS
- sheet-06 / WED / 1ST / Basic GYMNASTICS
- sheet-06 / SAT / 1ST / GYMNASTICS
- sheet-07 / WED / 1ST / STRENGTH ENDURANCE
- sheet-07 / SAT / 1ST / GYMNASTICS
- sheet-08 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-08 / SAT / 1ST / GYMNASTICS
- sheet-09 / WED / 1ST / Basic GYMNASTICS
- sheet-09 / SAT / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-10 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-10 / SAT / 1ST / GYMNASTICS
- sheet-11 / WED / 1ST / Basic GYMNASTICS
- sheet-11 / SAT / 1ST / GYMNASTICS
- sheet-12 / WED / 1ST / Basic GYMNASTICS
- sheet-12 / SAT / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-13 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-13 / SAT / 1ST / GYMNASTICS
- sheet-14 / WED / 1ST / Basic GYMNASTICS
- sheet-14 / SAT / 1ST / GYMNASTICS
- sheet-15 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-15 / SAT / 1ST / GYMNASTICS
- sheet-16 / WED / 1ST / Basic GYMNASTICS
- sheet-16 / SAT / 1ST / GYMNASTICS
- sheet-17 / WED / 1ST / Basic GYMNASTICS
- sheet-17 / SAT / 1ST / GYMNASTICS
- sheet-18 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-18 / SAT / 1ST / GYMNASTICS
- sheet-19 / WED / 1ST / Basic GYMNASTICS
- sheet-19 / SAT / 1ST / GYMNASTICS
- sheet-20 / WED / 1ST / Basic GYMNASTICS
- sheet-21 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-21 / SAT / 1ST / GYMNASTICS
- sheet-22 / WED / 1ST / Basic GYMNASTICS
- sheet-22 / SAT / 1ST / GYMNASTICS
- sheet-23 / WED / 1ST / Basic GYMNASTICS
- sheet-24 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-24 / SAT / 1ST / GYMNASTICS
- sheet-25 / WED / 1ST / Basic GYMNASTICS
- sheet-25 / SAT / 1ST / GYMNASTICS
- sheet-26 / WED / 1ST / Basic GYMNASTICS
- sheet-27 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-27 / SAT / 1ST / GYMNASTICS
- sheet-28 / WED / 1ST / Basic GYMNASTICS
- sheet-28 / SAT / 1ST / GYMNASTICS
- sheet-29 / WED / 1ST / Basic GYMNASTICS
- sheet-30 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-30 / SAT / 1ST / GYMNASTICS
- sheet-31 / WED / 1ST / Basic GYMNASTICS
- sheet-31 / SAT / 1ST / GYMNASTICS
- sheet-32 / WED / 1ST / Basic GYMNASTICS
- sheet-33 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-33 / SAT / 1ST / GYMNASTICS

### single leg GLUTE BRIDGE

occurrences (6):

- `15 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]`
- `10-15 single leg GLUTE BRIDGE [ each leg ]`
- `10 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]`
- `12 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]`
- `20 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ]`
- `20 single leg GLUTE BRIDGE [ https://www.youtube.com/watch?v=EJXAJfzT9AA ] [ each leg ] [ 15 sec HOLD after LAST ]`

contexts (59):

- sheet-01 / MON / 1ST / SUCCESSORY WORK
- sheet-02 / MON / 1ST / SUCCESSORY WORK
- sheet-02 / TUE / 1ST / warm up BEFORE run
- sheet-02 / SAT / 1ST / warm up BEFORE run
- sheet-03 / MON / 1ST / SUCCESSORY WORK
- sheet-04 / MON / 1ST / SUCCESSORY WORK
- sheet-04 / TUE / 1ST / warm up BEFORE run
- sheet-04 / SAT / 1ST / warm up BEFORE run
- sheet-05 / MON / 1ST / SUCCESSORY WORK
- sheet-06 / MON / 1ST / SUCCESSORY WORK
- sheet-06 / TUE / 1ST / warm up BEFORE run
- sheet-06 / SAT / 1ST / warm up BEFORE run
- sheet-07 / MON / 1ST / SUCCESSORY WORK
- sheet-08 / MON / 1ST / SUCCESSORY WORK
- sheet-08 / TUE / 1ST / (implicit)
- sheet-09 / MON / 1ST / SUCCESSORY WORK
- sheet-09 / TUE / 1ST / (implicit)
- sheet-09 / SAT / 1ST / (implicit)
- sheet-10 / MON / 1ST / SUCCESSORY WORK
- sheet-10 / TUE / 1ST / (implicit)
- sheet-10 / SAT / 1ST / (implicit)
- sheet-11 / TUE / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-12 / MON / 1ST / SUCCESSORY WORK
- sheet-12 / TUE / 1ST / (implicit)
- sheet-12 / SAT / 1ST / (implicit)
- sheet-13 / MON / 1ST / SUCCESSORY WORK
- sheet-13 / TUE / 1ST / (implicit)
- sheet-13 / SAT / 1ST / (implicit)
- sheet-14 / TUE / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-14 / SAT / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-15 / MON / 1ST / SUCCESSORY WORK
- sheet-15 / TUE / 1ST / Warm Up before RUN | 3 sets
- sheet-16 / MON / 1ST / SUCCESSORY WORK
- sheet-16 / TUE / 1ST / (implicit)
- sheet-16 / SAT / 1ST / (implicit)
- sheet-17 / TUE / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-17 / SAT / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-18 / MON / 1ST / SUCCESSORY WORK
- sheet-18 / TUE / 1ST / Warm Up before RUN | 3 sets
- sheet-19 / MON / 1ST / SUCCESSORY WORK
- sheet-19 / TUE / 1ST / (implicit)
- sheet-19 / SAT / 1ST / (implicit)
- sheet-21 / MON / 1ST / SUCCESSORY WORK
- sheet-22 / MON / 1ST / SUCCESSORY WORK
- sheet-22 / TUE / 1ST / (implicit)
- sheet-22 / SAT / 1ST / (implicit)
- sheet-24 / MON / 1ST / SUCCESSORY WORK
- sheet-25 / MON / 1ST / SUCCESSORY WORK
- sheet-25 / TUE / 1ST / (implicit)
- sheet-25 / SAT / 1ST / (implicit)
- sheet-27 / MON / 1ST / SUCCESSORY WORK
- sheet-28 / MON / 1ST / SUCCESSORY WORK
- sheet-28 / TUE / 1ST / (implicit)
- sheet-28 / SAT / 1ST / (implicit)
- sheet-30 / MON / 1ST / SUCCESSORY WORK
- sheet-31 / MON / 1ST / SUCCESSORY WORK
- sheet-31 / TUE / 1ST / (implicit)
- sheet-31 / SAT / 1ST / (implicit)
- sheet-33 / MON / 1ST / SUCCESSORY WORK

### hamstring curls

occurrences (7):

- `15 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]`
- `10 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]`
- `20 hamstring curls [ AFTER each 5th REP - 5 sec pause ] [ each leg ]`
- `18 hamstring curls [ AFTER each 6th REP - 5 sec pause ] [ each leg ]`
- `20 hamstring curls [ AFTER each 10th REP - 10 sec pause ] [ each leg ]`
- `18 hamstring curls [ AFTER each 9th REP - 10 sec pause ] [ each leg ]`
- `30 hamstring curls [ AFTER each 10th REP - 10 sec pause ] [ each leg ]`

contexts (53):

- sheet-01 / MON / 1ST / SUCCESSORY WORK
- sheet-02 / MON / 1ST / SUCCESSORY WORK
- sheet-03 / MON / 1ST / SUCCESSORY WORK
- sheet-04 / MON / 1ST / SUCCESSORY WORK
- sheet-04 / FRI / 1ST / SUCCESSORY WORK
- sheet-05 / MON / 1ST / SUCCESSORY WORK
- sheet-06 / MON / 1ST / SUCCESSORY WORK
- sheet-06 / FRI / 1ST / SUCCESSORY WORK
- sheet-07 / MON / 1ST / SUCCESSORY WORK
- sheet-08 / MON / 1ST / SUCCESSORY WORK
- sheet-08 / FRI / 1ST / SUCCESSORY WORK
- sheet-09 / MON / 1ST / SUCCESSORY WORK
- sheet-09 / FRI / 1ST / SUCCESSORY WORK
- sheet-10 / MON / 1ST / SUCCESSORY WORK
- sheet-11 / MON / 1ST / SUCCESSORY WORK
- sheet-11 / FRI / 1ST / SUCCESSORY WORK
- sheet-12 / MON / 1ST / SUCCESSORY WORK
- sheet-12 / FRI / 1ST / SUCCESSORY WORK
- sheet-13 / MON / 1ST / SUCCESSORY WORK
- sheet-14 / MON / 1ST / SUCCESSORY WORK
- sheet-14 / FRI / 1ST / SUCCESSORY WORK
- sheet-15 / MON / 1ST / SUCCESSORY WORK
- sheet-15 / FRI / 1ST / SUCCESSORY WORK
- sheet-16 / MON / 1ST / SUCCESSORY WORK
- sheet-17 / MON / 1ST / SUCCESSORY WORK
- sheet-17 / FRI / 1ST / SUCCESSORY WORK
- sheet-18 / MON / 1ST / SUCCESSORY WORK
- sheet-18 / FRI / 1ST / SUCCESSORY WORK
- sheet-19 / MON / 1ST / SUCCESSORY WORK
- sheet-20 / MON / 1ST / SUCCESSORY WORK
- sheet-20 / FRI / 1ST / SUCCESSORY WORK
- sheet-21 / MON / 1ST / SUCCESSORY WORK
- sheet-21 / FRI / 1ST / SUCCESSORY WORK
- sheet-22 / MON / 1ST / SUCCESSORY WORK
- sheet-23 / MON / 1ST / SUCCESSORY WORK
- sheet-23 / FRI / 1ST / SUCCESSORY WORK
- sheet-24 / MON / 1ST / SUCCESSORY WORK
- sheet-24 / FRI / 1ST / SUCCESSORY WORK
- sheet-25 / MON / 1ST / SUCCESSORY WORK
- sheet-26 / MON / 1ST / SUCCESSORY WORK
- sheet-26 / FRI / 1ST / SUCCESSORY WORK
- sheet-27 / MON / 1ST / SUCCESSORY WORK
- sheet-27 / FRI / 1ST / SUCCESSORY WORK
- sheet-28 / MON / 1ST / SUCCESSORY WORK
- sheet-29 / MON / 1ST / SUCCESSORY WORK
- sheet-29 / FRI / 1ST / SUCCESSORY WORK
- sheet-30 / MON / 1ST / SUCCESSORY WORK
- sheet-30 / FRI / 1ST / SUCCESSORY WORK
- sheet-31 / MON / 1ST / SUCCESSORY WORK
- sheet-32 / MON / 1ST / SUCCESSORY WORK
- sheet-32 / FRI / 1ST / SUCCESSORY WORK
- sheet-33 / MON / 1ST / SUCCESSORY WORK
- sheet-33 / FRI / 1ST / SUCCESSORY WORK

### strict HSPU

occurrences (22):

- `strict HSPU`
- `2 strict HSPU`
- `6 strict HSPU`
- `5 strict HSPU`
- `10 strict HSPU`
- `30 strict HSPU [ TOTAL ]`
- `3 strict HSPU`
- `30 strict HSPU`
- `7 strict HSPU`
- `4 strict HSPU`
- `10 strict HSPU [ from box/sofa ] [ https://www.youtube.com/watch?v=V5libCZNTkI ]`
- `5 strict HSPU [ from box/sofa ] [ https://www.youtube.com/watch?v=V5libCZNTkI ]`
- `6 strict HSPU [ from box/sofa ] [ https://www.youtube.com/watch?v=V5libCZNTkI ]`
- `30 strict HSPU [ from box/sofa ]`
- `45 strict HSPU [ from box/sofa ]`
- `strict HSPU [ from box/sofa ] [ https://www.youtube.com/watch?v=V5libCZNTkI ]`
- `20 strict HSPU [ from sofa ]`
- `30 strict HSPU [ from sofa ]`
- `10 strict HSPU [ from sofa ]`
- `** 5 strict HSPU [ from sofa ] [ AFTER EACH ROUND ]`
- `14 strict HSPU [ from sofa ]`
- `18 strict HSPU [ from sofa ]`

contexts (46):

- sheet-01 / MON / 1ST / STRENGTH ENDURANCE
- sheet-01 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-02 / MON / 1ST / INTERVALS
- sheet-03 / MON / 1ST / STRENGTH ENDURANCE
- sheet-04 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-05 / MON / 1ST / STRENGTH ENDURANCE
- sheet-06 / FRI / 1ST / CHIPPER
- sheet-08 / MON / 1ST / STRENGTH ENDURANCE
- sheet-08 / SAT / 1ST / GYMNASTICS
- sheet-09 / FRI / 1ST / INTERVALS
- sheet-10 / MON / 1ST / STRENGTH ENDURANCE
- sheet-11 / MON / 1ST / STRENGTH ENDURANCE
- sheet-11 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-12 / MON / 1ST / (implicit)
- sheet-12 / FRI / 1ST / STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]
- sheet-13 / MON / 1ST / (implicit)
- sheet-13 / SAT / 1ST / GYMNASTICS
- sheet-14 / MON / 1ST / STRENGTH ENDURANCE
- sheet-14 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-15 / MON / 1ST / STRENGTH ENDURANCE
- sheet-15 / SAT / 1ST / GYMNASTICS
- sheet-16 / SAT / 1ST / GYMNASTICS
- sheet-18 / SAT / 1ST / GYMNASTICS
- sheet-19 / SAT / 1ST / GYMNASTICS
- sheet-20 / MON / 1ST / Temporarily without STRENGTH ENDURANCE
- sheet-21 / MON / 1ST / STRENGTH ENDURANCE
- sheet-21 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-21 / SAT / 1ST / GYMNASTICS
- sheet-22 / SAT / 1ST / GYMNASTICS
- sheet-23 / MON / 1ST / STRENGTH ENDURANCE
- sheet-23 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-24 / MON / 1ST / STRENGTH ENDURANCE
- sheet-24 / SAT / 1ST / GYMNASTICS
- sheet-25 / SAT / 1ST / GYMNASTICS
- sheet-26 / MON / 1ST / STRENGTH ENDURANCE
- sheet-26 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-27 / MON / 1ST / STRENGTH ENDURANCE
- sheet-27 / SAT / 1ST / GYMNASTICS
- sheet-28 / SAT / 1ST / GYMNASTICS
- sheet-29 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-30 / MON / 1ST / STRENGTH ENDURANCE
- sheet-31 / SAT / 1ST / GYMNASTICS
- sheet-32 / MON / 1ST / STRENGTH ENDURANCE
- sheet-32 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-33 / MON / 1ST / STRENGTH ENDURANCE
- sheet-33 / SAT / 1ST / GYMNASTICS

### Hip ABduction with band

occurrences (2):

- `10 Hip ABduction with band`
- `10 Hip abduction with band [ https://www.youtube.com/watch?v=k0oEjtPIsXI ]`

contexts (41):

- sheet-02 / TUE / 1ST / warm up BEFORE run
- sheet-02 / FRI / 1ST / SUCCESSORY WORK
- sheet-02 / SAT / 1ST / warm up BEFORE run
- sheet-04 / TUE / 1ST / warm up BEFORE run
- sheet-04 / SAT / 1ST / warm up BEFORE run
- sheet-06 / TUE / 1ST / warm up BEFORE run
- sheet-06 / SAT / 1ST / warm up BEFORE run
- sheet-08 / TUE / 1ST / (implicit)
- sheet-09 / TUE / 1ST / (implicit)
- sheet-09 / SAT / 1ST / (implicit)
- sheet-10 / TUE / 1ST / (implicit)
- sheet-10 / SAT / 1ST / (implicit)
- sheet-11 / TUE / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-12 / TUE / 1ST / (implicit)
- sheet-12 / SAT / 1ST / (implicit)
- sheet-13 / TUE / 1ST / (implicit)
- sheet-13 / SAT / 1ST / (implicit)
- sheet-14 / TUE / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-14 / SAT / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-15 / TUE / 1ST / Warm Up before RUN | 3 sets
- sheet-16 / TUE / 1ST / (implicit)
- sheet-16 / FRI / 1ST / SUCCESSORY WORK
- sheet-16 / SAT / 1ST / (implicit)
- sheet-17 / TUE / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-17 / SAT / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-18 / TUE / 1ST / Warm Up before RUN | 3 sets
- sheet-19 / TUE / 1ST / (implicit)
- sheet-19 / FRI / 1ST / SUCCESSORY WORK
- sheet-19 / SAT / 1ST / (implicit)
- sheet-22 / TUE / 1ST / (implicit)
- sheet-22 / FRI / 1ST / SUCCESSORY WORK
- sheet-22 / SAT / 1ST / (implicit)
- sheet-25 / TUE / 1ST / (implicit)
- sheet-25 / FRI / 1ST / SUCCESSORY WORK
- sheet-25 / SAT / 1ST / (implicit)
- sheet-28 / TUE / 1ST / (implicit)
- sheet-28 / FRI / 1ST / SUCCESSORY WORK
- sheet-28 / SAT / 1ST / (implicit)
- sheet-31 / TUE / 1ST / (implicit)
- sheet-31 / FRI / 1ST / SUCCESSORY WORK
- sheet-31 / SAT / 1ST / (implicit)

### Hip ADduction with band

occurrences (1):

- `10 Hip ADduction with band [ https://www.youtube.com/watch?v=rq8tHYwBAOY ]`

contexts (34):

- sheet-02 / TUE / 1ST / warm up BEFORE run
- sheet-02 / SAT / 1ST / warm up BEFORE run
- sheet-04 / TUE / 1ST / warm up BEFORE run
- sheet-04 / SAT / 1ST / warm up BEFORE run
- sheet-06 / TUE / 1ST / warm up BEFORE run
- sheet-06 / SAT / 1ST / warm up BEFORE run
- sheet-08 / TUE / 1ST / (implicit)
- sheet-09 / TUE / 1ST / (implicit)
- sheet-09 / SAT / 1ST / (implicit)
- sheet-10 / TUE / 1ST / (implicit)
- sheet-10 / SAT / 1ST / (implicit)
- sheet-11 / TUE / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-12 / TUE / 1ST / (implicit)
- sheet-12 / SAT / 1ST / (implicit)
- sheet-13 / TUE / 1ST / (implicit)
- sheet-13 / SAT / 1ST / (implicit)
- sheet-14 / TUE / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-14 / SAT / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-15 / TUE / 1ST / Warm Up before RUN | 3 sets
- sheet-16 / TUE / 1ST / (implicit)
- sheet-16 / SAT / 1ST / (implicit)
- sheet-17 / TUE / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-17 / SAT / 1ST / 3 sets WARM UP BEFORE RUN
- sheet-18 / TUE / 1ST / Warm Up before RUN | 3 sets
- sheet-19 / TUE / 1ST / (implicit)
- sheet-19 / SAT / 1ST / (implicit)
- sheet-22 / TUE / 1ST / (implicit)
- sheet-22 / SAT / 1ST / (implicit)
- sheet-25 / TUE / 1ST / (implicit)
- sheet-25 / SAT / 1ST / (implicit)
- sheet-28 / TUE / 1ST / (implicit)
- sheet-28 / SAT / 1ST / (implicit)
- sheet-31 / TUE / 1ST / (implicit)
- sheet-31 / SAT / 1ST / (implicit)

### seated lateral BANDED raises

occurrences (9):

- `10 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]`
- `10-15 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]`
- `10 seated lateral BANDED raises [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]`
- `15 seated lateral BANDED raises [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]`
- `14 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]`
- `15 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]`
- `12 seated lateral BANDED raises [ https://www.youtube.com/watch?v=KXqJzrrTDBo ]`
- `15 seated lateral BANDED raises [ 1 ARM HOLD in UP | another ARM DO 5 reps | than opposite | AND + 5 reps BOTH arms ]`
- `14 seated lateral BANDED raises [ 1 ARM HOLD in UP | another ARM DO 5 reps | than opposite | AND + 5 reps BOTH arms ]`

contexts (33):

- sheet-01 / MON / 1ST / SUCCESSORY WORK
- sheet-02 / MON / 1ST / SUCCESSORY WORK
- sheet-03 / MON / 1ST / SUCCESSORY WORK
- sheet-04 / MON / 1ST / SUCCESSORY WORK
- sheet-05 / MON / 1ST / SUCCESSORY WORK
- sheet-06 / MON / 1ST / SUCCESSORY WORK
- sheet-07 / MON / 1ST / SUCCESSORY WORK
- sheet-08 / MON / 1ST / SUCCESSORY WORK
- sheet-09 / MON / 1ST / SUCCESSORY WORK
- sheet-10 / MON / 1ST / SUCCESSORY WORK
- sheet-11 / MON / 1ST / SUCCESSORY WORK
- sheet-12 / MON / 1ST / SUCCESSORY WORK
- sheet-13 / MON / 1ST / SUCCESSORY WORK
- sheet-14 / MON / 1ST / SUCCESSORY WORK
- sheet-15 / MON / 1ST / SUCCESSORY WORK
- sheet-16 / MON / 1ST / SUCCESSORY WORK
- sheet-17 / MON / 1ST / SUCCESSORY WORK
- sheet-18 / MON / 1ST / SUCCESSORY WORK
- sheet-19 / MON / 1ST / SUCCESSORY WORK
- sheet-20 / MON / 1ST / SUCCESSORY WORK
- sheet-21 / MON / 1ST / SUCCESSORY WORK
- sheet-22 / MON / 1ST / SUCCESSORY WORK
- sheet-23 / MON / 1ST / SUCCESSORY WORK
- sheet-24 / MON / 1ST / SUCCESSORY WORK
- sheet-25 / MON / 1ST / SUCCESSORY WORK
- sheet-26 / MON / 1ST / SUCCESSORY WORK
- sheet-27 / MON / 1ST / SUCCESSORY WORK
- sheet-28 / MON / 1ST / SUCCESSORY WORK
- sheet-29 / MON / 1ST / SUCCESSORY WORK
- sheet-30 / MON / 1ST / SUCCESSORY WORK
- sheet-31 / MON / 1ST / SUCCESSORY WORK
- sheet-32 / MON / 1ST / SUCCESSORY WORK
- sheet-33 / MON / 1ST / SUCCESSORY WORK

### pull overs

occurrences (4):

- `10 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]`
- `12 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]`
- `15 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]`
- `30 pull overs [ https://www.youtube.com/watch?v=owr5y-s6-Qk ]`

contexts (32):

- sheet-05 / WED / 1ST / PUMP SESSION
- sheet-07 / WED / 1ST / PUMP SESSION
- sheet-08 / WED / 1ST / PUMP SESSION
- sheet-09 / SAT / 1ST / PUMP SESSION
- sheet-10 / WED / 1ST / PUMP SESSION
- sheet-11 / WED / 1ST / PUMP SESSION
- sheet-13 / WED / 1ST / PUMP SESSION
- sheet-14 / WED / 1ST / Basic GYMNASTICS
- sheet-15 / WED / 1ST / PUMP SESSION
- sheet-16 / WED / 1ST / PUMP SESSION
- sheet-17 / WED / 1ST / Basic GYMNASTICS
- sheet-18 / WED / 1ST / PUMP SESSION
- sheet-19 / WED / 1ST / PUMP SESSION
- sheet-19 / SAT / 1ST / PUMP SESSION
- sheet-20 / WED / 1ST / Basic GYMNASTICS
- sheet-21 / WED / 1ST / PUMP SESSION
- sheet-22 / WED / 1ST / PUMP SESSION
- sheet-22 / SAT / 1ST / PUMP SESSION
- sheet-23 / WED / 1ST / Basic GYMNASTICS
- sheet-24 / WED / 1ST / PUMP SESSION
- sheet-25 / WED / 1ST / PUMP SESSION
- sheet-25 / SAT / 1ST / PUMP SESSION
- sheet-26 / WED / 1ST / PUMP SESSION
- sheet-27 / WED / 1ST / PUMP SESSION
- sheet-28 / WED / 1ST / PUMP SESSION
- sheet-28 / SAT / 1ST / PUMP SESSION
- sheet-29 / WED / 1ST / PUMP SESSION
- sheet-30 / WED / 1ST / PUMP SESSION
- sheet-31 / WED / 1ST / PUMP SESSION
- sheet-31 / SAT / 1ST / PUMP SESSION
- sheet-32 / WED / 1ST / PUMP SESSION
- sheet-33 / WED / 1ST / PUMP SESSION

### KB high pull

occurrences (4):

- `10 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]`
- `10-12 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]`
- `14 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]`
- `15 KB high pull [ https://www.youtube.com/watch?v=E21F3Oh7A60 ]`

contexts (28):

- sheet-01 / FRI / 1ST / SUCCESSORY WORK
- sheet-03 / FRI / 1ST / SUCCESSORY WORK
- sheet-05 / FRI / 1ST / SUCCESSORY WORK
- sheet-07 / FRI / 1ST / SUCCESSORY WORK
- sheet-08 / FRI / 1ST / SUCCESSORY WORK
- sheet-10 / FRI / 1ST / SUCCESSORY WORK
- sheet-11 / FRI / 1ST / SUCCESSORY WORK
- sheet-13 / FRI / 1ST / SUCCESSORY WORK
- sheet-14 / FRI / 1ST / SUCCESSORY WORK
- sheet-15 / FRI / 1ST / SUCCESSORY WORK
- sheet-16 / FRI / 1ST / SUCCESSORY WORK
- sheet-17 / FRI / 1ST / SUCCESSORY WORK
- sheet-18 / FRI / 1ST / SUCCESSORY WORK
- sheet-19 / FRI / 1ST / SUCCESSORY WORK
- sheet-20 / FRI / 1ST / SUCCESSORY WORK
- sheet-21 / FRI / 1ST / SUCCESSORY WORK
- sheet-22 / FRI / 1ST / SUCCESSORY WORK
- sheet-23 / FRI / 1ST / SUCCESSORY WORK
- sheet-24 / FRI / 1ST / SUCCESSORY WORK
- sheet-25 / FRI / 1ST / SUCCESSORY WORK
- sheet-26 / FRI / 1ST / SUCCESSORY WORK
- sheet-27 / FRI / 1ST / SUCCESSORY WORK
- sheet-28 / FRI / 1ST / SUCCESSORY WORK
- sheet-29 / FRI / 1ST / SUCCESSORY WORK
- sheet-30 / FRI / 1ST / SUCCESSORY WORK
- sheet-31 / FRI / 1ST / SUCCESSORY WORK
- sheet-32 / FRI / 1ST / SUCCESSORY WORK
- sheet-33 / FRI / 1ST / SUCCESSORY WORK

### Single Leg Kettlebell Hip Thrust

occurrences (5):

- `10 Single Leg Kettlebell Hip Thrust [ + 1 sec pause in UP position ] [ each leg ]`
- `12 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]`
- `15-20 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]`
- `15 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]`
- `10 Single Leg Kettlebell Hip Thrust [ + 2 sec pause in UP position ] [ each leg ]`

contexts (28):

- sheet-01 / FRI / 1ST / SUCCESSORY WORK
- sheet-03 / FRI / 1ST / SUCCESSORY WORK
- sheet-05 / FRI / 1ST / SUCCESSORY WORK
- sheet-07 / FRI / 1ST / SUCCESSORY WORK
- sheet-08 / FRI / 1ST / SUCCESSORY WORK
- sheet-10 / FRI / 1ST / SUCCESSORY WORK
- sheet-11 / FRI / 1ST / SUCCESSORY WORK
- sheet-13 / FRI / 1ST / SUCCESSORY WORK
- sheet-14 / FRI / 1ST / SUCCESSORY WORK
- sheet-15 / FRI / 1ST / SUCCESSORY WORK
- sheet-16 / FRI / 1ST / SUCCESSORY WORK
- sheet-17 / FRI / 1ST / SUCCESSORY WORK
- sheet-18 / FRI / 1ST / SUCCESSORY WORK
- sheet-19 / FRI / 1ST / SUCCESSORY WORK
- sheet-20 / FRI / 1ST / SUCCESSORY WORK
- sheet-21 / FRI / 1ST / SUCCESSORY WORK
- sheet-22 / FRI / 1ST / SUCCESSORY WORK
- sheet-23 / FRI / 1ST / SUCCESSORY WORK
- sheet-24 / FRI / 1ST / SUCCESSORY WORK
- sheet-25 / FRI / 1ST / SUCCESSORY WORK
- sheet-26 / FRI / 1ST / SUCCESSORY WORK
- sheet-27 / FRI / 1ST / SUCCESSORY WORK
- sheet-28 / FRI / 1ST / SUCCESSORY WORK
- sheet-29 / FRI / 1ST / SUCCESSORY WORK
- sheet-30 / FRI / 1ST / SUCCESSORY WORK
- sheet-31 / FRI / 1ST / SUCCESSORY WORK
- sheet-32 / FRI / 1ST / SUCCESSORY WORK
- sheet-33 / FRI / 1ST / SUCCESSORY WORK

### ANY exercise for ABS + DB seated good morning

occurrences (1):

- `ANY exercise for ABS + DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]`

contexts (27):

- sheet-03 / FRI / 1ST / CORE MUSCLES
- sheet-05 / FRI / 1ST / CORE MUSCLES
- sheet-07 / FRI / 1ST / CORE MUSCLES
- sheet-08 / FRI / 1ST / CORE MUSCLES
- sheet-10 / FRI / 1ST / CORE MUSCLES
- sheet-11 / FRI / 1ST / CORE MUSCLES
- sheet-13 / FRI / 1ST / CORE MUSCLES
- sheet-14 / FRI / 1ST / CORE MUSCLES
- sheet-15 / FRI / 1ST / CORE MUSCLES
- sheet-16 / FRI / 1ST / CORE MUSCLES
- sheet-17 / FRI / 1ST / CORE MUSCLES
- sheet-18 / FRI / 1ST / CORE MUSCLES
- sheet-19 / FRI / 1ST / CORE MUSCLES
- sheet-20 / FRI / 1ST / CORE MUSCLES
- sheet-21 / FRI / 1ST / CORE MUSCLES
- sheet-22 / FRI / 1ST / CORE MUSCLES
- sheet-23 / FRI / 1ST / CORE MUSCLES
- sheet-24 / FRI / 1ST / CORE MUSCLES
- sheet-25 / FRI / 1ST / CORE MUSCLES
- sheet-26 / FRI / 1ST / CORE MUSCLES
- sheet-27 / FRI / 1ST / CORE MUSCLES
- sheet-28 / FRI / 1ST / CORE MUSCLES
- sheet-29 / FRI / 1ST / CORE MUSCLES
- sheet-30 / FRI / 1ST / CORE MUSCLES
- sheet-31 / FRI / 1ST / CORE MUSCLES
- sheet-32 / FRI / 1ST / CORE MUSCLES
- sheet-33 / FRI / 1ST / CORE MUSCLES

### DB bench presses

occurrences (5):

- `10 DB bench presses [ 2x 15 kg ]`
- `DB bench presses [ 2x 15 kg ]`
- `12 DB bench presses [ 2x 15 kg ]`
- `7 DB bench presses [ 2x 15 kg ]`
- `30 DB bench presses [ 2x 15 kg ]`

contexts (26):

- sheet-01 / WED / 1ST / STRENGTH ENDURANCE
- sheet-03 / WED / 1ST / STRENGTH ENDURANCE
- sheet-04 / WED / 1ST / STRENGTH ENDURANCE
- sheet-05 / WED / 1ST / PUMP SESSION
- sheet-06 / WED / 1ST / STRENGTH ENDURANCE
- sheet-07 / WED / 1ST / PUMP SESSION
- sheet-08 / WED / 1ST / PUMP SESSION
- sheet-09 / SAT / 1ST / PUMP SESSION
- sheet-10 / WED / 1ST / PUMP SESSION
- sheet-11 / WED / 1ST / PUMP SESSION
- sheet-13 / WED / 1ST / PUMP SESSION
- sheet-14 / WED / 1ST / PUMP SESSION
- sheet-15 / WED / 1ST / PUMP SESSION
- sheet-16 / WED / 1ST / PUMP SESSION
- sheet-17 / WED / 1ST / PUMP SESSION
- sheet-18 / WED / 1ST / PUMP SESSION
- sheet-19 / SAT / 1ST / PUMP SESSION
- sheet-21 / WED / 1ST / PUMP SESSION
- sheet-22 / SAT / 1ST / PUMP SESSION
- sheet-24 / WED / 1ST / PUMP SESSION
- sheet-25 / SAT / 1ST / PUMP SESSION
- sheet-27 / WED / 1ST / PUMP SESSION
- sheet-28 / SAT / 1ST / PUMP SESSION
- sheet-30 / WED / 1ST / PUMP SESSION
- sheet-31 / SAT / 1ST / PUMP SESSION
- sheet-33 / WED / 1ST / PUMP SESSION

### DB single arm row

occurrences (11):

- `10 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]`
- `DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]`
- `DB single arm row [ WITHOUT BENCH ] [ https://www.youtube.com/watch?v=_LJQDmOcTbE ] [ each arm ]`
- `12 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]`
- `14 DB single arm row [ LEFT ARM ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]`
- `14 DB single arm row [ RIGHT ARM ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]`
- `15 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]`
- `10 DB single arm row [ LEFT ARM ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]`
- `10 DB single arm row [ RIGHT ARM ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]`
- `15 DB single arm row [ 5 KB 24 kg + 10 DB 15 kg ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]`
- `30 DB single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]`

contexts (26):

- sheet-01 / WED / 1ST / STRENGTH ENDURANCE
- sheet-02 / WED / 1ST / STRENGTH ENDURANCE
- sheet-03 / WED / 1ST / STRENGTH ENDURANCE
- sheet-05 / WED / 1ST / PUMP SESSION
- sheet-07 / WED / 1ST / PUMP SESSION
- sheet-08 / WED / 1ST / PUMP SESSION
- sheet-09 / SAT / 1ST / PUMP SESSION
- sheet-10 / WED / 1ST / PUMP SESSION
- sheet-11 / WED / 1ST / PUMP SESSION
- sheet-13 / WED / 1ST / PUMP SESSION
- sheet-14 / WED / 1ST / PUMP SESSION
- sheet-15 / WED / 1ST / PUMP SESSION
- sheet-16 / WED / 1ST / PUMP SESSION
- sheet-17 / WED / 1ST / PUMP SESSION
- sheet-18 / WED / 1ST / PUMP SESSION
- sheet-19 / WED / 1ST / PUMP SESSION
- sheet-20 / WED / 1ST / PUMP SESSION
- sheet-21 / WED / 1ST / PUMP SESSION
- sheet-22 / WED / 1ST / PUMP SESSION
- sheet-23 / WED / 1ST / PUMP SESSION
- sheet-24 / WED / 1ST / PUMP SESSION
- sheet-25 / WED / 1ST / PUMP SESSION
- sheet-27 / WED / 1ST / PUMP SESSION
- sheet-28 / WED / 1ST / PUMP SESSION
- sheet-31 / WED / 1ST / PUMP SESSION
- sheet-33 / WED / 1ST / PUMP SESSION

### rear delt with BANDED

occurrences (3):

- `10 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]`
- `21 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]`
- `20 rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]`

contexts (26):

- sheet-01 / MON / 1ST / SUCCESSORY WORK
- sheet-01 / FRI / 1ST / SUCCESSORY WORK
- sheet-02 / MON / 1ST / SUCCESSORY WORK
- sheet-02 / FRI / 1ST / SUCCESSORY WORK
- sheet-03 / MON / 1ST / SUCCESSORY WORK
- sheet-03 / FRI / 1ST / SUCCESSORY WORK
- sheet-04 / MON / 1ST / SUCCESSORY WORK
- sheet-04 / FRI / 1ST / SUCCESSORY WORK
- sheet-05 / MON / 1ST / SUCCESSORY WORK
- sheet-05 / FRI / 1ST / SUCCESSORY WORK
- sheet-06 / MON / 1ST / SUCCESSORY WORK
- sheet-06 / FRI / 1ST / SUCCESSORY WORK
- sheet-07 / MON / 1ST / SUCCESSORY WORK
- sheet-07 / FRI / 1ST / SUCCESSORY WORK
- sheet-09 / MON / 1ST / SUCCESSORY WORK
- sheet-09 / FRI / 1ST / SUCCESSORY WORK
- sheet-10 / FRI / 1ST / SUCCESSORY WORK
- sheet-12 / MON / 1ST / SUCCESSORY WORK
- sheet-12 / FRI / 1ST / SUCCESSORY WORK
- sheet-13 / FRI / 1ST / SUCCESSORY WORK
- sheet-16 / FRI / 1ST / SUCCESSORY WORK
- sheet-19 / FRI / 1ST / SUCCESSORY WORK
- sheet-22 / FRI / 1ST / SUCCESSORY WORK
- sheet-25 / FRI / 1ST / SUCCESSORY WORK
- sheet-28 / FRI / 1ST / SUCCESSORY WORK
- sheet-31 / FRI / 1ST / SUCCESSORY WORK

### strict bar dips

occurrences (5):

- `strict bar dips`
- `10 strict bar dips`
- `14 strict bar dips`
- `10-15 strict bar dips`
- `15 strict bar dips`

contexts (26):

- sheet-01 / WED / 1ST / Basic GYMNASTICS
- sheet-01 / SAT / 1ST / GYMNASTICS
- sheet-02 / WED / 1ST / Basic GYMNASTICS
- sheet-02 / SAT / 1ST / GYMNASTICS
- sheet-03 / WED / 1ST / Basic GYMNASTICS
- sheet-03 / SAT / 1ST / GYMNASTICS
- sheet-04 / WED / 1ST / Basic GYMNASTICS
- sheet-04 / SAT / 1ST / GYMNASTICS
- sheet-05 / WED / 1ST / STRENGTH ENDURANCE
- sheet-05 / SAT / 1ST / GYMNASTICS
- sheet-06 / WED / 1ST / Basic GYMNASTICS
- sheet-06 / SAT / 1ST / GYMNASTICS
- sheet-07 / SAT / 1ST / GYMNASTICS
- sheet-08 / SAT / 1ST / GYMNASTICS
- sheet-09 / WED / 1ST / Basic GYMNASTICS
- sheet-10 / SAT / 1ST / GYMNASTICS
- sheet-12 / WED / 1ST / Basic GYMNASTICS
- sheet-13 / SAT / 1ST / GYMNASTICS
- sheet-15 / SAT / 1ST / GYMNASTICS
- sheet-16 / SAT / 1ST / GYMNASTICS
- sheet-18 / SAT / 1ST / GYMNASTICS
- sheet-21 / SAT / 1ST / GYMNASTICS
- sheet-24 / SAT / 1ST / GYMNASTICS
- sheet-27 / SAT / 1ST / GYMNASTICS
- sheet-30 / SAT / 1ST / GYMNASTICS
- sheet-33 / SAT / 1ST / GYMNASTICS

### strict T2B

occurrences (2):

- `30 strict T2B`
- `35 strict T2B`

contexts (25):

- sheet-01 / WED / 1ST / Basic GYMNASTICS
- sheet-01 / SAT / 1ST / GYMNASTICS
- sheet-02 / WED / 1ST / Basic GYMNASTICS
- sheet-02 / SAT / 1ST / GYMNASTICS
- sheet-03 / SAT / 1ST / GYMNASTICS
- sheet-04 / SAT / 1ST / GYMNASTICS
- sheet-05 / SAT / 1ST / GYMNASTICS
- sheet-06 / SAT / 1ST / GYMNASTICS
- sheet-07 / SAT / 1ST / GYMNASTICS
- sheet-08 / SAT / 1ST / GYMNASTICS
- sheet-09 / SAT / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-10 / SAT / 1ST / GYMNASTICS
- sheet-11 / SAT / 1ST / GYMNASTICS
- sheet-12 / SAT / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-13 / SAT / 1ST / GYMNASTICS
- sheet-14 / SAT / 1ST / GYMNASTICS
- sheet-15 / SAT / 1ST / GYMNASTICS
- sheet-16 / SAT / 1ST / GYMNASTICS
- sheet-17 / SAT / 1ST / GYMNASTICS
- sheet-18 / SAT / 1ST / GYMNASTICS
- sheet-21 / SAT / 1ST / GYMNASTICS
- sheet-24 / SAT / 1ST / GYMNASTICS
- sheet-27 / SAT / 1ST / GYMNASTICS
- sheet-30 / SAT / 1ST / GYMNASTICS
- sheet-33 / SAT / 1ST / GYMNASTICS

### SINGLE ARM rear delt with BANDED

occurrences (6):

- `10 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]`
- `15 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]`
- `20 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]`
- `14 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]`
- `12 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]`
- `18 SINGLE ARM rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]`

contexts (24):

- sheet-08 / MON / 1ST / SUCCESSORY WORK
- sheet-10 / MON / 1ST / SUCCESSORY WORK
- sheet-11 / MON / 1ST / SUCCESSORY WORK
- sheet-13 / MON / 1ST / SUCCESSORY WORK
- sheet-14 / MON / 1ST / SUCCESSORY WORK
- sheet-15 / MON / 1ST / SUCCESSORY WORK
- sheet-16 / MON / 1ST / SUCCESSORY WORK
- sheet-17 / MON / 1ST / SUCCESSORY WORK
- sheet-18 / MON / 1ST / SUCCESSORY WORK
- sheet-19 / MON / 1ST / SUCCESSORY WORK
- sheet-20 / MON / 1ST / SUCCESSORY WORK
- sheet-21 / MON / 1ST / SUCCESSORY WORK
- sheet-22 / MON / 1ST / SUCCESSORY WORK
- sheet-23 / MON / 1ST / SUCCESSORY WORK
- sheet-24 / MON / 1ST / SUCCESSORY WORK
- sheet-25 / MON / 1ST / SUCCESSORY WORK
- sheet-26 / MON / 1ST / SUCCESSORY WORK
- sheet-27 / MON / 1ST / SUCCESSORY WORK
- sheet-28 / MON / 1ST / SUCCESSORY WORK
- sheet-29 / MON / 1ST / SUCCESSORY WORK
- sheet-30 / MON / 1ST / SUCCESSORY WORK
- sheet-31 / MON / 1ST / SUCCESSORY WORK
- sheet-32 / MON / 1ST / SUCCESSORY WORK
- sheet-33 / MON / 1ST / SUCCESSORY WORK

### DB seated good morning

occurrences (3):

- `10 DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]`
- `DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]`
- `15 DB seated good morning [ https://www.youtube.com/watch?v=x5nnk8hUBo4 ]`

contexts (23):

- sheet-01 / MON / 1ST / SUCCESSORY WORK
- sheet-01 / FRI / 1ST / SUCCESSORY WORK
- sheet-02 / MON / 1ST / CORE MUSCLES
- sheet-02 / FRI / 1ST / CORE MUSCLES
- sheet-03 / MON / 1ST / SUCCESSORY WORK
- sheet-04 / MON / 1ST / CORE MUSCLES
- sheet-04 / FRI / 1ST / CORE MUSCLES
- sheet-05 / MON / 1ST / SUCCESSORY WORK
- sheet-06 / MON / 1ST / CORE MUSCLES
- sheet-06 / FRI / 1ST / CORE MUSCLES
- sheet-07 / MON / 1ST / SUCCESSORY WORK
- sheet-09 / MON / 1ST / CORE MUSCLES
- sheet-09 / FRI / 1ST / CORE MUSCLES
- sheet-10 / MON / 1ST / SUCCESSORY WORK
- sheet-12 / MON / 1ST / CORE MUSCLES
- sheet-12 / FRI / 1ST / CORE MUSCLES
- sheet-13 / MON / 1ST / SUCCESSORY WORK
- sheet-16 / MON / 1ST / SUCCESSORY WORK
- sheet-19 / MON / 1ST / SUCCESSORY WORK
- sheet-22 / MON / 1ST / SUCCESSORY WORK
- sheet-25 / MON / 1ST / SUCCESSORY WORK
- sheet-28 / MON / 1ST / SUCCESSORY WORK
- sheet-31 / MON / 1ST / SUCCESSORY WORK

### DB squats

occurrences (15):

- `DB squats [ 2x 15 kg ]`
- `10 DB squats [ 2x 15 kg ]`
- `DB squats`
- `30 DB squats [ 2x 15 kg ]`
- `50 DB squats [ 2x 15 kg ]`
- `15 DB squats [ 2x 15 kg ]`
- `7 DB squats [ 2x 15 kg ]`
- `20 DB squats [ 2x 15 kg ]`
- `9 DB squats [ 2x 15 kg ]`
- `60 DB squats [ 2x 15 kg ]`
- `10 DB squats[ 2x15 kg ]`
- `20 DB squats [ 2x15 kg ]`
- `30 DB squats [ 2x15 kg ]`
- `14 DB squats [ 2x15 kg ]`
- `18 DB squats [ 2x15 kg ]`

contexts (22):

- sheet-01 / MON / 1ST / STRENGTH ENDURANCE
- sheet-03 / MON / 1ST / STRENGTH ENDURANCE
- sheet-03 / FRI / 1ST / INTERVALS
- sheet-04 / MON / 1ST / INTERVALS
- sheet-05 / MON / 1ST / STRENGTH ENDURANCE
- sheet-05 / FRI / 1ST / INTERVALS
- sheet-06 / FRI / 1ST / CHIPPER
- sheet-08 / MON / 1ST / STRENGTH ENDURANCE
- sheet-11 / MON / 1ST / STRENGTH ENDURANCE
- sheet-15 / MON / 1ST / STRENGTH ENDURANCE
- sheet-20 / MON / 1ST / Temporarily without STRENGTH ENDURANCE
- sheet-21 / MON / 1ST / STRENGTH ENDURANCE
- sheet-23 / MON / 1ST / STRENGTH ENDURANCE
- sheet-26 / MON / 1ST / STRENGTH ENDURANCE
- sheet-26 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-27 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-28 / MON / 1ST / (implicit)
- sheet-29 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-30 / MON / 1ST / STRENGTH ENDURANCE
- sheet-30 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-32 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-33 / FRI / 1ST / STRENGTH ENDURANCE

### jumping Jacks

occurrences (14):

- `100 jumping Jacks`
- `36 jumping Jacks`
- `50 jumping Jacks`
- `25 jumping Jacks`
- `150 jumping Jacks [ ONLY ONCE before METCON ]`
- `30 jumping Jacks`
- `50 Jumping Jacks`
- `21 Jumping Jacks`
- `15 Jumping Jacks`
- `9 Jumping Jacks`
- `60 jumping Jacks`
- `27 Jumping Jacks`
- `75 jumping Jacks`
- `36 Jumping Jacks`

contexts (21):

- sheet-01 / WED / 1ST / STRENGTH ENDURANCE
- sheet-02 / MON / 1ST / INTERVALS
- sheet-02 / WED / 1ST / STRENGTH ENDURANCE
- sheet-02 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-03 / WED / 1ST / STRENGTH ENDURANCE
- sheet-04 / WED / 1ST / STRENGTH ENDURANCE
- sheet-06 / WED / 1ST / STRENGTH ENDURANCE
- sheet-21 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-22 / MON / 1ST / (implicit)
- sheet-22 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-23 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-24 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-25 / MON / 1ST / (implicit)
- sheet-25 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-26 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-27 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-28 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-30 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-31 / MON / 1ST / (implicit)
- sheet-31 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-33 / FRI / 1ST / STRENGTH ENDURANCE

### incline DB bench presses

occurrences (5):

- `10 incline DB bench presses [ 2x 15 kg ]`
- `incline DB bench presses [ 2x 15 kg ]`
- `12 incline DB bench presses [ 2x 15 kg ]`
- `7 incline DB bench presses [ 2x 15 kg ]`
- `30 incline DB bench presses [ 2x 15 kg ]`

contexts (20):

- sheet-01 / WED / 1ST / STRENGTH ENDURANCE
- sheet-02 / WED / 1ST / STRENGTH ENDURANCE
- sheet-03 / WED / 1ST / STRENGTH ENDURANCE
- sheet-05 / WED / 1ST / PUMP SESSION
- sheet-07 / WED / 1ST / PUMP SESSION
- sheet-08 / WED / 1ST / PUMP SESSION
- sheet-09 / SAT / 1ST / PUMP SESSION
- sheet-10 / WED / 1ST / PUMP SESSION
- sheet-11 / WED / 1ST / PUMP SESSION
- sheet-13 / WED / 1ST / PUMP SESSION
- sheet-14 / WED / 1ST / PUMP SESSION
- sheet-15 / WED / 1ST / PUMP SESSION
- sheet-16 / WED / 1ST / PUMP SESSION
- sheet-17 / WED / 1ST / PUMP SESSION
- sheet-18 / WED / 1ST / PUMP SESSION
- sheet-21 / WED / 1ST / PUMP SESSION
- sheet-24 / WED / 1ST / PUMP SESSION
- sheet-27 / WED / 1ST / PUMP SESSION
- sheet-30 / WED / 1ST / PUMP SESSION
- sheet-33 / WED / 1ST / PUMP SESSION

### Single Leg Single Kettlebell Deadlift

occurrences (3):

- `10 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]`
- `12 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]`
- `15-20 Single Leg Single Kettlebell Deadlift [ https://www.youtube.com/watch?v=VnHvZtV8Gz0 ]`

contexts (17):

- sheet-01 / FRI / 1ST / SUCCESSORY WORK
- sheet-02 / FRI / 1ST / SUCCESSORY WORK
- sheet-03 / FRI / 1ST / SUCCESSORY WORK
- sheet-04 / FRI / 1ST / SUCCESSORY WORK
- sheet-05 / FRI / 1ST / SUCCESSORY WORK
- sheet-06 / FRI / 1ST / SUCCESSORY WORK
- sheet-07 / FRI / 1ST / SUCCESSORY WORK
- sheet-09 / FRI / 1ST / SUCCESSORY WORK
- sheet-10 / FRI / 1ST / SUCCESSORY WORK
- sheet-12 / FRI / 1ST / SUCCESSORY WORK
- sheet-13 / FRI / 1ST / SUCCESSORY WORK
- sheet-16 / FRI / 1ST / SUCCESSORY WORK
- sheet-19 / FRI / 1ST / SUCCESSORY WORK
- sheet-22 / FRI / 1ST / SUCCESSORY WORK
- sheet-25 / FRI / 1ST / SUCCESSORY WORK
- sheet-28 / FRI / 1ST / SUCCESSORY WORK
- sheet-31 / FRI / 1ST / SUCCESSORY WORK

### DB Bulgarian split squats

occurrences (6):

- `10 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]`
- `12 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]`
- `30 DB Bulgarian split squats [ 2x 15 kg ] [ 15 reps each leg ]`
- `9 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]`
- `6 DB Bulgarian split squats [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]`
- `5 DB Bulgarian split squats [ 2x 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]`

contexts (16):

- sheet-02 / MON / 1ST / SUCCESSORY WORK
- sheet-03 / FRI / 1ST / SUCCESSORY WORK
- sheet-04 / MON / 1ST / SUCCESSORY WORK
- sheet-05 / MON / 1ST / STRENGTH ENDURANCE
- sheet-05 / FRI / 1ST / SUCCESSORY WORK
- sheet-06 / MON / 1ST / SUCCESSORY WORK
- sheet-08 / MON / 1ST / SUCCESSORY WORK
- sheet-09 / MON / 1ST / SUCCESSORY WORK
- sheet-11 / MON / 1ST / SUCCESSORY WORK
- sheet-12 / MON / 1ST / SUCCESSORY WORK
- sheet-14 / MON / 1ST / SUCCESSORY WORK
- sheet-15 / MON / 1ST / SUCCESSORY WORK
- sheet-17 / MON / 1ST / SUCCESSORY WORK
- sheet-20 / MON / 1ST / SUCCESSORY WORK
- sheet-23 / MON / 1ST / SUCCESSORY WORK
- sheet-26 / MON / 1ST / SUCCESSORY WORK

### DB halfkneeling press

occurrences (2):

- `10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]`
- `7 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]`

contexts (16):

- sheet-01 / FRI / 1ST / SUCCESSORY WORK
- sheet-03 / FRI / 1ST / SUCCESSORY WORK
- sheet-05 / FRI / 1ST / SUCCESSORY WORK
- sheet-07 / FRI / 1ST / SUCCESSORY WORK
- sheet-10 / FRI / 1ST / SUCCESSORY WORK
- sheet-11 / MON / 1ST / SUCCESSORY WORK
- sheet-13 / FRI / 1ST / SUCCESSORY WORK
- sheet-14 / MON / 1ST / SUCCESSORY WORK
- sheet-16 / FRI / 1ST / SUCCESSORY WORK
- sheet-17 / MON / 1ST / SUCCESSORY WORK
- sheet-20 / MON / 1ST / SUCCESSORY WORK
- sheet-23 / MON / 1ST / SUCCESSORY WORK
- sheet-26 / MON / 1ST / SUCCESSORY WORK
- sheet-28 / FRI / 1ST / SUCCESSORY WORK
- sheet-29 / MON / 1ST / SUCCESSORY WORK
- sheet-32 / MON / 1ST / SUCCESSORY WORK

### DB Horn Grip Shoulder Front Raise

occurrences (2):

- `10-12 DB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]`
- `10 DB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]`

contexts (16):

- sheet-08 / FRI / 1ST / SUCCESSORY WORK
- sheet-11 / FRI / 1ST / SUCCESSORY WORK
- sheet-14 / FRI / 1ST / SUCCESSORY WORK
- sheet-15 / FRI / 1ST / SUCCESSORY WORK
- sheet-17 / FRI / 1ST / SUCCESSORY WORK
- sheet-18 / FRI / 1ST / SUCCESSORY WORK
- sheet-20 / FRI / 1ST / SUCCESSORY WORK
- sheet-21 / FRI / 1ST / SUCCESSORY WORK
- sheet-23 / FRI / 1ST / SUCCESSORY WORK
- sheet-24 / FRI / 1ST / SUCCESSORY WORK
- sheet-26 / FRI / 1ST / SUCCESSORY WORK
- sheet-27 / FRI / 1ST / SUCCESSORY WORK
- sheet-29 / FRI / 1ST / SUCCESSORY WORK
- sheet-30 / FRI / 1ST / SUCCESSORY WORK
- sheet-32 / FRI / 1ST / SUCCESSORY WORK
- sheet-33 / FRI / 1ST / SUCCESSORY WORK

### KB Single Leg RDL to Reverse Lunge

occurrences (1):

- `10 KB Single Leg RDL to Reverse Lunge [ each leg ] [ https://www.youtube.com/watch?v=CpYyGD2hlv4 ]`

contexts (16):

- sheet-08 / FRI / 1ST / SUCCESSORY WORK
- sheet-11 / FRI / 1ST / SUCCESSORY WORK
- sheet-14 / FRI / 1ST / SUCCESSORY WORK
- sheet-15 / FRI / 1ST / SUCCESSORY WORK
- sheet-17 / FRI / 1ST / SUCCESSORY WORK
- sheet-18 / FRI / 1ST / SUCCESSORY WORK
- sheet-20 / FRI / 1ST / SUCCESSORY WORK
- sheet-21 / FRI / 1ST / SUCCESSORY WORK
- sheet-23 / FRI / 1ST / SUCCESSORY WORK
- sheet-24 / FRI / 1ST / SUCCESSORY WORK
- sheet-26 / FRI / 1ST / SUCCESSORY WORK
- sheet-27 / FRI / 1ST / SUCCESSORY WORK
- sheet-29 / FRI / 1ST / SUCCESSORY WORK
- sheet-30 / FRI / 1ST / SUCCESSORY WORK
- sheet-32 / FRI / 1ST / SUCCESSORY WORK
- sheet-33 / FRI / 1ST / SUCCESSORY WORK

### RUN 5-6 km

occurrences (1):

- `RUN 5-6 km`

contexts (16):

- sheet-10 / TUE / 1ST / (implicit)
- sheet-10 / SAT / 1ST / (implicit)
- sheet-13 / TUE / 1ST / (implicit)
- sheet-13 / SAT / 1ST / (implicit)
- sheet-16 / TUE / 1ST / (implicit)
- sheet-16 / SAT / 1ST / (implicit)
- sheet-19 / TUE / 1ST / (implicit)
- sheet-19 / SAT / 1ST / (implicit)
- sheet-22 / TUE / 1ST / (implicit)
- sheet-22 / SAT / 1ST / (implicit)
- sheet-25 / TUE / 1ST / (implicit)
- sheet-25 / SAT / 1ST / (implicit)
- sheet-28 / TUE / 1ST / (implicit)
- sheet-28 / SAT / 1ST / (implicit)
- sheet-31 / TUE / 1ST / (implicit)
- sheet-31 / SAT / 1ST / (implicit)

### TWO ARMS rear delt with BANDED

occurrences (3):

- `10-12 TWO ARMS rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]`
- `20 TWO ARMS rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]`
- `10 TWO ARMS rear delt with BANDED [ https://www.youtube.com/watch?v=dBJzki-hKfo ]`

contexts (16):

- sheet-08 / FRI / 1ST / SUCCESSORY WORK
- sheet-11 / FRI / 1ST / SUCCESSORY WORK
- sheet-14 / FRI / 1ST / SUCCESSORY WORK
- sheet-15 / FRI / 1ST / SUCCESSORY WORK
- sheet-17 / FRI / 1ST / SUCCESSORY WORK
- sheet-18 / FRI / 1ST / SUCCESSORY WORK
- sheet-20 / FRI / 1ST / SUCCESSORY WORK
- sheet-21 / FRI / 1ST / SUCCESSORY WORK
- sheet-23 / FRI / 1ST / SUCCESSORY WORK
- sheet-24 / FRI / 1ST / SUCCESSORY WORK
- sheet-26 / FRI / 1ST / SUCCESSORY WORK
- sheet-27 / FRI / 1ST / SUCCESSORY WORK
- sheet-29 / FRI / 1ST / SUCCESSORY WORK
- sheet-30 / FRI / 1ST / SUCCESSORY WORK
- sheet-32 / FRI / 1ST / SUCCESSORY WORK
- sheet-33 / FRI / 1ST / SUCCESSORY WORK

### horizontal pull-ups

occurrences (2):

- `10 horizontal pull-ups`
- `15 horizontal pull-ups`

contexts (15):

- sheet-03 / SAT / 1ST / GYMNASTICS
- sheet-05 / SAT / 1ST / GYMNASTICS
- sheet-07 / SAT / 1ST / GYMNASTICS
- sheet-08 / SAT / 1ST / GYMNASTICS
- sheet-10 / SAT / 1ST / GYMNASTICS
- sheet-11 / SAT / 1ST / GYMNASTICS
- sheet-13 / SAT / 1ST / GYMNASTICS
- sheet-15 / SAT / 1ST / GYMNASTICS
- sheet-16 / SAT / 1ST / GYMNASTICS
- sheet-18 / SAT / 1ST / GYMNASTICS
- sheet-21 / SAT / 1ST / GYMNASTICS
- sheet-24 / SAT / 1ST / GYMNASTICS
- sheet-27 / SAT / 1ST / GYMNASTICS
- sheet-30 / SAT / 1ST / GYMNASTICS
- sheet-33 / SAT / 1ST / GYMNASTICS

### RUN 5-7 km

occurrences (1):

- `RUN 5-7 km`

contexts (15):

- sheet-01 / SAT / 1ST / (implicit)
- sheet-02 / SAT / 1ST / (implicit)
- sheet-03 / SAT / 1ST / (implicit)
- sheet-04 / SAT / 1ST / (implicit)
- sheet-05 / SAT / 1ST / (implicit)
- sheet-06 / SAT / 1ST / (implicit)
- sheet-07 / SAT / 1ST / (implicit)
- sheet-17 / SAT / 1ST / (implicit)
- sheet-20 / SAT / 1ST / (implicit)
- sheet-23 / SAT / 1ST / (implicit)
- sheet-26 / SAT / 1ST / (implicit)
- sheet-29 / SAT / 1ST / (implicit)
- sheet-30 / SAT / 1ST / (implicit)
- sheet-32 / SAT / 1ST / (implicit)
- sheet-33 / SAT / 1ST / (implicit)

### RUN 5 km

occurrences (1):

- `RUN 5 km`

contexts (12):

- sheet-01 / TUE / 1ST / (implicit)
- sheet-02 / TUE / 1ST / (implicit)
- sheet-03 / TUE / 1ST / (implicit)
- sheet-04 / TUE / 1ST / (implicit)
- sheet-05 / TUE / 1ST / (implicit)
- sheet-06 / TUE / 1ST / (implicit)
- sheet-07 / TUE / 1ST / (implicit)
- sheet-21 / TUE / 1ST / (implicit)
- sheet-24 / TUE / 1ST / (implicit)
- sheet-27 / TUE / 1ST / (implicit)
- sheet-30 / TUE / 1ST / (implicit)
- sheet-33 / TUE / 1ST / (implicit)

### DB Snatches

occurrences (10):

- `DB Snatches [ 15 kg ] [ alternative ]`
- `18 DB snatches [ 1x 15 kg ]`
- `DB Snatches [ 2x 15 kg ]`
- `30 DB Snatches [ 1x 15 kg ]`
- `10 DB snatches [ 2x 15 kg ]`
- `5 DB snatches [ 2x 15 kg ]`
- `8 DB snatches [ 2x 15 kg ]`
- `12 DB snatches [ 2x 15 kg ]`
- `20 DB snatches [ 2x 15 kg ]`
- `DB snatches [ 1x 15 kg ]`

contexts (11):

- sheet-01 / MON / 1ST / STRENGTH ENDURANCE
- sheet-02 / MON / 1ST / INTERVALS
- sheet-03 / MON / 1ST / STRENGTH ENDURANCE
- sheet-05 / MON / 1ST / STRENGTH ENDURANCE
- sheet-08 / MON / 1ST / STRENGTH ENDURANCE
- sheet-11 / MON / 1ST / STRENGTH ENDURANCE
- sheet-14 / MON / 1ST / STRENGTH ENDURANCE
- sheet-15 / MON / 1ST / STRENGTH ENDURANCE
- sheet-23 / MON / 1ST / STRENGTH ENDURANCE
- sheet-26 / MON / 1ST / STRENGTH ENDURANCE
- sheet-28 / MON / 1ST / (implicit)

### push ups

occurrences (3):

- `10-15 push ups`
- `15 push ups`
- `10 push ups`

contexts (11):

- sheet-04 / WED / 1ST / Basic GYMNASTICS
- sheet-06 / WED / 1ST / Basic GYMNASTICS
- sheet-08 / SAT / 1ST / GYMNASTICS
- sheet-11 / SAT / 1ST / GYMNASTICS
- sheet-15 / SAT / 1ST / GYMNASTICS
- sheet-18 / SAT / 1ST / GYMNASTICS
- sheet-21 / SAT / 1ST / GYMNASTICS
- sheet-24 / SAT / 1ST / GYMNASTICS
- sheet-27 / SAT / 1ST / GYMNASTICS
- sheet-30 / SAT / 1ST / GYMNASTICS
- sheet-33 / SAT / 1ST / GYMNASTICS

### km run

occurrences (3):

- `3-5 km run`
- `5 km RUN`
- `5 km run`

contexts (10):

- sheet-11 / TUE / 1ST / (implicit)
- sheet-12 / TUE / 1ST / (implicit)
- sheet-12 / SAT / 1ST / (implicit)
- sheet-14 / TUE / 1ST / (implicit)
- sheet-17 / TUE / 1ST / (implicit)
- sheet-20 / TUE / 1ST / (implicit)
- sheet-23 / TUE / 1ST / (implicit)
- sheet-26 / TUE / 1ST / (implicit)
- sheet-29 / TUE / 1ST / (implicit)
- sheet-32 / TUE / 1ST / (implicit)

### alternative DB press

occurrences (1):

- `10 alternative DB press [ https://www.youtube.com/watch?v=T9OFhjgXt6c ]`

contexts (9):

- sheet-01 / MON / 1ST / SUCCESSORY WORK
- sheet-02 / MON / 1ST / SUCCESSORY WORK
- sheet-03 / MON / 1ST / SUCCESSORY WORK
- sheet-04 / MON / 1ST / SUCCESSORY WORK
- sheet-05 / MON / 1ST / SUCCESSORY WORK
- sheet-06 / MON / 1ST / SUCCESSORY WORK
- sheet-07 / MON / 1ST / SUCCESSORY WORK
- sheet-09 / MON / 1ST / SUCCESSORY WORK
- sheet-12 / MON / 1ST / SUCCESSORY WORK

### DB hang power cleans

occurrences (7):

- `4 DB hang power cleans [ 2x 15 kg ]`
- `5 DB hang power cleans [ 2x 15 kg ]`
- `9 DB hang power cleans [ 2x 15 kg ]`
- `DB hang power cleans`
- `25 DB hang power cleans [ 2x 15 kg ]`
- `6 DB hang power cleans [ 2x 15 kg ]`
- `9 DB hang power cleans`

contexts (9):

- sheet-01 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-02 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-04 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-05 / FRI / 1ST / INTERVALS
- sheet-06 / FRI / 1ST / CHIPPER
- sheet-09 / FRI / 1ST / INTERVALS
- sheet-10 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-20 / FRI / 1ST / (implicit)
- sheet-30 / FRI / 1ST / STRENGTH ENDURANCE

### Low Hold KB Cossack Squat

occurrences (1):

- `10 Low Hold KB Cossack Squat [ 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=ZclBW2lK-lY ]`

contexts (9):

- sheet-08 / MON / 1ST / SUCCESSORY WORK
- sheet-11 / MON / 1ST / SUCCESSORY WORK
- sheet-15 / MON / 1ST / SUCCESSORY WORK
- sheet-18 / MON / 1ST / SUCCESSORY WORK
- sheet-21 / MON / 1ST / SUCCESSORY WORK
- sheet-24 / MON / 1ST / SUCCESSORY WORK
- sheet-27 / MON / 1ST / SUCCESSORY WORK
- sheet-30 / MON / 1ST / SUCCESSORY WORK
- sheet-33 / MON / 1ST / SUCCESSORY WORK

### bar dips + traverses + turn back 180\* + traverses

occurrences (1):

- `bar dips + traverses + turn back 180* + traverses`

contexts (8):

- sheet-10 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-13 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-16 / WED / 1ST / Basic GYMNASTICS
- sheet-19 / WED / 1ST / Basic GYMNASTICS
- sheet-22 / WED / 1ST / Basic GYMNASTICS
- sheet-25 / WED / 1ST / Basic GYMNASTICS
- sheet-28 / WED / 1ST / Basic GYMNASTICS
- sheet-31 / WED / 1ST / Basic GYMNASTICS

### DB thrusters

occurrences (6):

- `3 min: 12-9-6 DB thrusters [ 2x 15 kg ]`
- `DB Thrusters`
- `30 DB thrusters [ 2x 15 kg ]`
- `5 DB Thrusters [ 2x 15 kg ]`
- `3 & 4 min: 12-9-6 DB thrusters [ 2x 15 kg ]`
- `DB thrusters [ 1x 15 kg ] [ kind of wall balls ]`

contexts (8):

- sheet-08 / FRI / 1ST / (implicit)
- sheet-10 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-12 / FRI / 1ST / STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]
- sheet-13 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-15 / FRI / 1ST / (implicit)
- sheet-23 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-24 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-28 / MON / 1ST / (implicit)

### Glute Loop DB Hip Thrust

occurrences (3):

- `10 Glute Loop DB Hip Thrust [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=YdhYJv9ccPQ ]`
- `15 Glute Loop DB Hip Thrust [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=YdhYJv9ccPQ ]`
- `14 Glute Loop DB Hip Thrust [ + 2 sec pause in UP ] [ https://www.youtube.com/watch?v=YdhYJv9ccPQ ]`

contexts (8):

- sheet-11 / MON / 1ST / SUCCESSORY WORK
- sheet-14 / MON / 1ST / SUCCESSORY WORK
- sheet-17 / MON / 1ST / SUCCESSORY WORK
- sheet-20 / MON / 1ST / SUCCESSORY WORK
- sheet-23 / MON / 1ST / SUCCESSORY WORK
- sheet-26 / MON / 1ST / SUCCESSORY WORK
- sheet-29 / MON / 1ST / SUCCESSORY WORK
- sheet-32 / MON / 1ST / SUCCESSORY WORK

### traverses + strict bar dips

occurrences (1):

- `traverses + strict bar dips`

contexts (8):

- sheet-11 / WED / 1ST / Basic GYMNASTICS
- sheet-14 / WED / 1ST / Basic GYMNASTICS
- sheet-17 / WED / 1ST / Basic GYMNASTICS
- sheet-20 / WED / 1ST / Basic GYMNASTICS
- sheet-23 / WED / 1ST / Basic GYMNASTICS
- sheet-26 / WED / 1ST / Basic GYMNASTICS
- sheet-29 / WED / 1ST / Basic GYMNASTICS
- sheet-32 / WED / 1ST / Basic GYMNASTICS

### 3x 10 DB Jefferson curls

occurrences (1):

- `3x 10 DB Jefferson curls [ 15 kg ] [ https://www.youtube.com/watch?v=YGlAdtSKQaU ]`

contexts (7):

- sheet-14 / MON / 1ST / CORE MUSCLES
- sheet-17 / MON / 1ST / CORE MUSCLES
- sheet-20 / MON / 1ST / CORE MUSCLES
- sheet-23 / MON / 1ST / CORE MUSCLES
- sheet-26 / MON / 1ST / CORE MUSCLES
- sheet-29 / MON / 1ST / CORE MUSCLES
- sheet-32 / MON / 1ST / CORE MUSCLES

### DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses

occurrences (3):

- `10 DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ] [ another ARM HOLD DB in UP ]`
- `5 DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ] [ another ARM HOLD DB in UP ]`
- `10 DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ] [ another ARM HOLD KB 24 kg in UP ]`

contexts (6):

- sheet-19 / WED / 1ST / PUMP SESSION
- sheet-22 / WED / 1ST / PUMP SESSION
- sheet-23 / WED / 1ST / Basic GYMNASTICS
- sheet-25 / WED / 1ST / PUMP SESSION
- sheet-28 / WED / 1ST / PUMP SESSION
- sheet-31 / WED / 1ST / PUMP SESSION

### DB Bulgarian split squats + 10 withot DB

occurrences (1):

- `10 DB Bulgarian split squats + 10 withot DB [ 2x 15 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]`

contexts (6):

- sheet-18 / MON / 1ST / SUCCESSORY WORK
- sheet-21 / MON / 1ST / SUCCESSORY WORK
- sheet-24 / MON / 1ST / SUCCESSORY WORK
- sheet-27 / MON / 1ST / SUCCESSORY WORK
- sheet-30 / MON / 1ST / SUCCESSORY WORK
- sheet-33 / MON / 1ST / SUCCESSORY WORK

### plyo push ups

occurrences (1):

- `10 plyo push ups`

contexts (6):

- sheet-19 / SAT / 1ST / PUMP SESSION
- sheet-22 / SAT / 1ST / PUMP SESSION
- sheet-25 / SAT / 1ST / PUMP SESSION
- sheet-28 / SAT / 1ST / PUMP SESSION
- sheet-30 / WED / 1ST / PUMP SESSION
- sheet-31 / SAT / 1ST / PUMP SESSION

### alt. DB bench presses

occurrences (1):

- `20 alt. DB bench presses [ 2x 15 kg ] [ https://www.youtube.com/watch?v=7CHPqVxJOUE ]`

contexts (5):

- sheet-20 / SAT / 1ST / PUMP SESSION
- sheet-23 / SAT / 1ST / PUMP SESSION
- sheet-26 / SAT / 1ST / PUMP SESSION
- sheet-29 / SAT / 1ST / PUMP SESSION
- sheet-32 / SAT / 1ST / PUMP SESSION

### bar dips

occurrences (2):

- `bar dips`
- `10 bar dips`

contexts (5):

- sheet-14 / SAT / 1ST / GYMNASTICS
- sheet-17 / SAT / 1ST / GYMNASTICS
- sheet-26 / SAT / 1ST / Basic GYMNASTICS
- sheet-29 / SAT / 1ST / Basic GYMNASTICS
- sheet-32 / SAT / 1ST / Basic GYMNASTICS

### DB bent over row

occurrences (1):

- `10 DB bent over row [ 2x 15 kg ]`

contexts (5):

- sheet-20 / SAT / 1ST / PUMP SESSION
- sheet-23 / SAT / 1ST / PUMP SESSION
- sheet-26 / SAT / 1ST / PUMP SESSION
- sheet-29 / SAT / 1ST / PUMP SESSION
- sheet-32 / SAT / 1ST / PUMP SESSION

### DB leg extension

occurrences (2):

- `15-20 DB leg extension [ https://www.youtube.com/watch?v=vyZuR5deqE8 ]`
- `10-15 DB leg extension [ https://youtube.com/shorts/7mvLB5aq3fc?si=Hzy4Kur8ISirBJgv ]`

contexts (5):

- sheet-04 / FRI / 1ST / SUCCESSORY WORK
- sheet-06 / FRI / 1ST / SUCCESSORY WORK
- sheet-09 / FRI / 1ST / SUCCESSORY WORK
- sheet-12 / FRI / 1ST / SUCCESSORY WORK
- sheet-28 / MON / 1ST / SUCCESSORY WORK

### DB pull overs

occurrences (1):

- `10 DB pull overs`

contexts (5):

- sheet-20 / SAT / 1ST / PUMP SESSION
- sheet-23 / SAT / 1ST / PUMP SESSION
- sheet-26 / SAT / 1ST / PUMP SESSION
- sheet-29 / SAT / 1ST / PUMP SESSION
- sheet-32 / SAT / 1ST / PUMP SESSION

### DB Seated Single Arm Arnold Press

occurrences (1):

- `10 DB Seated Single Arm Arnold Press [ each arm ] [ https://www.youtube.com/watch?v=3Lhln4TspkU ]`

contexts (5):

- sheet-02 / FRI / 1ST / SUCCESSORY WORK
- sheet-04 / FRI / 1ST / SUCCESSORY WORK
- sheet-06 / FRI / 1ST / SUCCESSORY WORK
- sheet-09 / FRI / 1ST / SUCCESSORY WORK
- sheet-12 / FRI / 1ST / SUCCESSORY WORK

### deficit DB push ups

occurrences (1):

- `10 deficit DB push ups`

contexts (5):

- sheet-20 / SAT / 1ST / PUMP SESSION
- sheet-23 / SAT / 1ST / PUMP SESSION
- sheet-26 / SAT / 1ST / PUMP SESSION
- sheet-29 / SAT / 1ST / PUMP SESSION
- sheet-32 / SAT / 1ST / PUMP SESSION

### deficit HSPU

occurrences (4):

- `5 deficit HSPU [ from sofa/box ] [ hand on DB | neutral grip ]`
- `deficit HSPU [ from sofa ] [ hands on DB ]`
- `6 deficit HSPU [ from sofa ]`
- `3 deficit HSPU [ from sofa/box ] [ hand on DB | neutral grip ]`

contexts (5):

- sheet-27 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-28 / MON / 1ST / (implicit)
- sheet-28 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-30 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-33 / FRI / 1ST / STRENGTH ENDURANCE

### incline DB bench presses [ 2x 15 kg ] + 10 plyo push ups

occurrences (1):

- `10 incline DB bench presses [ 2x 15 kg ] + 10 plyo push ups`

contexts (5):

- sheet-19 / WED / 1ST / PUMP SESSION
- sheet-22 / WED / 1ST / PUMP SESSION
- sheet-25 / WED / 1ST / PUMP SESSION
- sheet-28 / WED / 1ST / PUMP SESSION
- sheet-31 / WED / 1ST / PUMP SESSION

### KB [ 24 kg ] single arm row

occurrences (1):

- `10 KB [ 24 kg ] single arm row [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]`

contexts (5):

- sheet-19 / SAT / 1ST / PUMP SESSION
- sheet-22 / SAT / 1ST / PUMP SESSION
- sheet-25 / SAT / 1ST / PUMP SESSION
- sheet-28 / SAT / 1ST / PUMP SESSION
- sheet-31 / SAT / 1ST / PUMP SESSION

### KB Horn Grip Shoulder Front Raise

occurrences (1):

- `10 KB Horn Grip Shoulder Front Raise [ https://www.youtube.com/watch?v=HHEmtCuuPss ]`

contexts (5):

- sheet-02 / FRI / 1ST / SUCCESSORY WORK
- sheet-04 / FRI / 1ST / SUCCESSORY WORK
- sheet-06 / FRI / 1ST / SUCCESSORY WORK
- sheet-09 / FRI / 1ST / SUCCESSORY WORK
- sheet-12 / FRI / 1ST / SUCCESSORY WORK

### Single Leg KB Hip Thrust

occurrences (2):

- `15 Single Leg KB Hip Thrust [ + 1 sec pause in UP position ] [ each leg ]`
- `10 Single Leg KB Hip Thrust [ + 1 sec pause in UP position ] [ each leg ]`

contexts (5):

- sheet-02 / FRI / 1ST / SUCCESSORY WORK
- sheet-04 / FRI / 1ST / SUCCESSORY WORK
- sheet-06 / FRI / 1ST / SUCCESSORY WORK
- sheet-09 / FRI / 1ST / SUCCESSORY WORK
- sheet-12 / FRI / 1ST / SUCCESSORY WORK

### traverses + 8 bar dips + traverses + 7 bar dips

occurrences (1):

- `traverses + 8 bar dips + traverses + 7 bar dips`

contexts (5):

- sheet-08 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-15 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-18 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-27 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-33 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics

### Incline DB Prone Row

occurrences (2):

- `10 Incline DB Prone Row [ https://www.youtube.com/watch?v=7fxY8buPV0Q ] [ 2x 15 kg ]`
- `15 Incline DB Prone Row [ https://www.youtube.com/watch?v=7fxY8buPV0Q ] [ 2x 15 kg ]`

contexts (4):

- sheet-04 / WED / 1ST / STRENGTH ENDURANCE
- sheet-06 / WED / 1ST / STRENGTH ENDURANCE
- sheet-09 / WED / 1ST / PUMP SESSION
- sheet-12 / WED / 1ST / PUMP SESSION

### KB push press [ 24 kg ] + 10 DB halfkneeling press

occurrences (1):

- `5 KB push press [ 24 kg ] + 10 DB halfkneeling press [ each arm ] [ https://www.youtube.com/watch?v=-7zgcCU2kW4 ]`

contexts (4):

- sheet-19 / FRI / 1ST / SUCCESSORY WORK
- sheet-22 / FRI / 1ST / SUCCESSORY WORK
- sheet-25 / FRI / 1ST / SUCCESSORY WORK
- sheet-31 / FRI / 1ST / SUCCESSORY WORK

### KB swings

occurrences (4):

- `10 KB swings [ 24 kg | to the parallel ] [ emphasis on the gluteal muscles ]`
- `30 KB swings [ 24 kg ]`
- `15 KB swings [ 24 kg ]`
- `12 KB Swings [ 24 kg ]`

contexts (4):

- sheet-10 / FRI / 1ST / SUCCESSORY WORK
- sheet-12 / FRI / 1ST / STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]
- sheet-13 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-23 / MON / 1ST / STRENGTH ENDURANCE

### RUN

occurrences (1):

- `RUN`

contexts (4):

- sheet-15 / TUE / 1ST / (implicit)
- sheet-15 / SAT / 1ST / (implicit)
- sheet-18 / TUE / 1ST / (implicit)
- sheet-18 / SAT / 1ST / (implicit)

### Straight Arm Banded Lat Pull Down

occurrences (2):

- `10-15 Straight Arm Banded Lat Pull Down [ https://www.youtube.com/watch?v=LfGyMCw_Zd0 ]`
- `12 Straight Arm Banded Lat Pull Down [ https://www.youtube.com/watch?v=LfGyMCw_Zd0 ]`

contexts (4):

- sheet-04 / WED / 1ST / Basic GYMNASTICS
- sheet-06 / WED / 1ST / Basic GYMNASTICS
- sheet-09 / WED / 1ST / PUMP SESSION
- sheet-12 / WED / 1ST / PUMP SESSION

### strict DB press + 10 DB push press + 5 strict DB press

occurrences (1):

- `5 strict DB press + 10 DB push press + 5 strict DB press [ 2x 15 kg ]`

contexts (4):

- sheet-19 / MON / 1ST / SUCCESSORY WORK
- sheet-22 / MON / 1ST / SUCCESSORY WORK
- sheet-25 / MON / 1ST / SUCCESSORY WORK
- sheet-31 / MON / 1ST / SUCCESSORY WORK

### strict DB press + 7 DB push press [ 2x 15 kg ]

occurrences (2):

- `5 strict DB press + 7 DB push press [ 2x 15 kg ] | [ 2 sec SLOW down ]`
- `7 strict DB press + 7 DB push press [ 2x 15 kg ] | [ 2 sec SLOW down ]`

contexts (4):

- sheet-13 / MON / 1ST / SUCCESSORY WORK
- sheet-18 / MON / 1ST / SUCCESSORY WORK
- sheet-21 / MON / 1ST / SUCCESSORY WORK
- sheet-24 / MON / 1ST / SUCCESSORY WORK

### traverses + 5 bar dips + traverses + 5 bar dips

occurrences (1):

- `traverses + 5 bar dips + traverses + 5 bar dips`

contexts (4):

- sheet-09 / SAT / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-12 / SAT / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-21 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-24 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics

### traverses + 7 bar dips + traverses + 7 bar dips

occurrences (1):

- `traverses + 7 bar dips + traverses + 7 bar dips`

contexts (4):

- sheet-09 / SAT / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-12 / SAT / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-21 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-24 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics

### traverses + 9 bar dips + traverses + 9 bar dips

occurrences (1):

- `traverses + 9 bar dips + traverses + 9 bar dips`

contexts (4):

- sheet-09 / SAT / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-12 / SAT / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-21 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-24 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics

### burpees

occurrences (2):

- `1st & 2nd min: 10 burpees [ WITHOUT JUMP ]`
- `20 burpees`

contexts (3):

- sheet-08 / FRI / 1ST / (implicit)
- sheet-14 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-15 / FRI / 1ST / (implicit)

### DB A-push ups

occurrences (1):

- `10 DB A-push ups [ https://www.youtube.com/watch?v=zjEHDw569b0 ]`

contexts (3):

- sheet-14 / WED / 1ST / Basic GYMNASTICS
- sheet-17 / WED / 1ST / Basic GYMNASTICS
- sheet-20 / WED / 1ST / Basic GYMNASTICS

### DB lunges

occurrences (3):

- `50 DB lunges [ 2x 15 kg ]`
- `10 DB lunges [ 2x 15 kg ] [ hold farm carry ]`
- `12 DB lunges [ 2x 15 kg ]`

contexts (3):

- sheet-06 / FRI / 1ST / CHIPPER
- sheet-13 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-28 / FRI / 1ST / STRENGTH ENDURANCE

### DB power snatches

occurrences (2):

- `DB power snatches [ 2x 15 kg ]`
- `14 DB power snatches [ 2x 15 kg ]`

contexts (3):

- sheet-07 / MON / 1ST / STRENGTH ENDURANCE
- sheet-10 / MON / 1ST / STRENGTH ENDURANCE
- sheet-13 / MON / 1ST / (implicit)

### DB snatch + DB squats

occurrences (1):

- `DB snatch + DB squats [ 2x 15 kg ]`

contexts (3):

- sheet-24 / MON / 1ST / STRENGTH ENDURANCE
- sheet-27 / MON / 1ST / STRENGTH ENDURANCE
- sheet-33 / MON / 1ST / STRENGTH ENDURANCE

### jumping Jack's

occurrences (3):

- `50 jumping Jack's`
- `25 jumping Jack's`
- `1 min: 25 jumping Jack's`

contexts (3):

- sheet-04 / MON / 1ST / INTERVALS
- sheet-05 / FRI / 1ST / INTERVALS
- sheet-07 / FRI / 1ST / (implicit)

### KB clean & push press

occurrences (5):

- `30 KB clean & push press [ 24 kg ] [ 15 each arm ]`
- `10 KB clean & push press [ 24 kg ] [ 5 each arm ]`
- `20 KB clean & push press [ 24 kg ] [ 10 each arm ]`
- `18 KB clean & push press [ 24 kg ] [ 9 each arm ]`
- `14 KB clean & push press [ 24 kg ] [ 7 each arm ]`

contexts (3):

- sheet-26 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-29 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-32 / FRI / 1ST / STRENGTH ENDURANCE

### RUN 7 km

occurrences (1):

- `RUN 7 km`

contexts (3):

- sheet-21 / SAT / 1ST / (implicit)
- sheet-24 / SAT / 1ST / (implicit)
- sheet-27 / SAT / 1ST / (implicit)

### single arm row

occurrences (2):

- `15 single arm row [ 5 KB 24 kg + 10 DB 15 kg ] [ LEFT ARM ]`
- `15 single arm row [ 5 KB 24 kg + 10 DB 15 kg ] [ RIGHT ARM ]`

contexts (3):

- sheet-26 / WED / 1ST / PUMP SESSION
- sheet-29 / WED / 1ST / PUMP SESSION
- sheet-32 / WED / 1ST / PUMP SESSION

### single unders

occurrences (2):

- `150 single unders`
- `100 single unders`

contexts (3):

- sheet-05 / WED / 1ST / STRENGTH ENDURANCE
- sheet-06 / MON / 1ST / STRENGTH ENDURANCE
- sheet-07 / WED / 1ST / STRENGTH ENDURANCE

### single unders AFTER each set

occurrences (2):

- `*150 single unders AFTER each set`
- `*100 single unders AFTER each set`

contexts (3):

- sheet-02 / WED / 1ST / Basic GYMNASTICS
- sheet-04 / WED / 1ST / Basic GYMNASTICS
- sheet-06 / WED / 1ST / Basic GYMNASTICS

### strict bar dips OR 10 push ups

occurrences (1):

- `5 strict bar dips OR 10 push ups`

contexts (3):

- sheet-05 / SAT / 1ST / GYMNASTICS
- sheet-07 / SAT / 1ST / GYMNASTICS
- sheet-10 / SAT / 1ST / GYMNASTICS

### strict DB press + 5 DB push press [ 2x 15 kg ]

occurrences (1):

- `5 strict DB press + 5 DB push press [ 2x 15 kg ] | [ 2 sec SLOW down ]`

contexts (3):

- sheet-08 / MON / 1ST / SUCCESSORY WORK
- sheet-10 / MON / 1ST / SUCCESSORY WORK
- sheet-15 / MON / 1ST / SUCCESSORY WORK

### traverses + 6 bar dips + traverses + 3 bar dips

occurrences (1):

- `traverses + 6 bar dips + traverses + 3 bar dips`

contexts (3):

- sheet-08 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-15 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-18 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics

### traverses + 7 bar dips + traverses + 5 bar dips

occurrences (1):

- `traverses + 7 bar dips + traverses + 5 bar dips`

contexts (3):

- sheet-08 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-15 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-18 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics

### 30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK

occurrences (1):

- `* 30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK [ after each GYMNASTICS round ]`

contexts (2):

- sheet-09 / WED / 1ST / Basic GYMNASTICS
- sheet-11 / WED / 1ST / Basic GYMNASTICS

### air squats

occurrences (2):

- `9 air squats`
- `21 AIR squats`

contexts (2):

- sheet-09 / FRI / 1ST / INTERVALS
- sheet-13 / MON / 1ST / (implicit)

### C2B pull-ups

occurrences (1):

- `5 C2B pull-ups`

contexts (2):

- sheet-26 / SAT / 1ST / Basic GYMNASTICS
- sheet-29 / SAT / 1ST / Basic GYMNASTICS

### DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses

occurrences (1):

- `5 DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]`

contexts (2):

- sheet-29 / WED / 1ST / PUMP SESSION
- sheet-32 / WED / 1ST / PUMP SESSION

### DB bench presses [ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses

occurrences (1):

- `5 DB bench presses [ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses [ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ]`

contexts (2):

- sheet-29 / WED / 1ST / PUMP SESSION
- sheet-32 / WED / 1ST / PUMP SESSION

### DB bench presses LEFT arm | RIGHT arm HOLD in UP

occurrences (1):

- `10 DB bench presses LEFT arm | RIGHT arm HOLD in UP [ 2x 15 kg ]`

contexts (2):

- sheet-27 / WED / 1ST / PUMP SESSION
- sheet-33 / WED / 1ST / PUMP SESSION

### DB bench presses RIGHT arm | LEFT arm HOLD in UP

occurrences (1):

- `10 DB bench presses RIGHT arm | LEFT arm HOLD in UP [ 2x 15 kg ]`

contexts (2):

- sheet-27 / WED / 1ST / PUMP SESSION
- sheet-33 / WED / 1ST / PUMP SESSION

### DB deadlifts

occurrences (2):

- `25 DB deadlifts [ 2x 15 kg ]`
- `12 DB deadlifts`

contexts (2):

- sheet-06 / FRI / 1ST / CHIPPER
- sheet-20 / FRI / 1ST / (implicit)

### DB farmer carry lunges

occurrences (2):

- `8 DB farmer carry lunges [ 2x 15 kg ] [ 4 each leg ]`
- `10 DB farmer carry lunges [ 2x 15 kg ] [ 5 each leg ]`

contexts (2):

- sheet-01 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-02 / FRI / 1ST / STRENGTH ENDURANCE

### DB floor Fly

occurrences (1):

- `10 DB floor Fly [ 2x 15 kg ] [ https://www.youtube.com/watch?v=bgC53-J-6gA ]`

contexts (2):

- sheet-09 / WED / 1ST / PUMP SESSION
- sheet-12 / WED / 1ST / PUMP SESSION

### DB Glute Bridge Bench Press

occurrences (2):

- `10 DB Glute Bridge Bench Press [ 2x 15 kg ] [ https://www.youtube.com/watch?v=CyHxva5XYYY ]`
- `12 DB Glute Bridge Bench Press [ 2x 15 kg ] [ https://www.youtube.com/watch?v=CyHxva5XYYY ]`

contexts (2):

- sheet-09 / WED / 1ST / PUMP SESSION
- sheet-12 / WED / 1ST / PUMP SESSION

### DB hang power cleans + push press

occurrences (1):

- `7 DB hang power cleans + push press [ 2x 15 kg ]`

contexts (2):

- sheet-27 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-33 / FRI / 1ST / STRENGTH ENDURANCE

### DB INCLINE bench presses

occurrences (1):

- `10 DB INCLINE bench presses [ 2x 15 kg ]`

contexts (2):

- sheet-29 / WED / 1ST / PUMP SESSION
- sheet-32 / WED / 1ST / PUMP SESSION

### DB Renegade row [ https://www.youtube.com/watch?v=bi1Nf5G86gU ]

occurrences (2):

- `30 DB Renegade row [ https://www.youtube.com/watch?v=bi1Nf5G86gU ] { 1 push up + each arm row = 1 rep }`
- `DB Renegade row [ https://www.youtube.com/watch?v=bi1Nf5G86gU ] { 1 push up + each arm row = 1 rep }`

contexts (2):

- sheet-09 / WED / 1ST / PUMP SESSION
- sheet-12 / WED / 1ST / PUMP SESSION

### DB snatches + DB thrusters

occurrences (3):

- `10 DB snatches + DB thrusters [ 1x 15 kg ] [ LEFT arm ]`
- `10 DB snatches + DB thrusters [ 1x 15 kg ] [ RIGHT arm ]`
- `7 DB snatches + DB thrusters [ 2x 15 kg ]`

contexts (2):

- sheet-29 / MON / 1ST / STRENGTH ENDURANCE
- sheet-32 / MON / 1ST / STRENGTH ENDURANCE

### DB squats [ 2x 15 kg ] + 10 V-ups

occurrences (1):

- `10 DB squats [ 2x 15 kg ] + 10 V-ups`

contexts (2):

- sheet-22 / MON / 1ST / (implicit)
- sheet-25 / MON / 1ST / (implicit)

### Handstand Plate Walk

occurrences (1):

- `Handstand Plate Walk [ https://www.youtube.com/watch?v=wLTv_uUVcRw ]`

contexts (2):

- sheet-09 / WED / 1ST / PRACTICE [ 5-10 min ]
- sheet-12 / WED / 1ST / PRACTICE [ 5-10 min ]

### hang power cleans

occurrences (2):

- `3 min: 12-9-6 hang power cleans [ 2x 15 kg ]`
- `3 & 4 min: 12-9-6 hang power cleans [ 2x 15 kg ]`

contexts (2):

- sheet-08 / FRI / 1ST / (implicit)
- sheet-15 / FRI / 1ST / (implicit)

### hang power cleans + 5 front squats + 3 push presses

occurrences (1):

- `7 hang power cleans + 5 front squats + 3 push presses [ DB 2x 15 kg ]`

contexts (2):

- sheet-25 / FRI / 1ST / STRENGTH ENDURANCE
- sheet-31 / FRI / 1ST / STRENGTH ENDURANCE

### KB Bulgarian split squats

occurrences (1):

- `10 KB Bulgarian split squats [ 24 kg ] [ each leg ] [ https://www.youtube.com/watch?v=G0Mo2LF8uLU ]`

contexts (2):

- sheet-29 / MON / 1ST / SUCCESSORY WORK
- sheet-32 / MON / 1ST / SUCCESSORY WORK

### Lateral HS walk near wall

occurrences (1):

- `Lateral HS walk near wall [ https://www.youtube.com/watch?v=N2QNWiQie-A ]`

contexts (2):

- sheet-09 / WED / 1ST / PRACTICE [ 5-10 min ]
- sheet-12 / WED / 1ST / PRACTICE [ 5-10 min ]

### MAX ROUNDS in remaining time: 1-2-3-4-5 etc.

occurrences (1):

- `MAX ROUNDS in remaining time: 1-2-3-4-5 etc. [ 2x 15 kg ]`

contexts (2):

- sheet-04 / MON / 1ST / INTERVALS
- sheet-05 / FRI / 1ST / INTERVALS

### plyo push ups + 10 incline DB bench presses

occurrences (2):

- `5 plyo push ups + 10 incline DB bench presses [ 2x 15 kg ]`
- `10 plyo push ups + 10 incline DB bench presses [ 2x 15 kg ]`

contexts (2):

- sheet-20 / WED / 1ST / PUMP SESSION
- sheet-23 / WED / 1ST / PUMP SESSION

### strict DB press + 6 DB push press + 3 strict DB press [ 2x 15 kg ]

occurrences (1):

- `3 strict DB press + 6 DB push press + 3 strict DB press [ 2x 15 kg ] | [ 2 sec SLOW down ]`

contexts (2):

- sheet-27 / MON / 1ST / SUCCESSORY WORK
- sheet-30 / MON / 1ST / SUCCESSORY WORK

### traverses + 11 bar dips + traverses + 10 bar dips

occurrences (1):

- `traverses + 11 bar dips + traverses + 10 bar dips`

contexts (2):

- sheet-27 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-33 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics

### traverses + 5 bar dips + traverses + 4 bar dips

occurrences (1):

- `traverses + 5 bar dips + traverses + 4 bar dips`

contexts (2):

- sheet-27 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics
- sheet-33 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics

### V-ups

occurrences (2):

- `2 min: 12 V-ups`
- `21 V-ups`

contexts (2):

- sheet-07 / FRI / 1ST / (implicit)
- sheet-32 / MON / 1ST / STRENGTH ENDURANCE

### alt. DB snatches

occurrences (1):

- `20 alt. DB snatches [ 1x 15 kg ]`

contexts (1):

- sheet-20 / MON / 1ST / Temporarily without STRENGTH ENDURANCE

### bench presses

occurrences (1):

- `bench presses [ 2x 15 kg ]`

contexts (1):

- sheet-02 / WED / 1ST / STRENGTH ENDURANCE

### Burpee variation

occurrences (1):

- `* Burpee variation`

contexts (1):

- sheet-07 / MON / 1ST / STRENGTH ENDURANCE

### burpees over DB

occurrences (1):

- `burpees over DB`

contexts (1):

- sheet-06 / MON / 1ST / STRENGTH ENDURANCE

### Cossacs squats AFTER EACH GYMNASTICS set

occurrences (1):

- `10 [ 5 each LEG ] Cossacs squats AFTER EACH GYMNASTICS set`

contexts (1):

- sheet-12 / WED / 1ST / Basic GYMNASTICS

### DB alt. snatches

occurrences (1):

- `DB alt. snatches [ 1x 15 kg ]`

contexts (1):

- sheet-21 / MON / 1ST / STRENGTH ENDURANCE

### DB bench presses [ 2x 15 kg ] + 10 plyo push ups

occurrences (1):

- `10 DB bench presses [ 2x 15 kg ] + 10 plyo push ups`

contexts (1):

- sheet-23 / WED / 1ST / PUMP SESSION

### DB bench presses [ 2x 15 kg ] + 10 plyo push ups + 5 DB bench presses

occurrences (1):

- `5 DB bench presses [ 2x 15 kg ] + 10 plyo push ups + 5 DB bench presses [ 2x 15 kg ]`

contexts (1):

- sheet-26 / WED / 1ST / PUMP SESSION

### DB bench presses [ 2x 15 kg ] + 5 plyo push ups

occurrences (1):

- `10 DB bench presses [ 2x 15 kg ] + 5 plyo push ups`

contexts (1):

- sheet-20 / WED / 1ST / PUMP SESSION

### DB Cossacs squats

occurrences (1):

- `12 DB Cossacs squats [ 15 kg ] [ 6 EACH leg ]`

contexts (1):

- sheet-14 / MON / 1ST / STRENGTH ENDURANCE

### DB deadlifts + 5 hang power cleans + 5 DB squats

occurrences (1):

- `5 DB deadlifts + 5 hang power cleans + 5 DB squats [ 2x 15 kg ]`

contexts (1):

- sheet-21 / FRI / 1ST / STRENGTH ENDURANCE

### DB exercise

occurrences (1):

- `*DB exercise  [ 2x 15 kg ]`

contexts (1):

- sheet-11 / FRI / 1ST / STRENGTH ENDURANCE

### DB front squats

occurrences (1):

- `5 DB front squats [ 2x 15 kg ]`

contexts (1):

- sheet-14 / FRI / 1ST / STRENGTH ENDURANCE

### DB hang power clean & push press

occurrences (1):

- `30 DB hang power clean & push press [ 2x 15 kg ]`

contexts (1):

- sheet-23 / FRI / 1ST / STRENGTH ENDURANCE

### DB hang power clean + DB push press

occurrences (1):

- `30 DB hang power clean + DB push press [ 2x 15 kg ]`

contexts (1):

- sheet-24 / FRI / 1ST / STRENGTH ENDURANCE

### DB hang power snatches

occurrences (1):

- `DB hang power snatches`

contexts (1):

- sheet-04 / MON / 1ST / INTERVALS

### DB hang power snatches [ 2x 15 kg ] + 5 burpee

occurrences (1):

- `1 min: 7 DB hang power snatches [ 2x 15 kg ] + 5 burpee [ WITHOUT jump ]`

contexts (1):

- sheet-09 / MON / 1ST / (implicit)

### DB hang snatches

occurrences (2):

- `7 DB hang snatches [ LEFT ARM ]`
- `7 DB hang snatches [ RIGHT ARM ]`

contexts (1):

- sheet-12 / MON / 1ST / (implicit)

### DB INCLINE bench presses [ 2x 15 kg ] + 5 single ARM bench presses

occurrences (1):

- `5 DB INCLINE bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ] [ another ARM HOLD DB in UP ]`

contexts (1):

- sheet-26 / WED / 1ST / PUMP SESSION

### DB power cleans

occurrences (1):

- `5 DB power cleans [ 2x 15 kg ]`

contexts (1):

- sheet-14 / FRI / 1ST / STRENGTH ENDURANCE

### DB push presses

occurrences (1):

- `6 DB push presses`

contexts (1):

- sheet-20 / FRI / 1ST / (implicit)

### DB snatch

occurrences (1):

- `DB snatch [ 2x 15 kg ]`

contexts (1):

- sheet-30 / MON / 1ST / STRENGTH ENDURANCE

### DB snatches [ 1x 15 kg ] + 10 strict HSPU

occurrences (1):

- `10 DB snatches [ 1x 15 kg ] + 10 strict HSPU [ from box/sofa ]`

contexts (1):

- sheet-22 / MON / 1ST / (implicit)

### DB snatches [ 2x 15 kg ] + 10 strict HSPU

occurrences (1):

- `10 DB snatches [ 2x 15 kg ] + 10 strict HSPU [ from box/sofa ]`

contexts (1):

- sheet-25 / MON / 1ST / (implicit)

### DB snatches [ 2x 15 kg ] + 7 strict HSPU

occurrences (1):

- `7 DB snatches [ 2x 15 kg ] + 7 strict HSPU [ from box/sofa ]`

contexts (1):

- sheet-31 / MON / 1ST / (implicit)

### DB squats [ 2x 15 kg ] + 7 V-ups

occurrences (1):

- `7 DB squats [ 2x 15 kg ] + 7 V-ups`

contexts (1):

- sheet-31 / MON / 1ST / (implicit)

### DB STOH

occurrences (1):

- `DB STOH [ push press OR push jerk ]`

contexts (1):

- sheet-05 / FRI / 1ST / INTERVALS

### EXPLODE bulgarian squats

occurrences (1):

- `12 EXPLODE bulgarian squats [ each leg ] [ https://www.youtube.com/watch?v=4XvvvqSg-ds ]`

contexts (1):

- sheet-04 / FRI / 1ST / STRENGTH ENDURANCE

### hang power clean & push press

occurrences (1):

- `30 hang power clean & push press [ 2x 15 kg ]`

contexts (1):

- sheet-12 / FRI / 1ST / STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]

### hang power cleans + 3 fron squats + 3 push presses

occurrences (1):

- `3 hang power cleans + 3 fron squats + 3 push presses [ DB 2x 15 kg ]`

contexts (1):

- sheet-22 / FRI / 1ST / STRENGTH ENDURANCE

### hang power cleans + 3 front squats + 1 push presses

occurrences (1):

- `5 hang power cleans + 3 front squats + 1 push presses [ DB 2x 15 kg ]`

contexts (1):

- sheet-31 / FRI / 1ST / STRENGTH ENDURANCE

### hang power cleans + 7 front squats + 5 push presses

occurrences (1):

- `9 hang power cleans + 7 front squats + 5 push presses [ DB 2x 15 kg ]`

contexts (1):

- sheet-31 / FRI / 1ST / STRENGTH ENDURANCE

### KB clean & jerk

occurrences (1):

- `6 KB clean & jerk [ 24 kg ] [ each arm ]`

contexts (1):

- sheet-28 / FRI / 1ST / STRENGTH ENDURANCE

### KB Goblet squats

occurrences (1):

- `15 KB Goblet squats [ 24 kg ]`

contexts (1):

- sheet-02 / FRI / 1ST / STRENGTH ENDURANCE

### KB SDHP

occurrences (1):

- `30 KB SDHP [ 24 kg ]`

contexts (1):

- sheet-12 / FRI / 1ST / STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]

### KB single arm row

occurrences (1):

- `10 KB single arm row [ 24 kg ] [ https://www.youtube.com/watch?v=xl1YiqQY2vA ] [ each arm ]`

contexts (1):

- sheet-30 / WED / 1ST / PUMP SESSION

### lateral DB over burpees

occurrences (1):

- `15 lateral DB over burpees`

contexts (1):

- sheet-24 / FRI / 1ST / STRENGTH ENDURANCE

### MAX DB FRONT SQUATS

occurrences (1):

- `3 min: MAX DB FRONT SQUATS [ 2x 15 kg ]`

contexts (1):

- sheet-07 / FRI / 1ST / (implicit)

### MAX strict HSPU in remaining time

occurrences (1):

- `MAX strict HSPU in remaining time`

contexts (1):

- sheet-03 / FRI / 1ST / INTERVALS

### OH DB lunges

occurrences (2):

- `7 OH DB lunges [ LEFT ARM ]`
- `7 OH DB lunges [ RIGHT ARM ]`

contexts (1):

- sheet-12 / MON / 1ST / (implicit)

### overhead squats

occurrences (1):

- `overhead squats [ 50/30 kg ]`

contexts (1):

- sheet-06 / MON / 1ST / STRENGTH ENDURANCE

### power cleans

occurrences (1):

- `10 power cleans [ 2x 15 kg ]`

contexts (1):

- sheet-03 / FRI / 1ST / INTERVALS

### power snatches

occurrences (1):

- `10 power snatches [ 2x 15 kg ]`

contexts (1):

- sheet-06 / MON / 1ST / STRENGTH ENDURANCE

### pull-ups

occurrences (1):

- `pull-ups`

contexts (1):

- sheet-32 / SAT / 1ST / Basic GYMNASTICS

### RUN 10 km

occurrences (1):

- `RUN 10 km`

contexts (1):

- sheet-14 / SAT / 1ST / (implicit)

### strict bar dips OR 20 push ups

occurrences (1):

- `10 strict bar dips OR 20 push ups`

contexts (1):

- sheet-03 / SAT / 1ST / GYMNASTICS

### strict chin pull-ups

occurrences (1):

- `strict chin pull-ups`

contexts (1):

- sheet-03 / WED / 1ST / Basic GYMNASTICS

### strict DB press + 10 DB push press [ 2x 15 kg ]

occurrences (1):

- `5 strict DB press + 10 DB push press [ 2x 15 kg ] | [ 2 sec SLOW down ]`

contexts (1):

- sheet-16 / MON / 1ST / SUCCESSORY WORK

### strict DB press + 5 KB push press [ 24 kg ] + 5 strict DB press

occurrences (1):

- `5 strict DB press + 5 KB push press [ 24 kg ] + 5 strict DB press [ 2x 15 kg ]`

contexts (1):

- sheet-28 / MON / 1ST / SUCCESSORY WORK

### strict DB press + 9 DB push press + 3 strict DB press [ 2x 15 kg ]

occurrences (1):

- `3 strict DB press + 9 DB push press + 3 strict DB press [ 2x 15 kg ] | [ 2 sec SLOW down ]`

contexts (1):

- sheet-33 / MON / 1ST / SUCCESSORY WORK

### strict HSPU + 7 DB squats

occurrences (1):

- `2 min: 5 strict HSPU + 7 DB squats [ 2x 15 kg ]`

contexts (1):

- sheet-09 / MON / 1ST / (implicit)

### strict NEGATIVE HSPU

occurrences (1):

- `30 strict NEGATIVE HSPU [ TOTAL ]`

contexts (1):

- sheet-30 / SAT / 1ST / GYMNASTICS

### strict ring pull-ups

occurrences (1):

- `5 strict ring pull-ups`

contexts (1):

- sheet-05 / WED / 1ST / STRENGTH ENDURANCE

### traverses + 10 bar dips + traverses + 10 bar dips

occurrences (1):

- `traverses + 10 bar dips + traverses + 10 bar dips`

contexts (1):

- sheet-30 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics

### traverses + 15 bar dips + traverses + 15 bar dips

occurrences (1):

- `traverses + 15 bar dips + traverses + 15 bar dips`

contexts (1):

- sheet-30 / WED / 1ST / STRENGTH ENDURANCE | Gymnastics

### traverses + 3 bar dips + traverses + 3 bar dips

occurrences (1):

- `traverses + 3 bar dips + traverses + 3 bar dips`

contexts (1):

- sheet-12 / SAT / 1ST / STRENGTH ENDURANCE | Gymnastics

### traverses + 5-7 bar dips

occurrences (1):

- `traverses + 5-7 bar dips [ https://www.youtube.com/watch?v=hsat8D8KN_k&t=20s ]`

contexts (1):

- sheet-07 / WED / 1ST / STRENGTH ENDURANCE

### traverses + bar dips

occurrences (1):

- `traverses + bar dips`

contexts (1):

- sheet-11 / SAT / 1ST / GYMNASTICS
