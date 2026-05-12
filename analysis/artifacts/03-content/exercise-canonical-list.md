# Exercise canonical list (Phase 3.2)

Финальный список нормализованных exercises с filled intrinsic attributes. После ratified merges (`exercise-merge-candidates.md`).

**Total unique exercises after merge: 149** (168 raw entries - 19 merged = 149).

Group breakdown:

- Atomic exercises: 93 (single-movement entities).
- Compound `+` rows: 47 (compound-rep / compound-set expressions, classification per `compound-composite-analysis.md`).
- Composite `&` named: 4 (traditional composite Olympic-lift naming).
- OR-alternative rows: 2 (`X OR Y` substitution rows).
- Placeholder exercises: 2 (slots resolved per-set).
- Special schema-content singleton: 1 (`MAX ROUNDS in remaining time:` — schema-content row, kept for completeness).

Format per entry:

- canonical_name
- primary_equipment
- movement_type_tag (primary [/ secondary if applicable])
- default_demo_url
- canonical_compound_type
- placeholder_flag
- aliases (если есть merged entries)
- notes (key observations)

Cardinality refers to Phase 1 `occurrences` count and `contexts` count from `exercise-instances.md`. After merge, cardinalities may sum.

---

## §1. Atomic exercises (single-movement entities)

### strict pull-ups

- canonical_name: strict pull-ups
- primary_equipment: bodyweight
- movement_type_tag: pull
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 23 occ / 61 ctx. Variants `[ neutral grip ]`, sequence modifiers `[ before/after BAR DIPS complex ]` — use-site.

### single leg GLUTE BRIDGE

- canonical_name: single leg GLUTE BRIDGE
- primary_equipment: bodyweight
- movement_type_tag: hinge
- default_demo_url: https://www.youtube.com/watch?v=EJXAJfzT9AA
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 6 occ / 59 ctx. 5/6 inline URL → intrinsic. `[ each leg ]` ubiquitous use-site.

### hamstring curls

- canonical_name: hamstring curls
- primary_equipment: bodyweight
- movement_type_tag: extension
- default_demo_url: https://www.youtube.com/watch?v=s3_W2rAbCiA
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 7 occ / 53 ctx. 0 inline URL; intrinsic URL via 31 standalone `[ URL ]` rows in same schemas (Phase 3.1 §13.1). Nordic-curl style. Always с `[ AFTER each Nth REP - M sec pause ]` use-site.

### strict HSPU

- canonical_name: strict HSPU
- primary_equipment: bodyweight
- movement_type_tag: press
- default_demo_url: https://www.youtube.com/watch?v=V5libCZNTkI
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [MAX strict HSPU in remaining time (merged — MAX is rep-notation)]
- notes: 23 occ / ~47 ctx. Demo URL appears for `from box/sofa` variant. Position modifiers `[ from sofa ]`, `[ from box/sofa ]` — use-site.

### Hip ABduction with band

- canonical_name: Hip ABduction with band
- primary_equipment: band
- movement_type_tag: unknown
- default_demo_url: https://www.youtube.com/watch?v=k0oEjtPIsXI
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 41 ctx. Movement tag unknown — hip abduction isolation doesn't fit primary enum cleanly. Warm-up staple.

### Hip ADduction with band

- canonical_name: Hip ADduction with band
- primary_equipment: band
- movement_type_tag: unknown
- default_demo_url: https://www.youtube.com/watch?v=rq8tHYwBAOY
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 34 ctx. Paired with Hip ABduction in warm-up.

### seated lateral BANDED raises

- canonical_name: seated lateral BANDED raises
- primary_equipment: band
- movement_type_tag: raise
- default_demo_url: https://www.youtube.com/watch?v=KXqJzrrTDBo
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 9 occ / 33 ctx. SUCCESSORY WORK staple. Complex `[ 1 ARM HOLD in UP | ... ]` variant — use-site singleton.

### pull overs

- canonical_name: pull overs
- primary_equipment: dumbbell
- movement_type_tag: pull
- default_demo_url: https://www.youtube.com/watch?v=owr5y-s6-Qk
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 4 occ / 32 ctx. Equipment dumbbell implied by context (PUMP SESSION) — borderline naming (no DB prefix). См. `exercise-edge-cases.md`: possible merge with `DB pull overs`.

### KB high pull

- canonical_name: KB high pull
- primary_equipment: kettlebell
- movement_type_tag: pull
- default_demo_url: https://www.youtube.com/watch?v=E21F3Oh7A60
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 4 occ / 28 ctx. SUCCESSORY WORK.

### Single Leg Kettlebell Hip Thrust

- canonical_name: Single Leg Kettlebell Hip Thrust
- primary_equipment: kettlebell
- movement_type_tag: hinge
- default_demo_url: none (inline); standalone URL `UrmwWL1oqKk` likely associated (Phase 3.1 §13.1, 18 standalone rows) but not verified inline
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [Single Leg KB Hip Thrust (merged — abbrev expansion)]
- notes: 7 occ combined / 33 ctx combined. SUCCESSORY WORK staple. Always с `[ each leg ]`, `[ + N sec pause in UP position ]`.

### DB bench presses

- canonical_name: DB bench presses
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [bench presses (merged — DB implied by weight)]
- notes: 6 occ combined / 27 ctx combined. PUMP SESSION / STRENGTH ENDURANCE staple. Always `[ 2x 15 kg ]` weight.

