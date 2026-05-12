# Phase 3.2 edge cases (Exercise as entity)

Placeholders, complex names, ambiguous merge candidates, эскалации.

Note: this file is **separate** from Phase 3.1 `edge-cases.md` (which catalogs schema-content edge cases) — Phase 3.2 focus = exercise entity identity edge cases.

---

## 1. Placeholders catalog

3 placeholder constructs обнаружены в sample:

### 1.1 \*DB exercise

- name: `*DB exercise`
- occurrences: 1 (block-020 / schema-1 / sub-1)
- resolution: paired annotation `[ *DB exercise: 1st set HANG SQUAT CLEANS | 2nd set HANG POWER CLEANS | 3rd set FRONT SQUATS ]`
- semantics: per-set substitution (3-set program).
- equipment slot: dumbbell.
- canonical_compound_type: placeholder.

### 1.2 \*Burpee variation

- name: `*Burpee variation`
- occurrences: 1 (block-021 / schema-1 / sub-1)
- resolution: paired annotation `[ 1 set: bar facing burpees | 2 set: burpee + push ups | 3 set: burpee ]`
- semantics: per-set substitution (3-set program).
- equipment slot: bodyweight.
- canonical_compound_type: placeholder.

### 1.3 ANY exercise for ABS (inside compound only)

- name: appears only within compound row `ANY exercise for ABS + DB seated good morning` (no standalone exercise entry).
- occurrences: 1 entry / 27 ctx.
- resolution: athlete-choice slot for any ABS-targeting exercise.
- semantics: category-by-purpose placeholder (open-ended choice).
- equipment slot: unspecified.
- canonical_compound_type: placeholder partial (within compound).

### 1.4 biceps / triceps (muscle-group reference singleton — Phase 3.1 §10)

- name: `biceps / triceps`
- occurrences: 1 (block-152).
- not an exercise entry в exercise-instances.md (likely subsumed within block-152 SUCCESSORY).
- semantics: muscle-group reference, athlete-choice exercise.
- not in 149 canonical list — mentioned for completeness.

---

## 2. Complex names

Names that retain non-trivial structure через Phase 1 normalization, often because of bracket / pipe / numeric content in the middle.

### 2.1 Names with internal `[ ]` (Phase 1 normalization artifact)

Phase 1 normalization rule: «без `[ ]`-модификаторов в хвосте». Bracket в середине имени сохраняется.

candidates:

- `KB [ 24 kg ] single arm row` → MERGED to `KB single arm row` (weight extracted).
- `DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses` — compound row с inline weight. Kept (compound).
- `DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses` — compound row с inline composite weight. Kept (compound).
- `DB bench presses [ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses` — mirror.
- `DB bench presses [ 2x 15 kg ] + 10 plyo push ups` etc. (several compound variants).
- `incline DB bench presses [ 2x 15 kg ] + 10 plyo push ups` — compound.
- `KB push press [ 24 kg ] + 10 DB halfkneeling press` — compound.
- `DB hang power snatches [ 2x 15 kg ] + 5 burpee` — compound.
- `DB INCLINE bench presses [ 2x 15 kg ] + 5 single ARM bench presses` — compound.
- `DB snatches [ 1x 15 kg ] + 10 strict HSPU` — compound.
- `DB snatches [ 2x 15 kg ] + 10 strict HSPU` — compound (sibling).
- `DB snatches [ 2x 15 kg ] + 7 strict HSPU` — compound (sibling).
- `DB squats [ 2x 15 kg ] + 10 V-ups` — compound.
- `DB squats [ 2x 15 kg ] + 7 V-ups` — compound (sibling).
- `strict DB press + 7 DB push press [ 2x 15 kg ]` — compound (trailing weight).
- `strict DB press + 6 DB push press + 3 strict DB press [ 2x 15 kg ]` — sandwich compound.
- `strict DB press + 9 DB push press + 3 strict DB press [ 2x 15 kg ]` — sandwich compound.
- `strict DB press + 5 DB push press [ 2x 15 kg ]` — compound.
- `strict DB press + 5 KB push press [ 24 kg ] + 5 strict DB press` — cross-equipment sandwich.
- `strict DB press + 10 DB push press [ 2x 15 kg ]` — compound.

observation: weights в middle remain inline of compound rows; weights в end of atomic rows already stripped by Phase 1.

Phase 5 recommendation: при decompose `+` compounds (Option b в `compound-composite-analysis.md`), weights become per-element use-site annotations, not part of exercise identity.

### 2.2 Names with internal `|` (composite arm-action в имени)

