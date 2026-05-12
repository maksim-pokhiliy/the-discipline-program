# Compound vs Composite analysis (Phase 3.2)

Анализ `+` (compound) и `&` (composite-named) connectors в именах exercises. + classification placeholders + OR-alternatives.

Источники:

- `02-patterns/schema-boundaries.md` — все body rows с `+` или `&` или `OR`.
- `03-content/compound-and-alternative.md` — Phase 3.1 inventory `+` / `OR` connectors.
- `01-inventory/exercise-instances.md` — 168 normalized entries (включая compound rows как separate cards).

---

## 1. `+` Compound rows

description: compound-rep / compound-set / repeated-pattern via `+` separator. Phase 3.1 classification: 97 distinct compound rows.

sub-types per Phase 3.1 §4:

- **paired** (1 `+`, 2 elements): 49 rows.
- **chained** (2 `+`, 3 elements): 20 rows.
- **extended / repeated-pattern** (3+ `+`, 4+ elements): 28 rows.
  - 21 из них с repeated motif (`traverses + N bar dips + traverses + M bar dips`).

### 1.1 Semantic discrimination (Phase 3.1 ratified rule)

Per Phase 3.1 / Phase 2.1 inventory edge-cases:

> `+` внутри row выполняет роль «выполнить как один комплекс» (compound exercise), не sequential.

Compound `+` = atomic compound-rep / compound-set (один execution unit), не independent list of exercises. Sequential exercise list = newline-separated rows.

### 1.2 Sub-semantic flavors (для Phase 5 рассмотрения)

Дополнительная семантическая discrimination внутри compound-rep umbrella:

**flavor A: paired compound-rep** — `5 strict DB press + 5 DB push press`.

- Execution: 5 strict press, потом 5 push press, всё за один set. Каждый "1 rep" composite = 1 strict + 1 push press? Или один set = sequentially выполнить 5 + 5? Sample показывает второе (sets of 5+5 paired).
- Examples: `5 strict DB press + 5 DB push press`, `5 strict HSPU + 7 DB squats`.

**flavor B: 1-rep composite** — `30 DB hang power clean + DB push press [ 2x 15 kg ]`.

- Execution: 30 повторов, где каждый rep = 1 clean + 1 push press как single composite movement.
- Examples: `30 DB hang power clean + DB push press`, `7 DB hang power cleans + push press` (one-rep meaning clean-immediately-push-press).

**flavor C: chained compound-rep** — `3 hang power cleans + 3 fron squats + 3 push presses [ DB 2x 15 kg ]`.

- Execution: 3+3+3 = 9 total reps, executed as DT-style complex (cleans then front squats then push presses, all per set).
- Examples: `3 hang power cleans + 3 front squats + 3 push presses`, `5 DB deadlifts + 5 hang power cleans + 5 DB squats`.

**flavor D: sandwich form** — `5 strict DB press + 10 DB push press + 5 strict DB press`.

- Execution: opening + middle bridge + closing repeat. Different rep counts на open/close vs middle.
- Examples: `5 strict DB press + 10 DB push press + 5 strict DB press`, `3 strict DB press + 6 DB push press + 3 strict DB press`.
- Cardinality: ~5 rows (sandwich form для SUCCESSORY shoulders work).

**flavor E: repeated-pattern (cyclical)** — `traverses + 5 bar dips + traverses + 5 bar dips`.

- Execution: traverse-laps interleaved between bar-dip sets — N pattern repeats (typically 2x).
- Cardinality: 14 (variant 1 traverses + bar dips repeated, with varying rep counts).

**flavor F: footnote compound** — `* 30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK [ after each GYMNASTICS round ]`.

- Execution: time-bound 3-stage compound, executed after each round.
- Cardinality: 1 (2 occurrences pattern).

**flavor G: placeholder compound** — `ANY exercise for ABS + DB seated good morning`.

- Execution: placeholder slot (athlete chooses ABS exercise) + concrete row.
- Cardinality: 1 (occurrence in CORE MUSCLES schemas).

---

### 1.3 List of compound rows (с classification)

Все compound rows из `01-inventory/exercise-instances.md`:

#### Paired (1 `+`, 2 elements) — 49 rows (sample, full list в exercise-instances.md)

наибольшая occurrence cardinality (по contexts):

