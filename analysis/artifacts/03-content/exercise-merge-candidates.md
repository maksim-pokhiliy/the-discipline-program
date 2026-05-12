# Exercise merge candidates (Phase 3.2)

Близкие имена с обоснованием merge vs keep-separate. Phase 1 уже сделала case-insensitive дедуп; здесь — пары/группы которые остались structurally distinct в exercise-instances.md, но Phase 3.2 предлагает merge на основании identity-уровневого equivalence.

Notation:

- **(canonical → primary)** = merge с указанием канонической формы.
- **keep separate** = structural / semantic differences оправдывают раздельные entities.
- **escalate** = ambiguous, Phase 5 / main session decides.

Total 168 unique entries → propose 19 merges → **149 unique exercises after ratified merges**.

---

## Confirmed merges (ratified by structural identity)

### Merge 1: singular/plural variants

**Group:** DB Snatches family — DB snatch (singular)

candidates:

- `DB Snatches` (10 occ, 11 ctx) — canonical (plural).
- `DB snatch` (1 occ, 1 ctx) — singular, single occurrence `DB snatch [ 2x 15 kg ]` в block-152 STRENGTH ENDURANCE.

decision: **merge `DB snatch` → `DB Snatches`**.

reasoning: singular/plural — orthography only. Same movement. Phase 1 не схлопнула из-за exact-name distinction, но identity идентичная. Внутри occurrences `DB Snatches` уже встречаются case variants `DB snatches` lowercase в occurrences (`10 DB snatches [ 2x 15 kg ]`) — Phase 1 collapse case-insensitive. Один singular = логичное расширение того же канонического имени.

---

### Merge 2: word-order variant

**Group:** alternating DB snatches

candidates:

- `DB alt. snatches` (1 occ, 1 ctx) — `DB alt. snatches [ 1x 15 kg ]` в block-180.
- `alt. DB snatches` (1 occ, 1 ctx) — `20 alt. DB snatches [ 1x 15 kg ]` в block-152.

decision: **merge `alt. DB snatches` → `DB alt. snatches`** (canonical word order: prefix `DB` сохраняется, `alt.` после prefix).

reasoning: identical movement (alternating-style DB snatches). Word order — стилистика тренера. Canonical word order должен match доминирующий pattern `DB <variant> <movement>` (как `DB hang power snatches`).

---

### Merge 3: case variant + word order

**Group:** incline DB bench presses

candidates:

- `incline DB bench presses` (5 occ, 20 ctx) — canonical (lowercase incline + DB).
- `DB INCLINE bench presses` (1 occ, 2 ctx) — caps INCLINE + word order DB-INCLINE.

decision: **merge `DB INCLINE bench presses` → `incline DB bench presses`**.

reasoning: case variant of word INCLINE и word order DB↔incline. Same movement. Phase 1 не схлопнула из-за exact-name distinction (case+order). Identity идентичная.

---

### Merge 4: missing DB prefix (context-implied)

**Group:** bench presses (no DB prefix)

candidates:

- `DB bench presses` (5 occ, 26 ctx) — canonical.
- `bench presses` (1 occ, 1 ctx) — `bench presses [ 2x 15 kg ]` в block-002 STRENGTH ENDURANCE. Weight `[ 2x 15 kg ]` indicates DB.

decision: **merge `bench presses` → `DB bench presses`**.

reasoning: `[ 2x 15 kg ]` weight clearly indicates DB equipment. Skipped `DB` prefix — typo / shorthand. Same movement.

---

### Merge 5: weight-in-name variant

**Group:** KB single arm row

candidates:

- `KB single arm row` (1 occ, 1 ctx) — `10 KB single arm row [ 24 kg ] [ each arm ]`.
- `KB [ 24 kg ] single arm row` (1 occ, 5 ctx) — `10 KB [ 24 kg ] single arm row [ each arm ]` (Phase 1 note: bracket в середине имени → no strip).

decision: **merge `KB [ 24 kg ] single arm row` → `KB single arm row`** (weight `[ 24 kg ]` извлекается как use-site, не intrinsic).

reasoning: identical movement; bracket-in-name — Phase 1 normalization artifact (не успела strip из-за internal position). `[ 24 kg ]` — use-site weight, не часть identity.

---

### Merge 6: abbreviation variants (Kettlebell ↔ KB)

**Group:** Single Leg Kettlebell Hip Thrust family

candidates:

- `Single Leg Kettlebell Hip Thrust` (5 occ, 28 ctx) — full form.
- `Single Leg KB Hip Thrust` (2 occ, 5 ctx) — abbreviation.

decision: **merge `Single Leg KB Hip Thrust` → `Single Leg Kettlebell Hip Thrust`** (canonical full form).

reasoning: Kettlebell vs KB — abbreviation variant. Same movement. Phase 1 не схлопнула из-за exact-name distinction. Canonical form chosen by higher occurrence count.

alternative ratification: canonical `Single Leg KB Hip Thrust` (matching dominant KB-abbrev convention в остальном sample — `KB swings`, `KB clean & push press`). Phase 3.2 recommends full form per occurrence count и phonetic clarity; consistency abbrev обсуждаемо.

**escalation note**: choice of canonical (full vs KB) — minor style preference. Phase 5 / main session ratifies one convention.

---

### Merge 7: typo / orthography variant

**Group:** jumping Jacks family

candidates:

- `jumping Jacks` (14 occ, 21 ctx) — canonical.
- `jumping Jack's` (3 occ, 3 ctx) — apostrophe variant (typo).

decision: **merge `jumping Jack's` → `jumping Jacks`** (canonical без apostrophe).

reasoning: apostrophe — typo / English possessive artifact. Same exercise. Phase 1 не схлопнула из-за literal-string distinction.

---

### Merge 8: sequence modifier extraction

**Group:** single unders

candidates:

- `single unders` (2 occ, 3 ctx) — bare canonical.
- `single unders AFTER each set` (2 occ, 3 ctx) — same exercise + sequence modifier in name.

decision: **merge `single unders AFTER each set` → `single unders`** (canonical bare; `AFTER each set` извлекается как footnote sequence modifier — use-site).

reasoning: same exercise (single unders), `AFTER each set` — это footnote-style sequence indicator (Phase 3.1 §14 `*N single unders AFTER each set`). Indicator — use-site, не identity. Phase 1 кepta название whole row, но Phase 3.2 рекомендует strip sequence modifier из identity.

---

### Merge 9: MAX rep-notation extraction

**Group:** MAX-prefixed exercises

candidates:

- `MAX DB FRONT SQUATS` (1 occ, 1 ctx) → `DB front squats` (1 occ, 1 ctx)
- `MAX strict HSPU in remaining time` (1 occ, 1 ctx) → `strict HSPU` (22 occ, 46 ctx)

decision: **merge оба → атомарные exercises** (`MAX` — rep-notation, не часть identity).

reasoning: Phase 3.1 §2.4 классифицирует MAX как rep-notation primitive (3 sub-forms). MAX-prefix не определяет exercise — это per-occurrence rep count specification. Same movement.

caveat: `MAX ROUNDS in remaining time: 1-2-3-4-5 etc.` — это не exercise name, а schema header / progression seed (Phase 3.1 case-three-MAX-subforms). Не exercise — keep как-is для caталога compound rows (см. compound-composite-analysis.md), но classify канонически как compound row, не атомарное упражнение.

---

### Merge 10: distance variants для running

**Group:** RUN family — all running variations

candidates:

- `RUN` (1 occ, 4 ctx) — bare canonical generic running.
- `RUN 5 km` (1 occ, 12 ctx) — distance specified.
- `RUN 5-6 km` (1 occ, 16 ctx) — range.
- `RUN 5-7 km` (1 occ, 15 ctx) — range.
- `RUN 7 km` (1 occ, 3 ctx) — distance.
- `RUN 10 km` (1 occ, 1 ctx) — distance.
- `km run` (3 occ, 10 ctx) — word-order variant с distance prefix (occurrences `5 km run`, `5 km RUN`, `3-5 km run`).

decision: **merge все → canonical `RUN`** (distance/range — use-site rep-notation `N km` per Phase 3.1 §2.3).

reasoning:

- distance — это use-site количество (как reps для weighted exercises). Phase 3.1 §2.3 классифицирует `N km` как unit-bound count.
- word-order (`RUN 5 km` vs `5 km run`) — стилистика, не identity.
- Phase 2.2 archetype-run-distance уже трактует все running как один movement type с distance parameter.

merged-in count: 6 (7 entries → 1 canonical).

note для caталога: `RUN` единое canonical, distance/range — use-site rep notation. Каждое из 7 entries имеет own context list, но они все ссылаются на одну Exercise = `RUN` (locomotion / running).

