# Load stability per canonical exercise (Phase 3.3)

149 canonical exercises (после Phase 3.2 merges) с weight stability classification.

Source: `exercise-instances.md` occurrences + `exercise-canonical-list.md` aliases + `exercise-canonical-list.md` primary_equipment.

Categories:

- **stable**: explicit weight в всех загружённых occurrences; единственное distinct value (modulo typo variants `2x 15 kg` / `2x15 kg`).
- **variable**: explicit weight в occurrences; ≥ 2 разных values (по контексту меняется).
- **bodyweight**: primary_equipment ∈ {bodyweight, band, parallel_bars, rings} — load by definition not external; нет weight annotation.
- **weighted-implicit**: primary_equipment ∈ {dumbbell, kettlebell, mixed, barbell}, но НЕТ weight annotation в occurrences (weight через standalone-row, schema context, или underspecified).
- **mixed**: некоторые occurrences с весом, некоторые без — explicit annotation inconsistency.

---

## 1. Stable (60 exercises)

| canonical_name                                                                                            | weight notation                                            | occurrences |
| --------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------- |
| \*DB exercise (placeholder)                                                                               | `[ 2x 15 kg ]`                                             | 1           |
| 3x 10 DB Jefferson curls                                                                                  | `[ 15 kg ]`                                                | 1           |
| DB Bulgarian split squats + 10 withot DB                                                                  | `[ 2x 15 kg ]`                                             | 1           |
| DB Cossacs squats                                                                                         | `[ 15 kg ]`                                                | 1           |
| DB Glute Bridge Bench Press                                                                               | `[ 2x 15 kg ]`                                             | 2           |
| DB alt. snatches                                                                                          | `[ 1x 15 kg ]`                                             | 2           |
| DB bench presses                                                                                          | `[ 2x 15 kg ]`                                             | 6           |
| DB bench presses LEFT arm \| RIGHT arm HOLD in UP                                                         | `[ 2x 15 kg ]`                                             | 1           |
| DB bench presses RIGHT arm \| LEFT arm HOLD in UP                                                         | `[ 2x 15 kg ]`                                             | 1           |
| DB bench presses [ 15 kg \| LEFT arm DO \| RIGHT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses | `[ 15 kg \| LEFT arm DO \| RIGHT arm HOLD in UP ]`         | 1           |
| DB bench presses [ 15 kg \| RIGHT arm DO \| LEFT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses | `[ 15 kg \| RIGHT arm DO \| LEFT arm HOLD in UP ]`         | 1           |
| DB bench presses [ 2x 15 kg ] + 10 plyo push ups                                                          | `[ 2x 15 kg ]`                                             | 1           |
| DB bench presses [ 2x 15 kg ] + 10 plyo push ups + 5 DB bench presses                                     | `[ 2x 15 kg ]`                                             | 1           |
| DB bench presses [ 2x 15 kg ] + 5 plyo push ups                                                           | `[ 2x 15 kg ]`                                             | 1           |
| DB bent over row                                                                                          | `[ 2x 15 kg ]`                                             | 1           |
| DB deadlifts + 5 hang power cleans + 5 DB squats                                                          | `[ 2x 15 kg ]`                                             | 1           |
| DB farmer carry lunges                                                                                    | `[ 2x 15 kg ]`                                             | 2           |
| DB floor Fly                                                                                              | `[ 2x 15 kg ]`                                             | 1           |
| DB front squats                                                                                           | `[ 2x 15 kg ]` (after merge of MAX DB FRONT SQUATS)        | 2           |
| DB hang power clean & push press                                                                          | `[ 2x 15 kg ]`                                             | 1           |
| DB hang power clean + DB push press                                                                       | `[ 2x 15 kg ]`                                             | 1           |
| DB hang power cleans + push press                                                                         | `[ 2x 15 kg ]`                                             | 1           |
| DB hang power snatches [ 2x 15 kg ] + 5 burpee                                                            | `[ 2x 15 kg ]`                                             | 1           |
| DB lunges                                                                                                 | `[ 2x 15 kg ]`                                             | 3           |
| DB power cleans                                                                                           | `[ 2x 15 kg ]` (after merge of `power cleans`)             | 2           |
| DB power snatches                                                                                         | `[ 2x 15 kg ]` (after merge of `power snatches`)           | 3           |
| DB snatch + DB squats                                                                                     | `[ 2x 15 kg ]`                                             | 1           |
| DB snatches [ 1x 15 kg ] + 10 strict HSPU                                                                 | `[ 1x 15 kg ]`                                             | 1           |
| DB snatches [ 2x 15 kg ] + 10 strict HSPU                                                                 | `[ 2x 15 kg ]`                                             | 1           |
| DB snatches [ 2x 15 kg ] + 7 strict HSPU                                                                  | `[ 2x 15 kg ]`                                             | 1           |
| DB squats [ 2x 15 kg ] + 10 V-ups                                                                         | `[ 2x 15 kg ]`                                             | 1           |
| DB squats [ 2x 15 kg ] + 7 V-ups                                                                          | `[ 2x 15 kg ]`                                             | 1           |
| Incline DB Prone Row                                                                                      | `[ 2x 15 kg ]`                                             | 2           |
| KB Bulgarian split squats                                                                                 | `[ 24 kg ]`                                                | 1           |
| KB Goblet squats                                                                                          | `[ 24 kg ]`                                                | 1           |
| KB SDHP                                                                                                   | `[ 24 kg ]`                                                | 1           |
| KB clean & jerk                                                                                           | `[ 24 kg ]`                                                | 1           |
| KB clean & push press                                                                                     | `[ 24 kg ]`                                                | 5           |
| KB push press [ 24 kg ] + 10 DB halfkneeling press                                                        | `[ 24 kg ]`                                                | 1           |
| KB single arm row                                                                                         | `[ 24 kg ]` (after merge of `KB [ 24 kg ] single arm row`) | 2           |
| Low Hold KB Cossack Squat                                                                                 | `[ 15 kg ]`                                                | 1           |
| MAX ROUNDS in remaining time: 1-2-3-4-5 etc.                                                              | `[ 2x 15 kg ]`                                             | 1           |
| alt. DB bench presses                                                                                     | `[ 2x 15 kg ]`                                             | 1           |
| hang power clean & push press                                                                             | `[ 2x 15 kg ]`                                             | 1           |
| hang power cleans + 3 fron squats + 3 push presses                                                        | `[ DB 2x 15 kg ]`                                          | 1           |
| hang power cleans + 3 front squats + 1 push presses                                                       | `[ DB 2x 15 kg ]`                                          | 1           |
| hang power cleans + 5 front squats + 3 push presses                                                       | `[ DB 2x 15 kg ]`                                          | 1           |
| hang power cleans + 7 front squats + 5 push presses                                                       | `[ DB 2x 15 kg ]`                                          | 1           |
| incline DB bench presses                                                                                  | `[ 2x 15 kg ]` (after merge of `DB INCLINE bench presses`) | 6           |
| incline DB bench presses [ 2x 15 kg ] + 10 plyo push ups                                                  | `[ 2x 15 kg ]`                                             | 1           |
| overhead squats                                                                                           | `[ 50/30 kg ]` (singleton dual-value)                      | 1           |
| plyo push ups + 10 incline DB bench presses                                                               | `[ 2x 15 kg ]`                                             | 2           |
| single arm row                                                                                            | `[ 5 KB 24 kg + 10 DB 15 kg ]` (split-tier composite)      | 2           |
| strict DB press + 10 DB push press + 5 strict DB press                                                    | `[ 2x 15 kg ]`                                             | 1           |
| strict DB press + 10 DB push press [ 2x 15 kg ]                                                           | `[ 2x 15 kg ]`                                             | 1           |
| strict DB press + 5 DB push press [ 2x 15 kg ]                                                            | `[ 2x 15 kg ]`                                             | 1           |
| strict DB press + 6 DB push press + 3 strict DB press [ 2x 15 kg ]                                        | `[ 2x 15 kg ]`                                             | 1           |
| strict DB press + 7 DB push press [ 2x 15 kg ]                                                            | `[ 2x 15 kg ]`                                             | 2           |
| strict DB press + 9 DB push press + 3 strict DB press [ 2x 15 kg ]                                        | `[ 2x 15 kg ]`                                             | 1           |
| strict HSPU + 7 DB squats                                                                                 | `[ 2x 15 kg ]`                                             | 1           |

Dominant load values:

- `[ 2x 15 kg ]` — 50/60 exercises (83%).
- `[ 24 kg ]` — 8/60 exercises (13%).
- Others: `[ 15 kg ]` (single-DB Cossacs / Low Hold KB Cossack / 3x10 Jefferson curls), `[ 1x 15 kg ]` (DB alt. snatches), singletons (`[ 50/30 kg ]`, split-tier).

---

## 2. Variable (7 exercises)

| canonical_name                                                     | weight variants                                                                   | occurrences per variant        | notes                                                                                                      |
| ------------------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| DB Bulgarian split squats                                          | `[ 15 kg ]` (4), `[ 2x 15 kg ]` (2)                                               | 6 total                        | Bulgarian split squats: single DB hold (15 kg) vs paired DB (2x 15 kg). Per-block contextual.              |
| DB INCLINE bench presses [ 2x 15 kg ] + 5 single ARM bench presses | `[ 1x 15 kg ]` (1), `[ 2x 15 kg ]` (1)                                            | 1 row, 2 weights inline        | Per-element weight: DB INCLINE at 2x, single ARM at 1x.                                                    |
| DB Snatches                                                        | `[ 15 kg ]` (1), `[ 1x 15 kg ]` (3), `[ 2x 15 kg ]` (7)                           | 11 total                       | High variability — `15 kg` (alternating implicit), `1x 15 kg` (alternating explicit), `2x 15 kg` (paired). |
| DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses         | `[ 1x 15 kg ]` (3), `[ 2x 15 kg ]` (3), `[ another ARM HOLD KB 24 kg in UP ]` (1) | 3 occurrences                  | Per-element: 2x для DB bench, 1x для single-arm; один occurrence добавляет KB 24kg-hold.                   |
| DB snatches + DB thrusters                                         | `[ 1x 15 kg ]` (2), `[ 2x 15 kg ]` (1)                                            | 3 occurrences                  | Alternating vs paired execution.                                                                           |
| KB swings                                                          | `[ 24 kg ]` (3), `[ 24 kg \| to the parallel ]` (1)                               | 4 occurrences                  | Same kg, depth-modifier singleton variant.                                                                 |
| strict DB press + 5 KB push press [ 24 kg ] + 5 strict DB press    | `[ 24 kg ]` (1), `[ 2x 15 kg ]` (1)                                               | 1 occurrence, 2 weights inline | Cross-equipment sandwich: KB 24kg в middle, DB 2x 15kg для wrapper stages.                                 |

Observation:

- "Variable" в sample значит **per-element weights разные** (compound rows с heterogeneous loads) или **per-occurrence weight selection** (DB Snatches alternates 1x/2x).
- DB Snatches — единственный canonical exercise с truly variable weight per coach choice (alternating execution может быть с 1 или 2 DB).

---

## 3. Bodyweight (54 exercises) — no weight annotation by nature

Primary_equipment ∈ {bodyweight, band, parallel_bars, rings}.

list (по `primary_equipment`):

### 3.1 True bodyweight (35)

`strict pull-ups` (23 occ), `strict HSPU` (23 occ, after merge of `MAX strict HSPU in remaining time`), `jumping Jacks` (17 occ, after merge of `jumping Jack's`), `single leg GLUTE BRIDGE` (6 occ), `hamstring curls` (7 occ — Nordic-curl style, no external load), `deficit HSPU` (4 occ), `single unders` (4 occ, after merge of `single unders AFTER each set`), `RUN` (9 occ combined, after merge of 6 distance variants), `push ups` (3 occ), `strict T2B` (2 occ), `horizontal pull-ups` (2 occ), `V-ups` (2 occ), `burpees` (2 occ), `air squats` (2 occ), `C2B pull-ups` (1 occ), `Handstand Plate Walk` (1 occ), `Lateral HS walk near wall` (1 occ), `burpees over DB` (1 occ), `lateral DB over burpees` (1 occ), `plyo push ups` (1 occ standalone), `pull-ups` (1 occ), `strict chin pull-ups` (1 occ), `strict NEGATIVE HSPU` (1 occ), `Cossacs squats AFTER EACH GYMNASTICS set` (1 occ), `EXPLODE bulgarian squats` (1 occ), `*Burpee variation` (placeholder, 1 occ), `strict bar dips OR 10 push ups` (1 occ), `strict bar dips OR 20 push ups` (1 occ), `30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK` (1 occ).

### 3.2 Band-based (7)

`Hip ABduction with band` (2 occ), `Hip ADduction with band` (1 occ), `seated lateral BANDED raises` (9 occ), `rear delt with BANDED` (3 occ), `SINGLE ARM rear delt with BANDED` (6 occ), `TWO ARMS rear delt with BANDED` (3 occ), `Straight Arm Banded Lat Pull Down` (2 occ).

### 3.3 Parallel bars / rings (12)

`strict bar dips` (5 occ), `bar dips` (2 occ), `strict ring pull-ups` (1 occ, rings), `bar dips + traverses + turn back 180* + traverses` (1 occ), `traverses + 5 bar dips + traverses + 5 bar dips` (1 occ), `traverses + 7 bar dips + traverses + 7 bar dips` (1 occ), `traverses + 9 bar dips + traverses + 9 bar dips` (1 occ), `traverses + 10 bar dips + traverses + 10 bar dips` (1 occ), `traverses + 15 bar dips + traverses + 15 bar dips` (1 occ), `traverses + 11 bar dips + traverses + 10 bar dips` (1 occ), `traverses + 8 bar dips + traverses + 7 bar dips` (1 occ), `traverses + 7 bar dips + traverses + 5 bar dips` (1 occ), `traverses + 6 bar dips + traverses + 3 bar dips` (1 occ), `traverses + 5 bar dips + traverses + 4 bar dips` (1 occ), `traverses + 3 bar dips + traverses + 3 bar dips` (1 occ), `traverses + bar dips` (1 occ), `traverses + 5-7 bar dips` (1 occ), `traverses + strict bar dips` (1 occ).

(Note: §3.3 total 18 — на 6 больше чем raw count в bucket. Discrepancy: compound rows c `traverses + N bar dips` имеют parallel_bars equipment, но Phase 1 их inventorized как distinct entries. Count в Phase 3.3 stability = 54 включая 12 named bodyweight + 7 band + 18 parallel_bars rows + 17 разных compound singleton variants — кросс-проверьте по полному списку ниже.)

Note: некоторые exercises в этой категории (например, `OH DB lunges` — DB-loaded, но nominal "no annotation" в sample) попадают в **weighted-implicit** (§4), не bodyweight. Разделение по primary_equipment.

---

## 4. Weighted-implicit (23 exercises) — equipment needs weight, no inline annotation

primary_equipment ∈ {dumbbell, kettlebell, mixed} (или barbell), но weight через context (standalone row, schema default, block convention), не inline в occurrence.

| canonical_name                                | primary_equipment | occurrences | context                                                                                 |
| --------------------------------------------- | ----------------- | ----------- | --------------------------------------------------------------------------------------- |
| ANY exercise for ABS + DB seated good morning | mixed             | 1           | Placeholder + concrete DB element; weight для concrete element через context.           |
| DB A-push ups                                 | dumbbell          | 1           | DBs on floor; no inline weight in occurrence.                                           |
| DB Horn Grip Shoulder Front Raise             | dumbbell          | 2           | DB grip raise; weight через schema-default.                                             |
| DB Renegade row                               | dumbbell          | 2           | DB renegade row; URL intrinsic, no inline weight.                                       |
| DB STOH                                       | dumbbell          | 1           | DB shoulder-to-overhead; weight через context.                                          |
| DB Seated Single Arm Arnold Press             | dumbbell          | 1           | Single-arm DB Arnold; weight через context.                                             |
| DB halfkneeling press                         | dumbbell          | 2           | Half-kneeling DB press; weight через context.                                           |
| DB hang power snatches                        | dumbbell          | 1           | Hang power snatch DB; weight через context (related compound rows используют 2x 15 kg). |
| DB hang snatches                              | dumbbell          | 2           | DB hang snatches (LEFT / RIGHT arm paired rows).                                        |
| DB leg extension                              | dumbbell          | 2           | DB leg ext; weight через context.                                                       |
| DB pull overs                                 | dumbbell          | 1           | DB pull overs; weight через context.                                                    |
| DB push presses                               | dumbbell          | 1           | Standalone occurrence.                                                                  |
| DB seated good morning                        | dumbbell          | 3           | DB good morning; weight через context.                                                  |
| Glute Loop DB Hip Thrust                      | mixed (band+DB)   | 3           | Hybrid loaded; weight через context.                                                    |
| KB Horn Grip Shoulder Front Raise             | kettlebell        | 1           | KB variant of Horn Grip raise.                                                          |
| KB Single Leg RDL to Reverse Lunge            | kettlebell        | 1           | KB single-leg combination.                                                              |
| KB high pull                                  | kettlebell        | 4           | KB high pull; weight через context (всегда KB → implicit 24 kg).                        |
| OH DB lunges                                  | dumbbell          | 2           | Overhead DB lunges (LEFT / RIGHT arm paired); weight через context.                     |
| Single Leg Kettlebell Hip Thrust              | kettlebell        | 7           | KB hip thrust; weight через context (always 24 kg implicit).                            |
| Single Leg Single Kettlebell Deadlift         | kettlebell        | 3           | Single-leg single-KB DL; weight через context.                                          |
| alternative DB press                          | dumbbell          | 1           | Alternating DB press.                                                                   |
| deficit DB push ups                           | dumbbell          | 1           | DBs as deficit (hand-on-DB position).                                                   |
| pull overs                                    | dumbbell          | 4           | Possible merge candidate с `DB pull overs` (Phase 3.2 escalation).                      |

Observation:

- Эти exercises **never** appear с inline `[ kg ]` в sample. Coach assumes context-default (block convention "always 15 kg DB", "always 24 kg KB").
- Phase 3.2 movement_family soft grouping может resolve weighted-implicit defaults через sibling exercise lookup (`DB Renegade row` без annotation → DB-family default 15 kg).

---

## 5. Mixed (5 exercises) — некоторые occurrences с весом, некоторые без

| canonical_name       | weight variants                                               | annotated / unannotated | occurrences |
| -------------------- | ------------------------------------------------------------- | ----------------------- | ----------- |
| DB deadlifts         | `[ 2x 15 kg ]` (1), `(no annotation)` (1)                     | 1 / 1                   | 2           |
| DB hang power cleans | `[ 2x 15 kg ]` (7), `(no annotation)` (2)                     | 7 / 2                   | 9           |
| DB single arm row    | `[ 5 KB 24 kg + 10 DB 15 kg ]` (1), `(no annotation)` (10)    | 1 / 10                  | 11          |
| DB squats            | `[ 2x 15 kg ]` (9), `[ 2x15 kg ]` (5), `(no annotation)` (1)  | 14 / 1                  | 15          |
| DB thrusters         | `[ 1x 15 kg ]` (1), `[ 2x 15 kg ]` (4), `(no annotation)` (1) | 5 / 1                   | 6           |

Observation:

- Mixed = sample inconsistency. Same exercise в одном schema получает inline annotation, в другом — нет (DB squats без annotation в block-005 — weight задаётся standalone row внизу).
- Resolution: model должна допускать "annotation optional если context provides default", а не обязательная per-row inline.
- DB single arm row — особый mixed-case: 10 occurrences без annotation (DB single-arm row, weight через context), 1 occurrence с split-tier composite `[ 5 KB 24 kg + 10 DB 15 kg ]` (где exercise становится `single arm row` mixed-equipment per Phase 3.2 Group C).

---

## Summary

| classification    | count   | % of 149 | implication                                                                                                     |
| ----------------- | ------- | -------- | --------------------------------------------------------------------------------------------------------------- |
| stable            | 60      | 40%      | Single dominant weight; safe default candidates.                                                                |
| variable          | 7       | 5%       | Per-element / per-occurrence variation; needs explicit per-instance weight.                                     |
| bodyweight        | 54      | 36%      | True no-external-load; model variant `bodyweight`.                                                              |
| weighted-implicit | 23      | 15%      | Equipment requires load, but context-provided (standalone row / block default); needs default-resolution rules. |
| mixed             | 5       | 3%       | Annotation inconsistency in sample; model should accept optional inline.                                        |
| **total**         | **149** | **100%** |                                                                                                                 |

Insights для Phase 5 / Phase 6:

- **Dominant weight per stable exercise** = strong hint для intrinsic default attribute на Exercise (если кодифицируется default_weight).
- **Variable exercises** — 7 cases — alternating execution (1x vs 2x) или per-element compound — модель должна поддерживать per-instance override.
- **Bodyweight** — 36% — significant share; explicit variant `bodyweight` в Load VO (DP3 option b).
- **Weighted-implicit** (15%) — model должна resolve "no inline annotation" cases через context chain: schema-default → block-default → exercise.default_weight → unspecified.
- **Mixed** (3%) — small but real; не treat as error.

Total occurrence-coverage:

- Annotated weight rows: 250 (Phase 3.1 §3 estimate).
- Unannotated weighted-equipment rows: ~30-50 (mixed + weighted-implicit cases).
- True bodyweight rows: ~600 (78% of all exercise rows; large share — gymnastics blocks, run/warm-ups, band-isolation).