- `DB bench presses LEFT arm | RIGHT arm HOLD in UP` (atomic, 1 occ / 2 ctx) — composite asymmetric arm modifier embedded в name.
- `DB bench presses RIGHT arm | LEFT arm HOLD in UP` — mirror.

reasoning: per Phase 1 these stayed as separate entries because pipe-content (`LEFT arm | RIGHT arm HOLD in UP`) is non-bracket trailing content. Phase 1's strip rule only handles `[ ]`-modifiers.

Phase 3.2: keep as separate Exercise entries (atomic). Possible Phase 5 extraction: `DB bench presses` + composite asymmetric arm-action use-site modifier. **Escalate** — modifier classification per main session lists `weight-with-asymmetric-arm-action` as first-class structured field; equivalent without weight prefix may be first-class composite-modifier.

### 2.3 Names with embedded sequence indicator

- `Cossacs squats AFTER EACH GYMNASTICS set` (1 occ / 1 ctx, block-091).
- `single unders AFTER each set` → MERGED to `single unders` (sequence extracted).

reasoning: sequence indicator `AFTER EACH ...` typically captured в `[ ]` annotation (`[ after each GYMNASTICS round ]`) but here lives without brackets in name. Phase 1 не extract.

Phase 3.2: merged `single unders AFTER each set` (consistent with footnote-row form `*N single unders AFTER each set`); kept `Cossacs squats AFTER EACH GYMNASTICS set` as separate entry (no sibling `Cossacs squats` без sequence indicator в sample to merge into).

**Escalation**: Phase 5 — introduce canonical `Cossacs squats` (bodyweight) + use-site round-scope sequence modifier? Currently 1 occurrence — borderline для introducing new canonical. Singleton.

### 2.4 Names with embedded sets×reps prefix

- `3x 10 DB Jefferson curls` (1 occ / 7 ctx).

reasoning: `3x 10` = 3 sets of 10 reps prefix embedded в name. Should be schema header (or `3 sets:` outer marker), но appears inline of exercise name. Phase 1 kept as-is.

Phase 5 recommendation: extract `3x 10` → schema-level header / sets-reps marker; canonical exercise = `DB Jefferson curls`. **Escalate** — singleton, Phase 5 / 6 ratifies normalization rule.

### 2.5 Repeated-pattern compound names

- All 14 cyclical `traverses + N bar dips + traverses + M bar dips` variants — each occurence treated as separate Exercise entry by Phase 1 (numeric variant preservation rule).

Phase 3.2 keeps separate (consistent with Phase 1). Phase 5 recommendation: introduce cyclical-compound structure (см. `compound-composite-analysis.md` §6.2), не отдельный Exercise per numeric variant.

### 2.6 Names with internal numeric (rotation indicator)

- `bar dips + traverses + turn back 180* + traverses` — `180*` (= 180 degrees) appears как rotation marker внутри 4-element compound.

Phase 3.2: keep as-is (single distinct compound). Phase 5: rotation step (`turn back 180*`) — first-class field в cyclical-compound structure.

### 2.7 Long DB Renegade row name (Phase 1 bracket retention)

- `DB Renegade row [ https://www.youtube.com/watch?v=bi1Nf5G86gU ]` — Phase 1 left URL bracket in canonical name (likely because the row also has `{ ... }` rep-definition after URL, blocking trailing-strip rule).

Phase 3.2 strips URL (intrinsic via `default_demo_url`). Canonical name: `DB Renegade row`.

Compound-rep definition `{ 1 push up + each arm row = 1 rep }` — use-site rep-definition annotation, NOT part of canonical name.

---

## 3. Ambiguous merge cases (escalations to Phase 5 / main session)

### 3.1 DB Snatches vs DB alt. snatches

**candidates**:

- `DB Snatches` (11 occ combined) — primary plural form.
- `DB alt. snatches` (2 occ combined) — alternating execution variant.

**ambiguity**: alternating execution может быть:

- (a) intrinsic exercise property — distinct technical variant (keep separate).
- (b) use-site execution modifier — alternating is a use-site option for any DB snatch variant.

sample evidence supports (b):

- `DB Snatches [ 15 kg ] [ alternative ]` (block-093, 1 occurrence) — alternating annotated via `[ alternative ]` modifier на bare DB Snatches row.

If alternating is use-site, then `DB alt. snatches` = `DB Snatches` + `[ alternative ]` modifier.

**Phase 3.2 decision**: keep separate (cardinality enough — 2 occurrences across 2 entries), but flag for Phase 5 ratification.