---

### Merge 11: missing DB prefix (more context-implied)

**Group:** power cleans / power snatches / hang power cleans (no DB prefix)

candidates:

- `power cleans` (1 occ, 1 ctx) — `10 power cleans [ 2x 15 kg ]` в block-080. DB indicated by weight.
- `DB power cleans` (1 occ, 1 ctx) — `5 DB power cleans [ 2x 15 kg ]` в block-076.

decision: **merge `power cleans` → `DB power cleans`**.

reasoning: `[ 2x 15 kg ]` indicates DB equipment. Same movement (power clean technique with DB).

---

candidates:

- `power snatches` (1 occ, 1 ctx) — `10 power snatches [ 2x 15 kg ]` в block-003. DB indicated by weight.
- `DB power snatches` (2 occ, 3 ctx) — `DB power snatches [ 2x 15 kg ]`, `14 DB power snatches [ 2x 15 kg ]`.

decision: **merge `power snatches` → `DB power snatches`**.

reasoning: same as above, DB prefix dropped в occurrence text.

---

candidates:

- `hang power cleans` (2 occ, 2 ctx) — `3 min: 12-9-6 hang power cleans [ 2x 15 kg ]` (EMOM sub-min context).
- `DB hang power cleans` (7 occ, 9 ctx) — primary canonical.

decision: **merge `hang power cleans` → `DB hang power cleans`**.

reasoning: weight `[ 2x 15 kg ]` indicates DB. Same movement.

caveat: в EMOM sub-min context coach используется `3 min: 12-9-6 hang power cleans` без DB prefix (shorthand для tightness). Identity та же.

---

## Keep-separate groups (structural / semantic difference)

### Group A: DB Snatches variants by technique

candidates kept separate:

- `DB Snatches` (primary)
- `DB hang power snatches` (1 occ) — different setup: hang position + power lift technique.
- `DB hang snatches` (2 occ, LEFT/RIGHT paired) — hang setup without power qualifier.
- `DB power snatches` (3 occ, after merge of `power snatches`) — full lift from floor with power technique.
- `DB alt. snatches` (after merge of `alt. DB snatches`) — alternating execution.

reasoning: technical variants (hang vs floor start, power vs full, alternating vs simultaneous) — meaningfully different movements per coaching terminology. Each имеет свой demo URL (если был). Phase 5 / 6 могут рассмотреть group-level entity (movement family) — но в Phase 3.2 они остаются separate atomic exercises.

**escalation**: should `DB Snatches` + `DB alt. snatches` merge (alternating — use-site execution modifier)? Borderline. Phase 5 decision. См. `exercise-edge-cases.md`.

---

### Group B: DB bench presses + variants

kept separate:

- `DB bench presses` (primary)
- `incline DB bench presses` — incline angle variant.
- `alt. DB bench presses` — alternating execution variant.

reasoning: incline = different angle (mechanically different). Alternating — could be argued use-site, but `alt.` prefix establishes named variant в sample. Keep separate, escalate alternating.

---

### Group C: equipment variants

kept separate (different primary equipment):

- `DB single arm row` vs `KB single arm row` vs `single arm row` (split-tier KB+DB).
- `DB Bulgarian split squats` vs `KB Bulgarian split squats`.
- `DB Horn Grip Shoulder Front Raise` vs `KB Horn Grip Shoulder Front Raise` (same demo URL `HHEmtCuuPss` — interesting, same movement different equipment).

reasoning: primary_equipment intrinsic — different snaryady = different exercise. Note: same URL для DB/KB Horn Grip Shoulder Front Raise — указывает на same biomechanical movement, но Phase 3.2 keeps separate (equipment is identifying).

**alternative consideration**: можно ввести "movement family" abstraction где DB/KB Horn Grip — variants одного "Horn Grip Shoulder Front Raise" с equipment use-site. Phase 5 решает.

---

### Group D: HSPU variants

kept separate:

- `strict HSPU` (primary)
- `strict NEGATIVE HSPU` — eccentric variant.
- `deficit HSPU` — increased ROM variant.

reasoning: distinct training stimulus (full ROM vs eccentric-only vs increased deficit). Different demo URL для deficit (`from sofa/box` + `hand on DB | neutral grip`).