- `ANY exercise for ABS + DB seated good morning` (1 occ, 27 ctx) — flavor G (placeholder).
- `DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses` (3 variants, 6 ctx) — flavor A.
- `DB Bulgarian split squats + 10 withot DB [ 2x 15 kg ]` (1 occ, 6 ctx) — flavor A (typo: withot=without).
- `incline DB bench presses [ 2x 15 kg ] + 10 plyo push ups` (1 occ, 5 ctx) — flavor A.
- `traverses + 5 bar dips + traverses + 5 bar dips` and 13 numeric siblings — flavor E (cyclical), see 1.4.
- `KB push press [ 24 kg ] + 10 DB halfkneeling press` (1 occ, 4 ctx) — flavor A.
- `traverses + strict bar dips` (1 occ, 8 ctx) — flavor A или E (cyclical without explicit count) — implicit.
- `traverses + 5-7 bar dips` (1 occ, 1 ctx) — flavor A.
- `traverses + bar dips` (1 occ, 1 ctx) — flavor A или E (implicit).
- `DB snatch + DB squats` (1 occ, 3 ctx) — flavor A.
- `DB snatches + DB thrusters` (3 occ, 2 ctx) — flavor A (paired execution, weights single-arm LEFT/RIGHT).
- `plyo push ups + 10 incline DB bench presses` (2 occ, 2 ctx) — flavor A.
- `DB squats [ 2x 15 kg ] + 10 V-ups` (1 occ, 2 ctx) — flavor A.
- `DB squats [ 2x 15 kg ] + 7 V-ups` (1 occ, 1 ctx) — flavor A.
- `DB bench presses [ 2x 15 kg ] + 10 plyo push ups` (1 occ, 1 ctx) — flavor A.
- `DB bench presses [ 2x 15 kg ] + 5 plyo push ups` (1 occ, 1 ctx) — flavor A.
- `DB hang power cleans + push press` (1 occ, 2 ctx) — flavor B (1-rep composite via implicit count).
- `DB hang power snatches [ 2x 15 kg ] + 5 burpee` (1 occ, 1 ctx) — flavor A.
- `DB snatches [ 1x 15 kg ] + 10 strict HSPU` (1 occ, 1 ctx) — flavor A.
- `DB snatches [ 2x 15 kg ] + 10 strict HSPU` (1 occ, 1 ctx) — flavor A.
- `DB snatches [ 2x 15 kg ] + 7 strict HSPU` (1 occ, 1 ctx) — flavor A.
- `strict DB press + 7 DB push press [ 2x 15 kg ]` (2 occ, 4 ctx) — flavor A.
- `strict DB press + 5 DB push press [ 2x 15 kg ]` (1 occ, 3 ctx) — flavor A.
- `strict DB press + 10 DB push press [ 2x 15 kg ]` (1 occ, 1 ctx) — flavor A.
- `strict HSPU + 7 DB squats` (1 occ, 1 ctx) — flavor A.
- `DB hang power clean + DB push press` (1 occ, 1 ctx) — flavor B (1-rep composite Olympic-lift).

#### Chained (2 `+`, 3 elements) — 20 rows

key examples:

- `3 hang power cleans + 3 fron squats + 3 push presses [ DB 2x 15 kg ]` (1 occ, 1 ctx) — flavor C, typo fron.
- `7 hang power cleans + 5 front squats + 3 push presses [ DB 2x 15 kg ]` (1 occ, 2 ctx) — flavor C.
- `hang power cleans + 3 front squats + 1 push presses [ DB 2x 15 kg ]` (1 occ, 1 ctx) — flavor C.
- `9 hang power cleans + 7 front squats + 5 push presses [ DB 2x 15 kg ]` (1 occ, 1 ctx) — flavor C.
- `5 DB deadlifts + 5 hang power cleans + 5 DB squats [ 2x 15 kg ]` (1 occ, 1 ctx) — flavor C.
- `* 30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK` (1 occ, 2 ctx) — flavor F (footnote chained PLANK).
- (More chained rows — see Phase 3.1 / Phase 1 inventory.)

#### Extended / repeated-pattern (3+ `+`, 4+ elements) — 28 rows

variant 1: `traverses + N bar dips + traverses + M bar dips` (14 rows)