### DB single arm row

- canonical_name: DB single arm row
- primary_equipment: dumbbell
- movement_type_tag: pull
- default_demo_url: https://www.youtube.com/watch?v=xl1YiqQY2vA
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 11 occ / 26 ctx. 9/11 (82%) inline URL → intrinsic. Variant `[ WITHOUT BENCH ]` has different URL `_LJQDmOcTbE` — variant-specific.

### rear delt with BANDED

- canonical_name: rear delt with BANDED
- primary_equipment: band
- movement_type_tag: raise
- default_demo_url: https://www.youtube.com/watch?v=dBJzki-hKfo
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 3 occ / 26 ctx. SUCCESSORY. Shared demo URL with SINGLE ARM / TWO ARMS rear delt variants.

### strict bar dips

- canonical_name: strict bar dips
- primary_equipment: parallel_bars
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 5 occ / 26 ctx. Gymnastics press. Strict modifier distinguishes from kipping `bar dips`.

### strict T2B

- canonical_name: strict T2B
- primary_equipment: bodyweight
- movement_type_tag: core
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 25 ctx. Toes-to-bar core hold/lift, gymnastics.

### SINGLE ARM rear delt with BANDED

- canonical_name: SINGLE ARM rear delt with BANDED
- primary_equipment: band
- movement_type_tag: raise
- default_demo_url: https://www.youtube.com/watch?v=dBJzki-hKfo
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 6 occ / 24 ctx. Variant of rear delt with BANDED (single-arm execution). Same URL.

### DB seated good morning

- canonical_name: DB seated good morning
- primary_equipment: dumbbell
- movement_type_tag: hinge
- default_demo_url: https://www.youtube.com/watch?v=x5nnk8hUBo4
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 3 occ / 23 ctx. CORE MUSCLES / SUCCESSORY.

### DB squats

- canonical_name: DB squats
- primary_equipment: dumbbell
- movement_type_tag: squat
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 15 occ / 22 ctx. STRENGTH ENDURANCE staple. All occurrences `[ 2x 15 kg ]`. Whitespace variant `[ 2x15 kg ]` = same.

### jumping Jacks