caveat: `strict HSPU [ from sofa ]` vs `strict HSPU [ from box/sofa ]` vs bare `strict HSPU` — это **same exercise** (strict HSPU), position modifier — use-site (Phase 3.1 §3 position annotation). NOT a separate exercise.

---

### Group E: bar dips variants

kept separate:

- `strict bar dips` (5 occ, 26 ctx) — strict execution.
- `bar dips` (2 occ, 5 ctx) — non-strict (kipping или not specified strict).

reasoning: `strict` modifier — meaningful technical distinction в gymnastics terminology. Strict bar dips ≠ kipping bar dips (different muscle activation, скорость).

---

### Group F: pull-up family variants

kept separate:

- `strict pull-ups` (23 occ) — primary
- `pull-ups` (1 occ) — non-strict variant
- `horizontal pull-ups` (2 occ) — table/bar row position
- `strict chin pull-ups` (1 occ) — supinated grip
- `strict ring pull-ups` (1 occ) — rings equipment
- `C2B pull-ups` (1 occ) — chest-to-bar variant

reasoning: gymnastics pull variants — meaningfully different (grip, equipment, ROM, kipping vs strict). Each named distinctly by coach.

---

### Group G: snatch / clean family — composite Olympic lifts

kept separate (different lift names):

- `KB clean & push press` (composite-named via `&`)
- `KB clean & jerk` (composite-named via `&`)
- `DB hang power clean & push press` (composite-named)
- `DB hang power clean + DB push press` (compound via `+`)
- `DB hang power cleans + push press` (compound via `+`, plural)
- `hang power clean & push press` (composite-named, no DB prefix)
- `DB snatch + DB squats` (compound)
- `DB snatches + DB thrusters` (compound)

reasoning: Phase 3.2 preserves the textual distinction между `&` (traditional composite name) и `+` (compound rep). Phase 5 решает, объединять ли. См. `compound-composite-analysis.md` для granularity options.

**escalation pair**:

- `DB hang power clean & push press` vs `DB hang power clean + DB push press` — same Olympic lift, different connector. Merge?
- `DB hang power clean & push press` vs `hang power clean & push press` — same lift, DB prefix dropped. Merge?

См. `exercise-edge-cases.md`.

---

### Group H: HS walk / Handstand variants

kept separate:

- `Handstand Plate Walk` (1 occ, 2 ctx)
- `Lateral HS walk near wall` (1 occ, 2 ctx)

reasoning: different handstand movements (plate walk vs lateral walk near wall). Different URLs.

---

### Group I: glute bridge / hip thrust

kept separate:

- `single leg GLUTE BRIDGE` (6 occ, 59 ctx) — ground-based glute bridge with single leg.
- `Single Leg Kettlebell Hip Thrust` (5 occ, 28 ctx — after merge of `Single Leg KB Hip Thrust`) — bench-based hip thrust with KB.
- `Glute Loop DB Hip Thrust` (3 occ, 8 ctx) — DB hip thrust with glute loop band.
- `DB Glute Bridge Bench Press` (2 occ, 2 ctx) — combined glute bridge + bench press.

reasoning: different setup/equipment/movement combinations.

---

### Group J: Cossacs squats variants

kept separate:

- `DB Cossacs squats` (1 occ, 1 ctx) — DB loaded.
- `Low Hold KB Cossack Squat` (1 occ, 9 ctx) — KB + low hold variant.
- `Cossacs squats AFTER EACH GYMNASTICS set` (1 occ, 1 ctx) — bodyweight (no equipment annotation) + sequence modifier in name.

reasoning: different equipment / hold variant. Note: `Cossacs squats AFTER EACH GYMNASTICS set` — bare Cossacs (bodyweight) + sequence modifier. Phase 3.2 рекомендует extract sequence → use-site, canonical = `Cossacs squats` (bodyweight). Но единственная occurrence — keep as-is или extract. См. `exercise-edge-cases.md`.

**escalation**: extract `AFTER EACH GYMNASTICS set` из `Cossacs squats AFTER EACH GYMNASTICS set` → canonical `Cossacs squats` bodyweight + use-site round-scope modifier `[ after each GYMNASTICS round ]`? Phase 3.2 — leave as-is (singleton, Phase 5 решает).

---

### Group K: thrusters variants

kept separate:

- `DB thrusters` (6 occ, 8 ctx)
- `DB thrusters [ kind of wall balls ]` — same exercise + free-text clarification (already in occurrences, not separate entry).

reasoning: no separate entries to merge. `kind of wall balls` — use-site clarification.