- `traverses + 5 bar dips + traverses + 5 bar dips` (1 occ, 4 ctx)
- `traverses + 7 bar dips + traverses + 7 bar dips` (1 occ, 4 ctx)
- `traverses + 9 bar dips + traverses + 9 bar dips` (1 occ, 4 ctx)
- `traverses + 8 bar dips + traverses + 7 bar dips` (1 occ, 5 ctx)
- `traverses + 6 bar dips + traverses + 3 bar dips` (1 occ, 3 ctx)
- `traverses + 7 bar dips + traverses + 5 bar dips` (1 occ, 3 ctx)
- `traverses + 10 bar dips + traverses + 10 bar dips` (1 occ, 1 ctx)
- `traverses + 15 bar dips + traverses + 15 bar dips` (1 occ, 1 ctx)
- `traverses + 11 bar dips + traverses + 10 bar dips` (1 occ, 2 ctx)
- `traverses + 3 bar dips + traverses + 3 bar dips` (1 occ, 1 ctx)
- `traverses + 5 bar dips + traverses + 4 bar dips` (1 occ, 2 ctx)
- (3 more numeric variants per Phase 3.1).

variant 2: `bar dips + traverses + turn back 180* + traverses` (9 occurrences, 1 distinct pattern)

- 1 entry: `bar dips + traverses + turn back 180* + traverses` (1 occ, 8 ctx) — implicit-count gymnastics complex.
- Includes 4 elements: bar dips, traverses, turn back 180° rotation, traverses.

extended sandwich forms:

- `5 strict DB press + 10 DB push press + 5 strict DB press [ 2x 15 kg ]` (1 occ, 4 ctx) — flavor D.
- `3 strict DB press + 6 DB push press + 3 strict DB press [ 2x 15 kg ]` (1 occ, 2 ctx) — flavor D.
- `3 strict DB press + 9 DB push press + 3 strict DB press [ 2x 15 kg ]` (1 occ, 1 ctx) — flavor D.
- `5 strict DB press + 5 KB push press [ 24 kg ] + 5 strict DB press [ 2x 15 kg ]` (1 occ, 1 ctx) — flavor D (cross-equipment sandwich).
- `5 DB INCLINE bench presses [ 2x 15 kg ] + 5 single ARM bench presses [ 1x 15 kg ]` — wait that's paired. Excluded.
- `5 DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses [ 15 kg | ... ]` (1 occ, 2 ctx) — flavor D (extended sandwich with composite annotation repeat).
- `5 DB bench presses [ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses` (1 occ, 2 ctx) — mirror.
- `5 DB bench presses [ 2x 15 kg ] + 10 plyo push ups + 5 DB bench presses [ 2x 15 kg ]` (1 occ, 1 ctx) — flavor D.

---

### 1.4 Granularity options для Phase 5

Phase 3.2 не финализирует, но **предлагает** Phase 5 рассмотреть следующие granularity options:

#### Option (a): all `+` compound flatten в один Exercise

**описание**: каждое compound row хранится как single Exercise entity (canonical_compound_type=`compound_plus`), без decomposition на parts.

**pros**:

- Простая модель — 1 row = 1 Exercise.
- Сохраняет coach's intent (composite execution unit).
- Не требует resolver для concat элементов.

**cons**:

- 97 distinct compound entities = много dupes parts (`5 strict DB press + 5 DB push press` и `7 strict DB press + 7 DB push press [ 2 sec SLOW down ]` имеют те же 2 элемента).
- Не reusable: searching "DB press" не покажет все compound entries.
- Reps/weights не attachable per-element.

#### Option (b): decompose `+` into separate Exercise references с compound-rep relationship

**описание**: compound row становится structural element (composition / compound-rep), содержащим references на atomic Exercises (DB press, DB push press), плюс per-element reps/weight.

**pros**:

- Reusable atomic exercises (DB press, DB push press определены раз).
- Per-element parameters (reps, weight, side) explicit.
- Search-friendly.

**cons**:

- Требует resolver: textual `5 strict DB press + 5 DB push press` → references {strict DB press: 5 reps, DB push press: 5 reps, link-as-compound}.
- Сложнее модель (требует compound-rep entity или composition table).
- Repeated-pattern cyclic compounds (`traverses + N bar dips + traverses + M bar dips`) — нужно отдельное representation для cyclical structure.
- Sandwich form (X + Y + X) — `X` появляется дважды; нужно distinguish "first X" vs "second X" если у них разные параметры.