- canonical_name: jumping Jacks
- primary_equipment: bodyweight
- movement_type_tag: cardio_flow
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [jumping Jack's (merged — apostrophe typo)]
- notes: 17 occ combined / 22 ctx combined. Cardio filler. Variant `[ ONLY ONCE before METCON ]` — use-site.

### incline DB bench presses

- canonical_name: incline DB bench presses
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [DB INCLINE bench presses (merged — case/order variant)]
- notes: 6 occ combined / 21 ctx combined. PUMP SESSION.

### Single Leg Single Kettlebell Deadlift

- canonical_name: Single Leg Single Kettlebell Deadlift
- primary_equipment: kettlebell
- movement_type_tag: hinge
- default_demo_url: https://www.youtube.com/watch?v=VnHvZtV8Gz0
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 3 occ / 17 ctx. SUCCESSORY. Per-leg execution implicit в имени.

### DB Bulgarian split squats

- canonical_name: DB Bulgarian split squats
- primary_equipment: dumbbell
- movement_type_tag: lunge
- default_demo_url: https://www.youtube.com/watch?v=G0Mo2LF8uLU
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 6 occ / 16 ctx. SUCCESSORY WORK named-exercise-program archetype с drop-set program в `[ ]` annotation.

### DB halfkneeling press

- canonical_name: DB halfkneeling press
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: https://www.youtube.com/watch?v=-7zgcCU2kW4
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 16 ctx.

### DB Horn Grip Shoulder Front Raise

- canonical_name: DB Horn Grip Shoulder Front Raise
- primary_equipment: dumbbell
- movement_type_tag: raise
- default_demo_url: https://www.youtube.com/watch?v=HHEmtCuuPss
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 16 ctx. Same demo URL as KB Horn Grip variant (shared movement biomechanics, equipment differs).

### KB Single Leg RDL to Reverse Lunge

- canonical_name: KB Single Leg RDL to Reverse Lunge
- primary_equipment: kettlebell
- movement_type_tag: lunge
- default_demo_url: https://www.youtube.com/watch?v=CpYyGD2hlv4
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 16 ctx. Combined hinge+lunge movement.

### RUN

- canonical_name: RUN
- primary_equipment: bodyweight
- movement_type_tag: locomotion
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [RUN 5 km, RUN 5-6 km, RUN 5-7 km, RUN 7 km, RUN 10 km, km run (all merged — distance is use-site)]
- notes: ~50 ctx combined across 7 distance variants merged. Distance / range = use-site rep-notation per Phase 3.1 §2.3.

### TWO ARMS rear delt with BANDED

- canonical_name: TWO ARMS rear delt with BANDED
- primary_equipment: band
- movement_type_tag: raise
- default_demo_url: https://www.youtube.com/watch?v=dBJzki-hKfo
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 3 occ / 16 ctx. Variant of rear delt with BANDED, dual-arm.

### horizontal pull-ups

- canonical_name: horizontal pull-ups
- primary_equipment: bodyweight
- movement_type_tag: pull
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 15 ctx. Table/bar row position.

### DB Snatches

- canonical_name: DB Snatches
- primary_equipment: dumbbell
- movement_type_tag: hinge
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [DB snatch (merged — singular)]
- notes: 11 occ combined / 12 ctx combined. Use-site weight varies: `[ 1x 15 kg ]`, `[ 2x 15 kg ]`, `[ 15 kg ] [ alternative ]`.

### push ups

- canonical_name: push ups
- primary_equipment: bodyweight
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 3 occ / 11 ctx. GYMNASTICS substitution для bar dips.

### alternative DB press

- canonical_name: alternative DB press
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: https://www.youtube.com/watch?v=T9OFhjgXt6c
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 9 ctx. Alternating arm press.

### DB hang power cleans

- canonical_name: DB hang power cleans
- primary_equipment: dumbbell
- movement_type_tag: hinge
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [hang power cleans (merged — DB implied by weight)]
- notes: 9 occ combined / 11 ctx combined. STRENGTH ENDURANCE.

### Low Hold KB Cossack Squat

- canonical_name: Low Hold KB Cossack Squat
- primary_equipment: kettlebell
- movement_type_tag: squat
- default_demo_url: https://www.youtube.com/watch?v=ZclBW2lK-lY
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 9 ctx.

### DB thrusters

- canonical_name: DB thrusters
- primary_equipment: dumbbell
- movement_type_tag: squat / press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 6 occ / 8 ctx. Combined squat+press. Variant `[ kind of wall balls ]` — execution clarification (use-site).

### Glute Loop DB Hip Thrust

- canonical_name: Glute Loop DB Hip Thrust
- primary_equipment: mixed (band + dumbbell)
- movement_type_tag: hinge
- default_demo_url: https://www.youtube.com/watch?v=YdhYJv9ccPQ
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 3 occ / 8 ctx. Hip thrust с glute loop band + DB.

### 3x 10 DB Jefferson curls

- canonical_name: 3x 10 DB Jefferson curls
- primary_equipment: dumbbell
- movement_type_tag: hinge
- default_demo_url: https://www.youtube.com/watch?v=YGlAdtSKQaU
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 7 ctx. `3x 10` sets×reps prefix embedded in name. Escalate Phase 5: strip prefix → `DB Jefferson curls` + use-site sets/reps.

### alt. DB bench presses

- canonical_name: alt. DB bench presses
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: https://www.youtube.com/watch?v=7CHPqVxJOUE
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 5 ctx. Alternating bench press.

### bar dips

- canonical_name: bar dips
- primary_equipment: parallel_bars
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 5 ctx. Non-strict variant of strict bar dips.

### DB bent over row

- canonical_name: DB bent over row
- primary_equipment: dumbbell
- movement_type_tag: pull
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 5 ctx.

### DB leg extension

- canonical_name: DB leg extension
- primary_equipment: dumbbell
- movement_type_tag: extension
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 5 ctx. 2 different URLs across occurrences — URL use-site (variant-specific).

### DB pull overs

- canonical_name: DB pull overs
- primary_equipment: dumbbell
- movement_type_tag: pull
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 5 ctx. Possible merge candidate with `pull overs` — escalation.

### DB Seated Single Arm Arnold Press

- canonical_name: DB Seated Single Arm Arnold Press
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: https://www.youtube.com/watch?v=3Lhln4TspkU
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 5 ctx.

### deficit DB push ups

- canonical_name: deficit DB push ups
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 5 ctx. DB as deficit (hands on DB for greater ROM).

### deficit HSPU

- canonical_name: deficit HSPU
- primary_equipment: bodyweight
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 4 occ / 5 ctx. Increased deficit HSPU variant. Position modifiers `[ from sofa ]`, `[ hand on DB | neutral grip ]` — use-site.

### KB Horn Grip Shoulder Front Raise

- canonical_name: KB Horn Grip Shoulder Front Raise
- primary_equipment: kettlebell
- movement_type_tag: raise
- default_demo_url: https://www.youtube.com/watch?v=HHEmtCuuPss
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 5 ctx. Same URL as DB Horn Grip variant.

### KB single arm row

- canonical_name: KB single arm row
- primary_equipment: kettlebell
- movement_type_tag: pull
- default_demo_url: https://www.youtube.com/watch?v=xl1YiqQY2vA
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [KB [ 24 kg ] single arm row (merged — weight as use-site)]
- notes: 2 occ combined / 6 ctx combined. Same URL as DB single arm row.

### KB swings

- canonical_name: KB swings
- primary_equipment: kettlebell
- movement_type_tag: hinge
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 4 occ / 4 ctx. Variants `[ 24 kg | to the parallel ]` depth, `[ emphasis on the gluteal muscles ]` — use-site.

### Straight Arm Banded Lat Pull Down

- canonical_name: Straight Arm Banded Lat Pull Down
- primary_equipment: band
- movement_type_tag: pull
- default_demo_url: https://www.youtube.com/watch?v=LfGyMCw_Zd0
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 4 ctx.

### DB A-push ups

- canonical_name: DB A-push ups
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: https://www.youtube.com/watch?v=zjEHDw569b0
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 3 ctx. DBs on floor as A-shape stance.

### DB lunges

- canonical_name: DB lunges
- primary_equipment: dumbbell
- movement_type_tag: lunge
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 3 occ / 3 ctx. Variant `[ hold farm carry ]` — use-site position.

### DB power snatches

- canonical_name: DB power snatches
- primary_equipment: dumbbell
- movement_type_tag: hinge
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [power snatches (merged — DB implied)]
- notes: 3 occ combined / 4 ctx combined.

### single arm row

- canonical_name: single arm row
- primary_equipment: mixed
- movement_type_tag: pull
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 3 ctx. Split-tier weight `[ 5 KB 24 kg + 10 DB 15 kg ]` defines per-set 2-stage execution. Distinct from DB / KB single arm row due to mixed equipment in single set. Escalate Phase 5.

### single unders

- canonical_name: single unders
- primary_equipment: bodyweight
- movement_type_tag: cardio_flow
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [single unders AFTER each set (merged — sequence modifier extracted)]
- notes: 4 occ combined / 6 ctx combined. Jump rope cardio. Footnote variant `*N single unders AFTER each set` — use-site round-scope.

### air squats

- canonical_name: air squats
- primary_equipment: bodyweight
- movement_type_tag: squat
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 2 ctx.

### burpees

- canonical_name: burpees
- primary_equipment: bodyweight
- movement_type_tag: cardio_flow
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 3 ctx. Variant `[ WITHOUT JUMP ]` — use-site execution modifier.

### C2B pull-ups

- canonical_name: C2B pull-ups
- primary_equipment: bodyweight
- movement_type_tag: pull
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Chest-to-bar variant.

### DB deadlifts

- canonical_name: DB deadlifts
- primary_equipment: dumbbell
- movement_type_tag: hinge
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 2 ctx.

### DB farmer carry lunges

- canonical_name: DB farmer carry lunges
- primary_equipment: dumbbell
- movement_type_tag: carry / lunge
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 2 ctx. Combined movement (carry hold + lunge).

### DB floor Fly

- canonical_name: DB floor Fly
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: https://www.youtube.com/watch?v=bgC53-J-6gA
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Fly isolation, floor position.

### DB Glute Bridge Bench Press

- canonical_name: DB Glute Bridge Bench Press
- primary_equipment: dumbbell
- movement_type_tag: hinge / press
- default_demo_url: https://www.youtube.com/watch?v=CyHxva5XYYY
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 2 ctx. Combined movement (glute bridge hold + bench press).

### DB hang snatches

- canonical_name: DB hang snatches
- primary_equipment: dumbbell
- movement_type_tag: hinge
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 1 ctx. Paired rows `[ LEFT ARM ]` + `[ RIGHT ARM ]`. Variant of DB Snatches (hang start position).

### DB Renegade row

- canonical_name: DB Renegade row
- primary_equipment: dumbbell
- movement_type_tag: pull
- default_demo_url: https://www.youtube.com/watch?v=bi1Nf5G86gU
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 2 ctx. Original Phase 1 heading kept URL inline (`DB Renegade row [ URL ]`). Phase 3.2 strips URL (intrinsic via default_demo_url). Compound-rep definition `{ 1 push up + each arm row = 1 rep }` — use-site rep-definition annotation.

### Handstand Plate Walk

- canonical_name: Handstand Plate Walk
- primary_equipment: bodyweight
- movement_type_tag: locomotion
- default_demo_url: https://www.youtube.com/watch?v=wLTv_uUVcRw
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Handstand walk over plates.

### KB Bulgarian split squats

- canonical_name: KB Bulgarian split squats
- primary_equipment: kettlebell
- movement_type_tag: lunge
- default_demo_url: https://www.youtube.com/watch?v=G0Mo2LF8uLU
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Same URL as DB Bulgarian split squats.

### Lateral HS walk near wall

- canonical_name: Lateral HS walk near wall
- primary_equipment: bodyweight
- movement_type_tag: locomotion
- default_demo_url: https://www.youtube.com/watch?v=N2QNWiQie-A
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 2 ctx.

### V-ups

- canonical_name: V-ups
- primary_equipment: bodyweight
- movement_type_tag: core
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 2 ctx.

### DB alt. snatches

- canonical_name: DB alt. snatches
- primary_equipment: dumbbell
- movement_type_tag: hinge
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [alt. DB snatches (merged — word order)]
- notes: 2 occ combined / 2 ctx combined. Alternating snatches. Borderline merge with DB Snatches — escalate.

### bench presses → merged into DB bench presses (no separate entry).

### burpees over DB

- canonical_name: burpees over DB
- primary_equipment: bodyweight
- movement_type_tag: cardio_flow
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Burpees with lateral DB hop-over.

### Cossacs squats AFTER EACH GYMNASTICS set

- canonical_name: Cossacs squats AFTER EACH GYMNASTICS set
- primary_equipment: bodyweight
- movement_type_tag: squat
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Sequence indicator embedded в name (no bracket). Escalate: extract → `Cossacs squats` + use-site round-scope sequence.

### DB Cossacs squats

- canonical_name: DB Cossacs squats
- primary_equipment: dumbbell
- movement_type_tag: squat
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Lateral squat variant.

### DB front squats

- canonical_name: DB front squats
- primary_equipment: dumbbell
- movement_type_tag: squat
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [MAX DB FRONT SQUATS (merged — MAX is rep-notation)]
- notes: 2 occ combined / 2 ctx combined.

### DB hang power snatches

- canonical_name: DB hang power snatches
- primary_equipment: dumbbell
- movement_type_tag: hinge
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Hang+power snatch combination, distinct from DB Snatches.

### DB INCLINE bench presses → merged into incline DB bench presses.

### DB power cleans

- canonical_name: DB power cleans
- primary_equipment: dumbbell
- movement_type_tag: hinge
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- aliases: [power cleans (merged — DB implied)]
- notes: 2 occ combined / 2 ctx combined.

### DB push presses

- canonical_name: DB push presses
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx.

### DB snatch → merged into DB Snatches.

### DB STOH

- canonical_name: DB STOH
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Shoulder-to-overhead. Annotation `[ push press OR push jerk ]` — technique-choice modifier.

### EXPLODE bulgarian squats

- canonical_name: EXPLODE bulgarian squats
- primary_equipment: bodyweight
- movement_type_tag: lunge
- default_demo_url: https://www.youtube.com/watch?v=4XvvvqSg-ds
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Explosive Bulgarian split squat вариант (no weight).

### KB Goblet squats

- canonical_name: KB Goblet squats
- primary_equipment: kettlebell
- movement_type_tag: squat
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx.

### KB SDHP

- canonical_name: KB SDHP
- primary_equipment: kettlebell
- movement_type_tag: hinge / pull
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Sumo deadlift high pull, KB.

### lateral DB over burpees

- canonical_name: lateral DB over burpees
- primary_equipment: bodyweight
- movement_type_tag: cardio_flow
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Lateral hop-over burpee variant. Distinct from `burpees over DB`.

### OH DB lunges

- canonical_name: OH DB lunges
- primary_equipment: dumbbell
- movement_type_tag: lunge / carry
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 1 ctx. Overhead DB hold + lunge. Paired rows `[ LEFT ARM ]` + `[ RIGHT ARM ]`.

### overhead squats

- canonical_name: overhead squats
- primary_equipment: barbell
- movement_type_tag: squat
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx. `[ 50/30 kg ]` dual-value weight (interpretation deferred — Phase 6). Barbell implied by weight magnitude (50 kg > typical DB).

### plyo push ups

- canonical_name: plyo push ups
- primary_equipment: bodyweight
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 6 ctx as standalone. Also appears widely в compound rows (`plyo push ups + 10 incline DB bench presses`).

### pull-ups

- canonical_name: pull-ups
- primary_equipment: bodyweight
- movement_type_tag: pull
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Non-strict pull-ups (kipping allowed).

### Incline DB Prone Row

- canonical_name: Incline DB Prone Row
- primary_equipment: dumbbell
- movement_type_tag: pull
- default_demo_url: https://www.youtube.com/watch?v=7fxY8buPV0Q
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 2 occ / 4 ctx.

### strict chin pull-ups

- canonical_name: strict chin pull-ups
- primary_equipment: bodyweight
- movement_type_tag: pull
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Supinated grip pull-up variant.

### strict NEGATIVE HSPU

- canonical_name: strict NEGATIVE HSPU
- primary_equipment: bodyweight
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Eccentric-only HSPU.

### strict ring pull-ups

- canonical_name: strict ring pull-ups
- primary_equipment: rings
- movement_type_tag: pull
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 1 ctx.

### DB bench presses LEFT arm | RIGHT arm HOLD in UP

- canonical_name: DB bench presses LEFT arm | RIGHT arm HOLD in UP
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic (composite-name с pipe-modifier in name; не decomposed Phase 1)
- placeholder_flag: false
- notes: 1 occ / 2 ctx. `LEFT arm | RIGHT arm HOLD in UP` — composite asymmetric arm modifier embedded in name. Escalate: extract → `DB bench presses` + composite use-site modifier.

### DB bench presses RIGHT arm | LEFT arm HOLD in UP

- canonical_name: DB bench presses RIGHT arm | LEFT arm HOLD in UP
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: atomic
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Mirror of LEFT arm variant.

---

## §2. Compound rows (`+` connector)

Phase 3.1 §4: 97 distinct compound rows. Каждое — composition с canonical_compound_type=`compound_plus`. Granularity options см. `compound-composite-analysis.md`.

### ANY exercise for ABS + DB seated good morning

- canonical_name: ANY exercise for ABS + DB seated good morning
- primary_equipment: mixed (placeholder + dumbbell)
- movement_type_tag: core / hinge
- default_demo_url: https://www.youtube.com/watch?v=x5nnk8hUBo4
- canonical_compound_type: compound_plus
- placeholder_flag: true (contains placeholder)
- notes: 1 occ / 27 ctx. Placeholder + concrete compound. Flavor G.

### DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses

- canonical_name: DB bench presses [ 2x 15 kg ] + 5 single ARM bench presses
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 3 variants / 6 ctx. Flavor A (paired).

### DB Bulgarian split squats + 10 withot DB

- canonical_name: DB Bulgarian split squats + 10 withot DB
- primary_equipment: dumbbell
- movement_type_tag: lunge
- default_demo_url: https://www.youtube.com/watch?v=G0Mo2LF8uLU
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 6 ctx. Flavor A. Typo `withot` = without. Drop-set in single row (DB + bodyweight).

### incline DB bench presses [ 2x 15 kg ] + 10 plyo push ups

- canonical_name: incline DB bench presses [ 2x 15 kg ] + 10 plyo push ups
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 5 ctx. Flavor A.

### KB push press [ 24 kg ] + 10 DB halfkneeling press

- canonical_name: KB push press [ 24 kg ] + 10 DB halfkneeling press
- primary_equipment: mixed (KB + DB)
- movement_type_tag: press
- default_demo_url: https://www.youtube.com/watch?v=-7zgcCU2kW4
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 4 ctx. Cross-equipment compound. Flavor A.

### strict DB press + 10 DB push press + 5 strict DB press

- canonical_name: strict DB press + 10 DB push press + 5 strict DB press
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 4 ctx. Flavor D (sandwich).

### strict DB press + 7 DB push press [ 2x 15 kg ]

- canonical_name: strict DB press + 7 DB push press [ 2x 15 kg ]
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 2 occ / 4 ctx. Flavor A. With `[ 2 sec SLOW down ]` use-site tempo.

### traverses + strict bar dips

- canonical_name: traverses + strict bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 8 ctx. Flavor A или E (implicit cyclical).

### DB hang power cleans + push press

- canonical_name: DB hang power cleans + push press
- primary_equipment: dumbbell
- movement_type_tag: hinge / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Flavor B (1-rep composite).

### DB snatch + DB squats

- canonical_name: DB snatch + DB squats
- primary_equipment: dumbbell
- movement_type_tag: hinge / squat
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 3 ctx. Flavor A.

### DB snatches + DB thrusters

- canonical_name: DB snatches + DB thrusters
- primary_equipment: dumbbell
- movement_type_tag: hinge / squat
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 3 variants / 2 ctx. Flavor A. Paired LEFT/RIGHT arm.

### bar dips + traverses + turn back 180\* + traverses

- canonical_name: bar dips + traverses + turn back 180\* + traverses
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press / rotational
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 8 ctx. Flavor E (cyclical) — variant 2 with rotation. 4-element pattern. Implicit count.

### plyo push ups + 10 incline DB bench presses

- canonical_name: plyo push ups + 10 incline DB bench presses
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 2 variants / 2 ctx. Flavor A.

### DB squats [ 2x 15 kg ] + 10 V-ups

- canonical_name: DB squats [ 2x 15 kg ] + 10 V-ups
- primary_equipment: mixed (dumbbell + bodyweight)
- movement_type_tag: squat / core
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Flavor A.

### traverses + 5 bar dips + traverses + 5 bar dips

- canonical_name: traverses + 5 bar dips + traverses + 5 bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 4 ctx. Flavor E (cyclical symmetric).

### traverses + 7 bar dips + traverses + 7 bar dips

- canonical_name: traverses + 7 bar dips + traverses + 7 bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 4 ctx. Flavor E (cyclical symmetric, 7 reps).

### traverses + 9 bar dips + traverses + 9 bar dips

- canonical_name: traverses + 9 bar dips + traverses + 9 bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 4 ctx. Flavor E (cyclical).

### traverses + 8 bar dips + traverses + 7 bar dips

- canonical_name: traverses + 8 bar dips + traverses + 7 bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 5 ctx. Flavor E (cyclical descending).

### traverses + 6 bar dips + traverses + 3 bar dips

- canonical_name: traverses + 6 bar dips + traverses + 3 bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 3 ctx. Flavor E.

### traverses + 7 bar dips + traverses + 5 bar dips

- canonical_name: traverses + 7 bar dips + traverses + 5 bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 3 ctx. Flavor E.

### traverses + 10 bar dips + traverses + 10 bar dips

- canonical_name: traverses + 10 bar dips + traverses + 10 bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor E (cyclical 10/10).

### traverses + 15 bar dips + traverses + 15 bar dips

- canonical_name: traverses + 15 bar dips + traverses + 15 bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor E (cyclical 15/15).

### traverses + 11 bar dips + traverses + 10 bar dips

- canonical_name: traverses + 11 bar dips + traverses + 10 bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Flavor E.

### traverses + 3 bar dips + traverses + 3 bar dips

- canonical_name: traverses + 3 bar dips + traverses + 3 bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor E.

### traverses + 5 bar dips + traverses + 4 bar dips

- canonical_name: traverses + 5 bar dips + traverses + 4 bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Flavor E.

### traverses + bar dips

- canonical_name: traverses + bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor E (implicit cyclical without explicit count).

### traverses + 5-7 bar dips

- canonical_name: traverses + 5-7 bar dips
- primary_equipment: parallel_bars
- movement_type_tag: locomotion / press
- default_demo_url: https://www.youtube.com/watch?v=hsat8D8KN_k&t=20s
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor A с range count. Single occurrence has demo URL.

### 30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK

- canonical_name: 30 sec PLANK + 30 sec LEFT side PLANK + 30 sec RIGHT side PLANK
- primary_equipment: bodyweight
- movement_type_tag: static_hold / core
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Flavor F (footnote chained, 3-stage time-bound). `* ... [ after each GYMNASTICS round ]` — footnote с round-scope modifier.

### DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses

- canonical_name: DB bench presses [ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Flavor D (sandwich) с composite per-arm annotation repeat.

### DB bench presses [ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses

- canonical_name: DB bench presses [ 15 kg | RIGHT arm DO | LEFT arm HOLD in UP ] + 10 plyo push ups + 5 DB bench presses
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Mirror.

### hang power cleans + 5 front squats + 3 push presses

- canonical_name: hang power cleans + 5 front squats + 3 push presses
- primary_equipment: dumbbell (implied by `[ DB 2x 15 kg ]` standalone)
- movement_type_tag: hinge / squat / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Flavor C (chained 3-element).

### DB hang power clean + DB push press

- canonical_name: DB hang power clean + DB push press
- primary_equipment: dumbbell
- movement_type_tag: hinge / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor B (1-rep composite). Singular `clean` (not `cleans`). Possible merge with composite-named `DB hang power clean & push press` — escalate.

### DB hang power snatches [ 2x 15 kg ] + 5 burpee

- canonical_name: DB hang power snatches [ 2x 15 kg ] + 5 burpee
- primary_equipment: mixed (dumbbell + bodyweight)
- movement_type_tag: hinge / cardio_flow
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor A. Typo `burpee` (singular).

### DB INCLINE bench presses [ 2x 15 kg ] + 5 single ARM bench presses

- canonical_name: DB INCLINE bench presses [ 2x 15 kg ] + 5 single ARM bench presses
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor A.

### DB snatches [ 1x 15 kg ] + 10 strict HSPU

- canonical_name: DB snatches [ 1x 15 kg ] + 10 strict HSPU
- primary_equipment: mixed (dumbbell + bodyweight)
- movement_type_tag: hinge / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor A.

### DB snatches [ 2x 15 kg ] + 10 strict HSPU

- canonical_name: DB snatches [ 2x 15 kg ] + 10 strict HSPU
- primary_equipment: mixed
- movement_type_tag: hinge / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor A.

### DB snatches [ 2x 15 kg ] + 7 strict HSPU

- canonical_name: DB snatches [ 2x 15 kg ] + 7 strict HSPU
- primary_equipment: mixed
- movement_type_tag: hinge / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor A.

### DB squats [ 2x 15 kg ] + 7 V-ups

- canonical_name: DB squats [ 2x 15 kg ] + 7 V-ups
- primary_equipment: mixed (dumbbell + bodyweight)
- movement_type_tag: squat / core
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor A.

### DB bench presses [ 2x 15 kg ] + 10 plyo push ups

- canonical_name: DB bench presses [ 2x 15 kg ] + 10 plyo push ups
- primary_equipment: dumbbell (+ bodyweight)
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor A.

### DB bench presses [ 2x 15 kg ] + 10 plyo push ups + 5 DB bench presses

- canonical_name: DB bench presses [ 2x 15 kg ] + 10 plyo push ups + 5 DB bench presses
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor D (sandwich).

### DB bench presses [ 2x 15 kg ] + 5 plyo push ups

- canonical_name: DB bench presses [ 2x 15 kg ] + 5 plyo push ups
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor A.

### DB deadlifts + 5 hang power cleans + 5 DB squats

- canonical_name: DB deadlifts + 5 hang power cleans + 5 DB squats
- primary_equipment: dumbbell
- movement_type_tag: hinge / squat
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor C (3-element chained).

### hang power cleans + 3 fron squats + 3 push presses

- canonical_name: hang power cleans + 3 fron squats + 3 push presses
- primary_equipment: dumbbell
- movement_type_tag: hinge / squat / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor C. Typo `fron` = front.

### hang power cleans + 3 front squats + 1 push presses

- canonical_name: hang power cleans + 3 front squats + 1 push presses
- primary_equipment: dumbbell
- movement_type_tag: hinge / squat / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor C.

### hang power cleans + 7 front squats + 5 push presses

- canonical_name: hang power cleans + 7 front squats + 5 push presses
- primary_equipment: dumbbell
- movement_type_tag: hinge / squat / press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor C.

### strict DB press + 10 DB push press [ 2x 15 kg ]

- canonical_name: strict DB press + 10 DB push press [ 2x 15 kg ]
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor A.

### strict DB press + 5 DB push press [ 2x 15 kg ]

- canonical_name: strict DB press + 5 DB push press [ 2x 15 kg ]
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 3 ctx. Flavor A. With `[ 2 sec SLOW down ]` tempo modifier.

### strict DB press + 5 KB push press [ 24 kg ] + 5 strict DB press

- canonical_name: strict DB press + 5 KB push press [ 24 kg ] + 5 strict DB press
- primary_equipment: mixed (dumbbell + kettlebell)
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor D (cross-equipment sandwich).

### strict DB press + 6 DB push press + 3 strict DB press [ 2x 15 kg ]

- canonical_name: strict DB press + 6 DB push press + 3 strict DB press [ 2x 15 kg ]
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 2 ctx. Flavor D (sandwich).

### strict DB press + 9 DB push press + 3 strict DB press [ 2x 15 kg ]

- canonical_name: strict DB press + 9 DB push press + 3 strict DB press [ 2x 15 kg ]
- primary_equipment: dumbbell
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor D (sandwich).

### strict HSPU + 7 DB squats

- canonical_name: strict HSPU + 7 DB squats
- primary_equipment: mixed (bodyweight + dumbbell)
- movement_type_tag: press / squat
- default_demo_url: none
- canonical_compound_type: compound_plus
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Flavor A.

---

## §3. Composite-named exercises (`&` connector)

Traditional composite Olympic-lift naming. Atomic в Phase 3.2 per recommendation (Option c в `compound-composite-analysis.md`).

### KB clean & push press

- canonical_name: KB clean & push press
- primary_equipment: kettlebell
- movement_type_tag: combined_olympic
- default_demo_url: none
- canonical_compound_type: composite_named
- placeholder_flag: false
- notes: 5 occ / 3 ctx. Variants `[ N each arm ]` — use-site.

### KB clean & jerk

- canonical_name: KB clean & jerk
- primary_equipment: kettlebell
- movement_type_tag: combined_olympic
- default_demo_url: none
- canonical_compound_type: composite_named
- placeholder_flag: false
- notes: 1 occ / 1 ctx.

### DB hang power clean & push press

- canonical_name: DB hang power clean & push press
- primary_equipment: dumbbell
- movement_type_tag: combined_olympic
- default_demo_url: none
- canonical_compound_type: composite_named
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Borderline merge with `DB hang power clean + DB push press` — escalate.

### hang power clean & push press

- canonical_name: hang power clean & push press
- primary_equipment: dumbbell
- movement_type_tag: combined_olympic
- default_demo_url: none
- canonical_compound_type: composite_named
- placeholder_flag: false
- notes: 1 occ / 1 ctx. DB prefix dropped (implied by `[ 2x 15 kg ]` weight). Possible merge with `DB hang power clean & push press` — escalate.

---

## §4. OR-alternative rows

### strict bar dips OR 10 push ups

- canonical_name: strict bar dips OR 10 push ups
- primary_equipment: bodyweight
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: alternative_or
- placeholder_flag: false
- notes: 1 occ / 3 ctx. Substitution row (Phase 3.1 §5). `5 strict bar dips OR 10 push ups`. Phase 5: first-class OrAlternative.

### strict bar dips OR 20 push ups

- canonical_name: strict bar dips OR 20 push ups
- primary_equipment: bodyweight
- movement_type_tag: press
- default_demo_url: none
- canonical_compound_type: alternative_or
- placeholder_flag: false
- notes: 1 occ / 1 ctx. Substitution row.

---

## §5. Placeholder exercises (separate category)

### \*DB exercise

- canonical_name: \*DB exercise
- primary_equipment: dumbbell (slot)
- movement_type_tag: unknown
- default_demo_url: none
- canonical_compound_type: placeholder
- placeholder_flag: true
- notes: 1 occ / 1 ctx (block-020). Paired annotation `[ *DB exercise: 1st set HANG SQUAT CLEANS | 2nd set HANG POWER CLEANS | 3rd set FRONT SQUATS ]` — 3-set substitution mapping.

### \*Burpee variation

- canonical_name: \*Burpee variation
- primary_equipment: bodyweight (slot)
- movement_type_tag: cardio_flow
- default_demo_url: none
- canonical_compound_type: placeholder
- placeholder_flag: true
- notes: 1 occ / 1 ctx (block-021). Paired annotation `[ 1 set: bar facing burpees | 2 set: burpee + push ups | 3 set: burpee ]`.

---

## §6. Schema-content singletons (not proper exercises, kept for completeness)

### MAX ROUNDS in remaining time: 1-2-3-4-5 etc.

- canonical_name: MAX ROUNDS in remaining time: 1-2-3-4-5 etc.
- primary_equipment: depends on schema (mixed)
- movement_type_tag: unknown
- default_demo_url: none
- canonical_compound_type: atomic (formal, но фактически — schema-content rep-notation row)
- placeholder_flag: false
- notes: 1 occ / 2 ctx (block-140, 141). Phase 3.1 case-three-MAX-subforms: progressive ladder seed + MAX rep notation. NOT proper Exercise — это schema body row. Kept in canonical list for inventory completeness. Phase 5: extract into schema-content primitive (MAX-rounds-progressive seed), not Exercise entry.

---

## §7. Coverage summary

| attribute                   | filled  | unknown / none                                                                          | rate                            |
| --------------------------- | ------- | --------------------------------------------------------------------------------------- | ------------------------------- |
| canonical_name              | 149/149 | 0                                                                                       | 100%                            |
| primary_equipment           | 149/149 | 0 mixed/unknown count: ~15 mixed, ~3 unknown                                            | 100% (all filled, some `mixed`) |
| movement_type_tag (primary) | 142/149 | 7 unknown (placeholders, schema-content singleton, isolation movements что не fit enum) | ~95%                            |
| default_demo_url            | 38/149  | 111 none                                                                                | ~25%                            |
| canonical_compound_type     | 149/149 | 0                                                                                       | 100%                            |
| placeholder_flag            | 149/149 | 0 (2 true + 1 partial compound)                                                         | 100%                            |

---

## §8. Notes on aliases summary

Total ratified merges: 19 aliases recorded (см. `exercise-merge-candidates.md`).

Top alias clusters:

- DB Snatches family: 1 alias (DB snatch).
- incline DB bench presses: 1 alias (DB INCLINE bench presses).
- DB bench presses: 1 alias (bench presses).
- KB single arm row: 1 alias (KB [ 24 kg ] single arm row).
- Single Leg Kettlebell Hip Thrust: 1 alias (Single Leg KB Hip Thrust).
- jumping Jacks: 1 alias (jumping Jack's).
- single unders: 1 alias (single unders AFTER each set).
- DB front squats: 1 alias (MAX DB FRONT SQUATS).
- strict HSPU: 1 alias (MAX strict HSPU in remaining time).
- DB hang power cleans: 1 alias (hang power cleans).
- DB power cleans: 1 alias (power cleans).
- DB power snatches: 1 alias (power snatches).
- DB alt. snatches: 1 alias (alt. DB snatches).
- RUN: 6 aliases (RUN 5 km, RUN 5-6 km, RUN 5-7 km, RUN 7 km, RUN 10 km, km run).