---

### Group L: bench-related exercises

kept separate:

- `DB bench presses` (primary)
- `DB INCLINE bench presses` → merged (Merge 3)
- `incline DB bench presses` — kept
- `alt. DB bench presses` — kept (alternating named variant)
- `bench presses` → merged (Merge 4)
- `DB bench presses LEFT arm | RIGHT arm HOLD in UP` — composite name с pipe (asymmetric paired). Phase 1 didn't strip pipe-content из имени. Phase 3.2: keep as-is (singleton composite-name), может быть viewed как `DB bench presses` + use-site composite modifier. **Escalate.**
- `DB bench presses RIGHT arm | LEFT arm HOLD in UP` — mirror.

---

### Group M: snatches/cleans pattern variants

(see Group A; Group G)

---

## Compound rows (`+`-connector) — not exercise merges

97 compound rows из Phase 3.1 §4. Каждый — distinct compound row, не candidate для merge с atomic exercise. Все имеют `canonical_compound_type = compound_plus`.

Однако возможны внутри-compound merge candidates:

- `traverses + 5 bar dips + traverses + 5 bar dips` vs `traverses + 7 bar dips + traverses + 7 bar dips` etc. (11 numeric variants).
- Phase 1 split numeric variants (Phase 1 note: "каждый numeric-вариант разлогался в отдельную карточку, чтобы не терять numeric-семантику").
- Phase 3.2: keep numeric variants separate (Phase 1 decision стоит). См. `compound-composite-analysis.md`.

---

## OR-alternative rows — not exercise merges

3 alternative rows из Phase 3.1 §5. Каждый — own compound expression (`X OR Y`). Не candidate для merge.

Internal-merge candidates:

- `strict bar dips OR 10 push ups` (occurrence `5 strict bar dips OR 10 push ups`) — appears 2 раза с leading count 5.
- `strict bar dips OR 20 push ups` (occurrence `10 strict bar dips OR 20 push ups`) — appears 1 раз с leading count 10.

Phase 3.2: keep separate (different scaling ratios in alternative).

---

## Escalations to main session

1. **DB Snatches vs DB alt. snatches** — should "alternating" быть use-site execution modifier (then merge into DB Snatches), или intrinsic variant (keep separate)? Sample shows alternating execution annotated both ways: (a) name prefix `alt.` / `alternative`, (b) annotation `[ alternative ]`. Phase 5 decides.

2. **`&` vs `+` connector for same Olympic lift** — `DB hang power clean & push press` vs `DB hang power clean + DB push press` vs `hang power clean & push press` vs `DB hang power cleans + push press` — same movement, 4 textual variants. Should they merge as composite_named, all `+` forms decompose? Phase 5 / `compound-composite-analysis.md` granularity options.

3. **`Single Leg Kettlebell Hip Thrust` canonical form** — full `Kettlebell` vs abbrev `KB`. Style preference. Phase 5 ratifies.

4. **DB/KB Horn Grip Shoulder Front Raise** — same demo URL, different equipment. Keep separate (Phase 3.2) или introduce "movement family" abstraction? Phase 5 decides if movement-family entity is useful.

5. **Cossacs squats AFTER EACH GYMNASTICS set extraction** — `AFTER EACH GYMNASTICS set` part of name (current Phase 1) или sequence modifier extracted? Phase 5 decides.

6. **DB bench presses LEFT arm | RIGHT arm HOLD in UP** (and mirror) — should `LEFT arm | RIGHT arm HOLD in UP` extract as use-site composite modifier, canonical = `DB bench presses`? Phase 5 decides.

7. **single arm row (split-tier weight)** — generic `single arm row [ 5 KB 24 kg + 10 DB 15 kg ]` — equipment is `mixed` (split-tier). Should this be separate Exercise (compound equipment) or DB/KB single arm row siblings? Phase 5 decides whether to introduce split-tier variant or treat split-tier weight as composite annotation на one of DB/KB rows.

---

## Summary

- **Total merges propose**: 19 (10 ratified + 6 RUN-family + 3 missing-DB-prefix).
- **Total escalations**: 7 distinct cases.
- **Keep-separate groups**: 13 documented (A-M).
- **Unique exercises after merges**: 168 - 19 = **149**.
- **Note on compound rows**: 97 compound `+` rows и 3 `OR` rows treated в compound-composite-analysis.md (не в merge candidates here).