**escalation question**: should `alt.` prefix in name be normalized to `[ alternative ]` annotation в Phase 5? Если да, merge `DB alt. snatches` → `DB Snatches`.

### 3.2 `&` vs `+` connector for same Olympic lift

**candidates** (4 entries для one underlying composite Olympic lift):

- `DB hang power clean & push press` (composite_named, 1 occ).
- `DB hang power clean + DB push press` (compound_plus, 1 occ).
- `DB hang power cleans + push press` (compound_plus, 1 occ / 2 ctx — plural form).
- `hang power clean & push press` (composite_named, 1 occ — no DB prefix).

**ambiguity**: Coach использует both `&` и `+` to express same composite movement (DB hang power clean + push press = composite Olympic lift). Whether to:

- (a) treat structurally distinct (Phase 3.2 default — `&` = composite_named atomic, `+` = compound_plus decomposed).
- (b) merge all 4 entries → single canonical Olympic lift Exercise.

**Phase 3.2 decision**: keep separate (preserves textual distinction). Phase 5 ratifies.

**escalation question**: ratify connector preference for Olympic lifts (use `&` consistently as named composite) vs. allow both vs. always decompose. Affects Phase 5 model — whether `&` is just shorthand for `+` (Option a) or distinct naming convention (Option c в `compound-composite-analysis.md`).

### 3.3 Single Leg Kettlebell Hip Thrust canonical form

**candidates** (already merged):

- `Single Leg Kettlebell Hip Thrust` (5 occ) — full Kettlebell form.
- `Single Leg KB Hip Thrust` (2 occ) — KB abbreviation.

**ambiguity**: Phase 3.2 picked full form `Kettlebell` as canonical, но other KB exercises в sample используют `KB` abbreviation (`KB clean & push press`, `KB swings`, etc.).

**Phase 3.2 decision**: full form `Single Leg Kettlebell Hip Thrust` (по occurrence count). Alternative ratification = `Single Leg KB Hip Thrust` для consistency с другими KB-prefixed exercises.

**escalation question**: ratify canonical naming convention (abbreviation `KB` vs full `Kettlebell`)? Affects naming consistency.

### 3.4 DB Horn Grip vs KB Horn Grip Shoulder Front Raise

**candidates**:

- `DB Horn Grip Shoulder Front Raise` (2 occ / 16 ctx).
- `KB Horn Grip Shoulder Front Raise` (1 occ / 5 ctx).

**ambiguity**: same demo URL `HHEmtCuuPss` — biomechanically same movement, different equipment.

**Phase 3.2 decision**: keep separate (different primary_equipment).

**escalation question**: Phase 5 — should we introduce "movement family" abstraction (e.g., `Horn Grip Shoulder Front Raise` family) with equipment as use-site? If yes, merge.

### 3.5 single arm row (split-tier weight)

**candidate**:

- `single arm row` (2 occ / 3 ctx) — occurrences `15 single arm row [ 5 KB 24 kg + 10 DB 15 kg ] [ LEFT/RIGHT ARM ]`.

**ambiguity**: split-tier weight indicates per-set execution = 5 reps KB + 10 reps DB = single set with 2 equipment stages. Is this:

- (a) Separate Exercise (`single arm row` with intrinsic mixed equipment).
- (b) `DB single arm row` sibling with split-tier weight use-site annotation.
- (c) `KB single arm row` sibling with split-tier weight use-site annotation.

**Phase 3.2 decision**: keep as separate Exercise (`single arm row` with primary_equipment=`mixed`). Reflects sample distinction.

**escalation question**: Phase 5 model для split-tier weight — does it apply на DB/KB single arm row siblings (merge `single arm row` into one of them)?

### 3.6 DB bench presses LEFT arm | RIGHT arm HOLD in UP (atomic with pipe-modifier)

**candidates**:

- `DB bench presses LEFT arm | RIGHT arm HOLD in UP` (1 occ / 2 ctx).
- `DB bench presses RIGHT arm | LEFT arm HOLD in UP` (1 occ / 2 ctx).

**ambiguity**: pipe-content `LEFT arm | RIGHT arm HOLD in UP` is composite asymmetric arm-action modifier — similar в spirit к `[ LEFT arm DO | RIGHT arm HOLD in UP ]` annotation, но без brackets. Phase 1 не extract.

**Phase 3.2 decision**: keep separate (Phase 1 normalization preserved).

**escalation question**: Phase 5 — extract pipe-modifier → canonical `DB bench presses` + use-site composite asymmetric arm-modifier? Aligns с main-session modifier classification (`weight-with-asymmetric-arm-action` first-class).