#### Option (c): composite `&` always atomic; `+` always decomposed

**описание**: `&` connector (composite-named, traditional Olympic-lift name) → atomic Exercise (`clean & jerk` = single entity); `+` connector → decomposed compound-rep references (Option b).

**pros**:

- Reflects coaching tradition (`clean & jerk` IS the lift name, neither atomic component).
- Discriminates structurally: `&` = name, `+` = composition.

**cons**:

- Sample has 4 entries с `&` (KB clean & push press, KB clean & jerk, DB hang power clean & push press, hang power clean & push press) и ~3 `+`-form equivalents (`DB hang power cleans + push press`, `DB hang power clean + DB push press`). Boundary ambiguous — they reference same Olympic lifts.
- Coach style decides — some lifts written with `&`, some с `+`.

#### Option (d): hybrid — primary atom + secondary parts pour repeated patterns

**описание**: cyclical patterns (`traverses + N bar dips + traverses + M bar dips`) — single Exercise type with structured fields {primary_element, secondary_element, N, M, pattern_repeats}; sandwich form — similar with {opening_count, middle_count, closing_count}; regular compounds — Option (b) decompose.

**pros**:

- Optimizes for specific patterns обнаруженных в sample.
- Preserves cyclical structure.

**cons**:

- More entity types, more model complexity.
- Hard to extend для novel pattern (Phase 6 stress test).

---

### Phase 3.2 recommendation для Phase 5

Recommend **Option (b)** с extensions for cyclical pattern (subset of Option d):

- `+` compound = composition of atomic exercise references (decompose at parse time / display time).
- For each compound: store reference to component Exercise + per-component reps/weight/modifiers.
- Cyclical pattern (`traverses + N bar dips + traverses + M bar dips`) — special compound structure: `{ primary: traverses, secondary: bar dips, repeat_pattern: [N, M], cycles: 2 }` — это может быть first-class cyclical-compound structure.
- Sandwich form — first-class sandwich-compound structure с `{ opening, middle, closing }`.
- `&` composite-named — atomic для now (`KB clean & push press` = single Exercise), но Phase 6 может decide.

reasoning:

- Sample shows that components (DB press, DB push press, traverses, bar dips) reused across compounds — atomic-reference model exploits this.
- Cyclical pattern occurs 14+ times — worth first-class structure.
- Sandwich form occurs ~5 times — borderline, but distinct enough to formalize.
- `&` composite-named — sample shows 4 distinct entries — keep simple (atomic), unless Phase 5 finds reason to decompose.

**escalation**: option (a) если parsing/decomposition становится дорого; option (b) если reuse важно; option (c) если хочется ритуально preserve `&` как Olympic-lift naming.

---

## 2. `&` Composite-named exercises

description: traditional composite movements named via `&` connector. Treated as atomic per traditional Olympic-lifting convention.

cardinality: 4 distinct entries в sample.

list:

- `KB clean & push press` (5 occ, 3 ctx) — Olympic lift с KB, classic composite-named.
- `KB clean & jerk` (1 occ, 1 ctx) — Olympic lift с KB.
- `DB hang power clean & push press` (1 occ, 1 ctx) — DB Olympic lift variant.
- `hang power clean & push press` (1 occ, 1 ctx) — без DB prefix; same as above, dropped prefix.

semantic: каждое — single composite Olympic lift name. Coach использует `&` как indicator named-composite.

Phase 3.2 recommendation для Phase 5: keep composite-named as atomic Exercise (Option c).

**`&` vs `+` boundary discussion**:

- `DB hang power clean & push press` vs `DB hang power clean + DB push press` — sample shows obje variants для same lift. `&` обычно — традиционное имя (clean & jerk, snatch); `+` — coach's own combinations.
- Phase 5: можно treat `&` exclusively как atomic, decomposing `+` — но требует discriminator.
- Or treat `&` и `+` interchangeably (same execution) — но teryacut historical naming convention.

---

## 3. Compound vs Composite — discrimination matrix

| pattern                                                               | connector | sub-type flavor            | atomic in Phase 5?                 | reasoning                       |
| --------------------------------------------------------------------- | --------- | -------------------------- | ---------------------------------- | ------------------------------- |
| `clean & jerk` (Olympic)                                              | `&`       | composite_named            | atomic                             | traditional lift name           |
| `DB hang power clean + DB push press` (compound)                      | `+`       | flavor B (1-rep composite) | decomposed (Option b)              | coach combination               |
| `5 strict DB press + 5 DB push press` (paired)                        | `+`       | flavor A                   | decomposed                         | distinct rep counts per element |
| `traverses + 5 bar dips + traverses + 5 bar dips` (cyclical)          | `+`       | flavor E                   | structured cyclical-compound       | specific recurring pattern      |
| `5 strict DB press + 10 DB push press + 5 strict DB press` (sandwich) | `+`       | flavor D                   | structured sandwich-compound       | specific pattern                |
| `ANY exercise for ABS + DB seated good morning` (placeholder)         | `+`       | flavor G                   | composite (placeholder + concrete) | mixed placeholder/concrete      |

---

## 4. `OR` Alternative rows

description: substitution choice within one row — «exercise A OR exercise B».

cardinality: 3 row-level OR (per Phase 3.1 §5) + 1 annotation-level OR (`[ push press OR push jerk ]`).

row-level entries:

- `strict bar dips OR 10 push ups` (1 unique entry, 2 occurrences with leading count 5):
  - `5 strict bar dips OR 10 push ups` (block-105, 115)
- `strict bar dips OR 20 push ups` (1 unique entry, 1 occurrence with leading count 10):
  - `10 strict bar dips OR 20 push ups` (block-112)

annotation-level:

- `[ push press OR push jerk ]` (1 occurrence inside `DB STOH [ push press OR push jerk ]` block-140).

semantics: substitution choice. Athlete picks A or B, often с rep scaling (push ups: 2× rate of bar dips).

### 4.1 Phase 5 model recommendation

**option α**: OR-alternative как first-class structure — `OrAlternative { primary: Exercise, primary_reps, alternative: Exercise, alternative_reps }`.

pros: explicit. Athlete or system chooses при scaling.
cons: 3 row-level occurrences — minor pattern, may not justify first-class structure.

**option β**: OR-alternative как free-text annotation — keep textual form, parsed only if needed.

pros: simple.
cons: not searchable / programmable.

Phase 3.2 recommendation: **option α** (first-class). 3 row-level + 1 annotation-level — общий pattern достаточен. Также future scaling features (athlete substitutions, programmatic difficulty adjustment) выиграют от first-class OR.

caveat: annotation-level OR (`[ push press OR push jerk ]`) — technique choice внутри STOH movement (`shoulder-to-overhead`). Это не row-OR (alternative whole exercise), а technique-modifier internal alternative. Phase 5 — оba формы OR могут быть представлены различно: row-OR = OrAlternative structure; annotation-OR = technique-choice modifier.

---

## 5. Placeholder catalog

description: rows без concrete exercise — placeholder slots для per-set substitution.

list:

- `*DB exercise` (1 occ, 1 ctx) — block-020. Paired с annotation `[ *DB exercise: 1st set HANG SQUAT CLEANS | 2nd set HANG POWER CLEANS | 3rd set FRONT SQUATS ]`.
- `* Burpee variation` (1 occ, 1 ctx) — block-021. Paired с annotation `[ 1 set: bar facing burpees | 2 set: burpee + push ups | 3 set: burpee ]`.

И:

- `ANY exercise for ABS` (5 occ — only inside compound `ANY exercise for ABS + DB seated good morning`, не как standalone entry в exercise-instances.md).

И:

- `biceps / triceps` (1 occ, block-152 placeholder) — muscle-group reference.

Phase 3.2: placeholders catalog отдельно от atomic / compound exercises. Total **2 placeholder Exercise entries** + 1 muscle-group reference singleton.

### 5.1 Phase 5 model recommendation

**recommendation**: placeholder = first-class slot Exercise type.

structure:

- `Placeholder` Exercise with name = canonical placeholder phrase.
- Linked annotation = list of per-set assignments (3 concrete exercises typically — Phase 3.1 §8 показывает 3-set mapping).
- Each per-set assignment = reference to concrete Exercise + opt modifier.

pros: programmable per-set differentiation; reflects coaching intent.
cons: requires resolver from annotation parse + slot model.

alternative: placeholders как free-text rows + annotation parsed only при rendering — simpler but не programmable.

---

## 6. Special-case compound forms

### 6.1 Sandwich form (X + Y + X)

cardinality: ~5 occurrences (Phase 3.1 §1.3).