### 3.7 Cossacs squats AFTER EACH GYMNASTICS set

См. §2.3 — singleton edge case. Escalation: extract sequence modifier → introduce canonical `Cossacs squats` (bodyweight)?

### 3.8 pull overs vs DB pull overs

**candidates**:

- `pull overs` (4 occ / 32 ctx) — primary entry, all occurrences с URL `owr5y-s6-Qk`.
- `DB pull overs` (1 occ / 5 ctx) — single entry, no URL.

**ambiguity**: same movement (pullover), DB equipment implied by PUMP SESSION context. Different sheets (`pull overs` в sheets 05+; `DB pull overs` в sheets 20+).

**Phase 3.2 decision**: keep separate (without stronger evidence). Not merged in `exercise-merge-candidates.md`.

**escalation question**: Phase 5 — should merge `DB pull overs` → `pull overs` (if same exercise with DB implied)? Sample evidence weak — different URL presence (или absence) хороший reason для borderline.

### 3.9 MAX ROUNDS in remaining time: 1-2-3-4-5 etc. as exercise vs schema-content

**candidate**:

- `MAX ROUNDS in remaining time: 1-2-3-4-5 etc.` (1 occ / 2 ctx, block-140 / 141).

**ambiguity**: Phase 1 inventoried as exercise entry, но actually это schema-content row containing MAX rep-notation + progressive ladder seed (Phase 3.1 case-three-MAX-subforms).

**Phase 3.2 decision**: kept in §6 of canonical list with note (not proper Exercise; schema-content). Phase 5 — extract from Exercise list, place в schema-content primitive ("MAX-rounds-progressive seed").

---

## 4. Other observations

### 4.1 EXPLODE bulgarian squats — bodyweight equipment classification

- `EXPLODE bulgarian squats` (1 occ) — explosive Bulgarian split squats без веса. No DB/KB prefix. Different demo URL than DB Bulgarian split squats (which uses `G0Mo2LF8uLU`; EXPLODE uses `4XvvvqSg-ds`).

Phase 3.2: keep separate (different movement variant — explosive bodyweight vs loaded DB/KB).

### 4.2 Lateral DB over burpees vs burpees over DB

Both involve DB as obstacle for burpee variant. Different orientation:

- `burpees over DB` (1 occ) — over the DB (forward).
- `lateral DB over burpees` (1 occ) — lateral (side hop).

Phase 3.2: keep separate (different movement orientations).

### 4.3 deficit DB push ups vs deficit HSPU

Both use DB as deficit. Different exercises:

- `deficit DB push ups` — push ups с DB deficit.
- `deficit HSPU` — handstand push ups с DB deficit.

Phase 3.2: keep separate.

### 4.4 Casing inconsistencies in sample (already Phase 1-collapsed)

Examples from occurrences:

- `DB Snatches` vs `DB snatches` — Phase 1 case-insensitive collapse.
- `DB Thrusters` vs `DB thrusters` — same.
- `jumping Jacks` vs `Jumping Jacks` — same.
- `KB Swings` vs `KB swings` — same.

Phase 3.2: no action — Phase 1 already collapsed.

### 4.5 Implicit equipment in non-prefixed names

Examples где equipment не явно prefix-ed, но контекст + weight annotation определяет:

- `bench presses` → `DB bench presses` (merged).
- `power cleans` → `DB power cleans` (merged).
- `power snatches` → `DB power snatches` (merged).
- `hang power cleans` → `DB hang power cleans` (merged).
- `hang power clean & push press` → kept (escalation re: `&` vs `+`).

Phase 3.2: equipment intrinsic — implied DB-prefix merges ratified except where multiple variants exist.

### 4.6 `RUN` family extreme aliasing (6 aliases merged into one canonical)

`RUN` — most-aliased Exercise after merge:

- `RUN` (bare, 1 occ / 4 ctx)
- `RUN 5 km`, `RUN 5-6 km`, `RUN 5-7 km`, `RUN 7 km`, `RUN 10 km` (5 distance variants)
- `km run` (word-order variant containing `3-5 km run`, `5 km run`, `5 km RUN`)

All merged into canonical `RUN`. Distance/range becomes use-site rep-notation.

caveat: future running schemas may add other distances (8 km, 12 km, etc.) — model должна handle distance as use-site numeric parameter, не enum.

### 4.7 Movement family abstraction question

Repeated theme: multiple distinct Exercise entries share same demo URL (biomechanically identical movement, equipment varies).

examples:

- DB Horn Grip Shoulder Front Raise + KB Horn Grip Shoulder Front Raise (same URL `HHEmtCuuPss`).
- DB single arm row + KB single arm row (same URL `xl1YiqQY2vA`).
- rear delt with BANDED + SINGLE ARM rear delt with BANDED + TWO ARMS rear delt with BANDED (same URL `dBJzki-hKfo`).
- DB Bulgarian split squats + KB Bulgarian split squats (same URL `G0Mo2LF8uLU`).

Phase 3.2 keeps these as separate exercises. Phase 5 может introduce "movement family" — abstraction where same movement bio-mechanically grouped, equipment / count / side as variants.

**escalation question**: Phase 5 — design "movement family" abstraction, or treat each as separate Exercise (Phase 3.2 default)? Pros movement family: deduplicates demos, simplifies search. Cons: another abstraction level, complex resolver.

---

## 5. Summary

### Cardinality

- **Total Phase 3.2 edge cases**: 9 (ambiguous merges) + 7 complex name patterns + 7 misc observations = ~23 documented cases.
- **Placeholders**: 2 standalone exercise entries + 1 inside-compound placeholder + 1 muscle-group reference singleton = 3 + 1 = 4 placeholder constructs.
- **Complex names**: 21 entries with internal `[ ]`/`|`/`*`/`3x N` non-trivial structure (mostly compound rows; 2 atomic с pipe-modifier).
- **Ambiguous merges escalated**: 9.

### Escalations to Phase 5 / main session

1. **Alternating execution: intrinsic variant or use-site modifier** — DB Snatches vs DB alt. snatches merge decision.
2. **`&` vs `+` connector for Olympic lifts** — DB hang power clean variants (4 entries) — merge всё into single canonical?
3. **Naming convention KB vs Kettlebell** — Single Leg Kettlebell Hip Thrust canonical form.
4. **Movement family abstraction** — DB/KB Horn Grip, DB/KB single arm row, DB/KB Bulgarian split squats — separate exercises (default) или family-grouped?
5. **Split-tier weight as Exercise vs sibling** — `single arm row` (mixed equipment) separate vs `DB/KB single arm row` sibling with split-tier annotation?
6. **Composite arm-modifier in name (without brackets)** — `DB bench presses LEFT arm | RIGHT arm HOLD in UP` — extract pipe-modifier, canonical `DB bench presses` + use-site composite?
7. **Sequence indicator in name (without brackets)** — `Cossacs squats AFTER EACH GYMNASTICS set` — extract sequence, canonical `Cossacs squats` (bodyweight)?
8. **Sets×reps prefix in name** — `3x 10 DB Jefferson curls` — extract prefix to schema header / use-site?
9. **Schema-content row vs Exercise** — `MAX ROUNDS in remaining time: 1-2-3-4-5 etc.` — remove from Exercise list, place в schema-content primitive?
10. **`pull overs` vs `DB pull overs` merge** — weak evidence, escalate.

### Coverage verification

- 168 Phase 1 unique entries → 19 ratified merges = 149 unique Exercise entries в Phase 3.2 canonical list.
- All 149 have filled intrinsic attributes (per `exercise-attributes.md` decision boundary).
- Compound `+` rows (97 distinct Phase 3.1 §4) — all 97 captured as compound_plus entries in canonical list (subset of 149).
- Composite `&` named: 4 distinct entries — all captured как composite_named.
- OR-alternative rows: 2 distinct entries — captured как alternative_or.
- Placeholders: 2 standalone Exercise entries.
- 9 distinct escalations to Phase 5.

### Notable not edge-cases (de-flagged)

- bodyweight HSPU position modifiers `[ from sofa ]` / `[ from box/sofa ]` — not edge; use-site position modifier (Phase 3.1 §3).
- Weight `[ 2x 15 kg ]` on 100% occurrences of DB bench presses — not edge; coincidental sample stability, weight remains use-site.
- LEFT/RIGHT ARM paired rows (DB hang snatches, OH DB lunges, etc.) — not edge; regular structural pattern (Phase 3.1 case-asymmetric-LR-paired-rows).
- Per-leg `[ each leg ]` ubiquitous in SUCCESSORY exercises — not edge; use-site side distribution.
- Plural / singular variants — handled in Phase 1 case-insensitive merge.

### Phase 3.2 не входит в scope

- Modeling weights / load representation — Phase 3.3.
- Designing Prisma schema — Phase 6.
- Finalizing muscle group taxonomy — Phase 5.
- Per-element use-site parameters for compounds (per-reps weights) — Phase 5 model design.