pattern: opening element + middle bridge + closing element (typically opening = closing structurally, may have different rep counts).

examples:

- `5 strict DB press + 10 DB push press + 5 strict DB press`
- `3 strict DB press + 6 DB push press + 3 strict DB press`
- `3 strict DB press + 9 DB push press + 3 strict DB press`
- `5 strict DB press + 5 KB push press [ 24 kg ] + 5 strict DB press` (cross-equipment sandwich)
- `5 DB bench presses [ ... ] + 10 plyo push ups + 5 DB bench presses [ ... ]` (composite annotation sandwich)

Phase 3.2 recommendation: first-class sandwich-compound structure (Option d subset) — `{ opening: ExerciseRef, middle: ExerciseRef, closing: ExerciseRef }` with per-element reps. Reflects shoulder-work pattern.

### 6.2 Cyclical-compound (traverses + bar dips loop)

cardinality: 14 distinct numeric variants + 9 occurrences для `bar dips + traverses + turn back 180* + traverses` variant 2.

pattern: cyclic structure where same elements appear multiple times within one row, with varying rep counts.

examples:

- `traverses + 5 bar dips + traverses + 5 bar dips` (symmetric)
- `traverses + 8 bar dips + traverses + 7 bar dips` (descending)
- `traverses + 6 bar dips + traverses + 3 bar dips` (steep descending)
- `bar dips + traverses + turn back 180* + traverses` (4-element с rotation step)

Phase 3.2 recommendation: first-class cyclical-compound structure — `{ primary_element, secondary_element, cycles: [reps_per_cycle], optional_rotation_step }`. Variant 2 включает rotation step (`turn back 180*`) — нужен flag.

### 6.3 Footnote compound

cardinality: 1 distinct pattern, 2 occurrences (block-093, 095).

pattern: `* <time-bound compound> [ round-scope modifier ]`.

example: `* 30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK [ after each GYMNASTICS round ]`.

Phase 3.2 recommendation: footnote-row structure already documented в Phase 3.1 §14. Compound inside footnote = chained compound (3-stage time-bound).

### 6.4 Placeholder compound

cardinality: 1 distinct (`ANY exercise for ABS + DB seated good morning`), 27 occurrences.

pattern: placeholder (`ANY exercise for ABS`) + concrete exercise (`DB seated good morning`) joined by `+`.

Phase 3.2 recommendation: extension of placeholder structure (§5) — allow placeholder + concrete сompose в single row.

---

## 7. Summary

### Cardinality

| structural type            | count               | notes                                                                                                                    |
| -------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| atomic exercises           | ~90                 | after merges (см. exercise-canonical-list.md)                                                                            |
| compound `+` (all flavors) | 97 distinct entries | flavor A (paired) 49, B (1-rep) ~10, C (chained) 20, D (sandwich) ~5, E (cyclical) 21, F (footnote) 1, G (placeholder) 1 |
| composite `&` named        | 4 distinct entries  | DB/KB Olympic lifts                                                                                                      |
| OR-alternative rows        | 2 distinct entries  | bar dips ↔ push ups                                                                                                     |
| OR-alternative annotations | 1                   | push press OR push jerk                                                                                                  |
| placeholders               | 2 + 1 muscle-group  | *DB exercise, *Burpee variation, biceps/triceps                                                                          |

### Phase 3.2 recommendations for Phase 5

1. **`+` compound** → decompose в Option (b) refs + first-class structures для cyclical и sandwich patterns.
2. **`&` composite-named** → atomic (Option c).
3. **OR-alternative rows** → first-class OrAlternative structure (option α).
4. **Placeholders** → first-class slot Exercise + per-set assignment structure.
5. **Footnote compound** → footnote-row primitive (Phase 3.1 §14) с inner chained compound.

### Escalations

- `&` vs `+` connector boundary — same Olympic lifts written both ways. Phase 5 ratifies.
- Cyclical-compound с rotation step (`turn back 180*`) — separate or part of cyclical structure?
- Cross-equipment sandwich (`5 strict DB press + 5 KB push press [ 24 kg ] + 5 strict DB press`) — needs per-element equipment override.
- Composite annotation sandwich (`5 DB bench presses [ ... composite ... ] + 10 plyo push ups + 5 DB bench presses [ ... composite ... ]`) — per-element composite annotation supported by sandwich-compound structure?
