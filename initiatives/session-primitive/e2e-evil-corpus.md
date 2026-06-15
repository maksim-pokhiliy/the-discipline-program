# session-primitive — e2e evil corpus (the Phase-1 acceptance gate)

**Status: the live Phase-1 Exit gate.** Everything in Phase 1 is BUILT + MERGED (W1–W4-editor #261–#265, the W4E follow-ups #268, the catalog pass #269 — the gated api-server suite ran GREEN). This file is the **last gate before `/initiative-close`**: the owner (Maksim, wearing the coach hat) hand-builds the workouts below in the constructor and confirms **zero model gap**.

## The acceptance question

> Can the coach express every workout here — the maximally-evil CrossFit shapes Denys actually writes — in the constructor and read it back unambiguously, with **no model gap**, while `primitive-spec.md` stays frozen?

A **PASS** means: every ✅/📝 line below builds as described; every 📝 lands as the ratified note (NOT a missing feature); the ⚠️ verify-points are checked live and are tolerable; **zero ❌**. A single ❌ on a structural/typed line = the freeze is **not** done — that's a real model hole to re-open the spec for.

## Why this is the SOLE proof now (read this)

The synthetic training seed + the machine-checked `seed-coverage.test.ts` expressibility gate were **torn out** in the catalog pass (D-SEED-TEARDOWN; `deferred.md` → SEED-COVERAGE-LOST). Before, a test asserted the model could express the corpus. **Now this hand-built e2e is the only thing standing in for that proof.** So it has to be genuinely evil — not a rubber-stamp. The 3 sessions below are designed to collectively prime **every load-bearing cell of the frozen grid** (see the coverage map) plus the deliberate-loss boundaries the freeze rides on.

---

## How to run

1. `pnpm db:reset && pnpm db:seed` — the DB comes up **users + profiles only** (the catalog/plans are NOT seeded anymore — D-SEED-TEARDOWN). Use the dev Neon URL (no `-pooler`; [[neon-dev-direct-url]]).
2. **Build the catalog by hand** in the **admin** console (`:3002`) — Equipment, then Exercises (with nature + equipment refs), per **§ Catalog prerequisites**. This also exercises the catalog-pass admin console itself (bonus acceptance for #269).
3. Log in as a **coach** on **platform** (`:3001`) and build each session top-to-bottom in the plan editor. Modifiers are coach-owned — create them on the fly from the row modifier picker as you hit them (that's the D-MODIFIER searchable create path, also under test).
4. For each prescription line, mark the verdict against the column here. **A 📝 on a D-EXEC-DEFER / BACKLOG line is a PASS, not a gap** — that semantics is deferred to a Phase-3/4 engine by ratified decision; the e2e only confirms the coach can still _write it down_ (as a note/label) without losing the workout.
5. Walk **§ Boundary probes** consciously at the end — those ~7 are the actual freeze decisions. The point of an evil e2e isn't "does the happy path build" — it's "are the deliberate losses tolerable in real programming."

### Verdict legend

|     | Meaning                                                                                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ✅  | Expressible — typed field or structure; builds cleanly, round-trips.                                                                                              |
| 📝  | **Note / label by design** — execution/scoring/rounds semantics deferred (D-EXEC-DEFER / BACKLOG-ROUNDS); the coach writes it as human text. **PASS**, not a gap. |
| ⚠️  | **Verify live** — a suspected papercut; confirm the editor actually handles it. Not yet a gap — a question.                                                       |
| ❌  | **Gap** — a real model failure. None expected. If one appears, the freeze is not met.                                                                             |

---

## Live e2e findings — model gaps (→ Phase-2 `/feature`, NOT inline)

The hand-build surfaced **two real ❌ model gaps**, both repetition-axis contract reshapes (contract + api-server mappers + editor + reseed + gated suite). Owner-directed disposition: **scope-piled for one Phase-2 `/feature`, not fixed inline** ("кидать в кучу для отдельного прогона через feature"). Promote both into `deferred.md` at close-out.

- **GAP-1 — time cap is not orthogonal to the repetition kind (S1-C / probe P-1).** A schema is `ladder` **XOR** `timeCap` (discriminated union). "21-15-9 FOR TIME, 12 min cap" is a **ladder that ALSO has a cap** — unexpressible as a typed field; the cap can currently only be a note. The owner **rejects cap-as-note** here: a time cap must be an **optional setting on every repetition kind**. → make `cap` a separate optional axis on the composition, orthogonal to `repetition.kind`. (Flips P-1 from a tolerable conscious-loss to a re-open.)
- **GAP-2 — the interval axis is integer-minutes; Tabata (sub-minute) is unbuildable (S1-D).** `workMin`/`offMin` are `z.number().int()` (field min 1). Tabata `8 × :20 on / :10 off` is seconds — "нельзя писать числа меньше 1." → reshape interval work/off to a duration with a unit (sec/min), or seconds.

Phase-1 acceptance is therefore **not** a clean pass on the structural lines until these are dispositioned; per the owner they ride a Phase-2 `/feature`, so the freeze/close proceeds with both as known carry-forwards.

---

## Catalog prerequisites (build in admin FIRST — the seed no longer provides these)

### Equipment (14)

`Echo Bike` · `Pull-up Bar` · `Barbell` · `Squat Rack` · `Dumbbell` · `Bench` · `Wall` · `Box` · `Kettlebell` · `Dip Station` · `Rower` · `Resistance Band` · `Medicine Ball` · `GHD`

### Exercises (name · **nature** · equipment refs)

The three non-concrete natures are the catalog-pass payload — build at least the one PLACEHOLDER and one REST record so the e2e exercises nature inference (D-CATALOG-NATURE).

| #   | Exercise                 | Nature          | Equipment               | Note                                                             |
| --- | ------------------------ | --------------- | ----------------------- | ---------------------------------------------------------------- |
| 1   | Echo Bike                | concrete        | Echo Bike               |                                                                  |
| 2   | Inchworm                 | concrete        | —                       | bodyweight                                                       |
| 3   | Scap Pull-up             | concrete        | Pull-up Bar             |                                                                  |
| 4   | Wall Squat Hold          | concrete        | Wall                    |                                                                  |
| 5   | Back Squat               | concrete        | **Barbell, Squat Rack** | multi-equipment ref                                              |
| 6   | Bulgarian Split Squat    | concrete        | **Dumbbell, Bench**     | multi-equipment ref                                              |
| 7   | Thruster                 | concrete        | Barbell                 |                                                                  |
| 8   | Pull-up                  | concrete        | Pull-up Bar             |                                                                  |
| 9   | Hollow Rock              | concrete        | —                       |                                                                  |
| 10  | Snatch                   | concrete        | Barbell                 |                                                                  |
| 11  | Wall Walk                | concrete        | Wall                    |                                                                  |
| 12  | Strict Handstand Push-up | concrete        | Wall                    |                                                                  |
| 13  | **Rest**                 | **rest**        | —                       | first-class rest record (D-CATALOG-NATURE; the EMOM rest minute) |
| 14  | DB Box Step-over         | concrete        | **Dumbbell, Box**       | multi-equipment ref                                              |
| 15  | Kettlebell Swing         | concrete        | Kettlebell              |                                                                  |
| 16  | Dumbbell Snatch          | concrete        | Dumbbell                |                                                                  |
| 17  | Strict Bar Dip           | concrete        | Dip Station             |                                                                  |
| 18  | Push-up                  | concrete        | —                       |                                                                  |
| 19  | **ANY abs exercise**     | **placeholder** | —                       | placeholder nature; render-kind inferred (D-ROW-GRAMMAR)         |
| 20  | Calorie Row              | concrete        | Rower                   |                                                                  |
| 21  | Plank Hold               | concrete        | —                       |                                                                  |
| 22  | DB Bench Press           | concrete        | **Dumbbell, Bench**     | multi-equipment ref                                              |
| 23  | Single-arm DB Row        | concrete        | **Dumbbell, Bench**     | multi-equipment ref                                              |
| 24  | Band Pull-apart          | concrete        | Resistance Band         |                                                                  |
| 25  | Clean                    | concrete        | Barbell                 |                                                                  |
| 26  | Front Squat              | concrete        | Barbell                 |                                                                  |
| 27  | Push Jerk                | concrete        | Barbell                 |                                                                  |
| 28  | Push Press               | concrete        | Barbell                 |                                                                  |
| 29  | Chest-to-Bar Pull-up     | concrete        | Pull-up Bar             |                                                                  |
| 30  | Wall Ball                | concrete        | **Medicine Ball, Wall** | multi-equipment ref                                              |
| 31  | Run                      | concrete        | —                       | distance                                                         |
| 32  | GHD Sit-up               | concrete        | GHD                     |                                                                  |
| 33  | Hanging Knee Raise       | concrete        | Pull-up Bar             |                                                                  |
| 34  | V-up                     | concrete        | —                       |                                                                  |

### Modifiers (the how-to-execute dictionary — D-MODIFIER; create on the fly)

`from the rack` · `kipping allowed` · `touch-and-go` · `from the floor` · `alternating` · `explosive`

> `explosive` is intentionally a **modifier** while S2's bench tempo "slow eccentric" is intentionally a **free-string tempo** — the two homes of verbal execution-language under the tempo smart-union (D-TEMPO-SMART) + D-MODIFIER. Build both to confirm the boundary.

---

## Coverage map — every frozen-spec cell × session (the exhaustiveness proof)

If a row has no session, the freeze is under-tested. Every load-bearing cell is hit at least once.

| Frozen-spec cell                                         | S1  |   S2    |      S3       | Carrier                                             |
| -------------------------------------------------------- | :-: | :-----: | :-----------: | --------------------------------------------------- | --- | ---- |
| **repetition: once**                                     |  ●  |    ●    |               | build-to-1RM (Back Squat / Snatch)                  |
| **repetition: count**                                    |  ●  |    ●    |       ●       | N sets / N rounds                                   |
| **repetition: ladder**                                   |  ●  |         |       ●       | 21-15-9 ; parallel 12-9-6 ‖ 6-9-12                  |
| **repetition: timeCap**                                  |     |    ●    |               | AMRAP 15 ; PRACTICE [5–10] (block→schema, D-FLOORS) |
| **repetition: cadence**                                  |     |    ●    |               | EMOM 12                                             |
| **repetition: interval**                                 |  ●  |         |               | Tabata 8 × :20/:10                                  |
| **load: absolute {count:1}**                             |  ●  |    ●    |               | 1× DB                                               |
| **load: absolute {count:2}**                             |  ●  |         |               | 2× DB                                               |
| **load: percentage {self}**                              |  ●  |         |               | Back Squat @ 75%                                    |
| **load: percentage {other-exercise}**                    |     |         |       ●       | Push Press @ 60% of Jerk                            |
| **load: bodyweight**                                     |  ●  |    ●    |       ●       | many                                                |
| **load: byProfile m/f**                                  |  ●  |         |               | Fran thrusters ♂/♀                                |
| **load: byProfile RX/SC**                                |     |         |       ●       | Wall Ball RX♂/RX♀/SC♂/SC♀ (4 entries)           |
| **side: each_limb**                                      |  ●  |         |               | BSS each leg                                        |
| **side: left / right (asymmetric pair)**                 |     |    ●    |               | Single-arm DB Row 10 L / 8 R                        |
| **side: per-limb count**                                 |     |    ●    |               | the same row (10 vs 8) — ⚠️ verify                  |
| **tempo: 4-digit (with X)**                              |  ●  |         |               | 3-1-X-0                                             |
| **tempo: free string (smart-union)**                     |     |    ●    |               | bench "slow eccentric"                              |
| **modifier: single ref**                                 |  ●  |         |               | "from the rack"                                     |
| **modifier: multi-ref (2+ at once)**                     |     |         |       ●       | "touch-and-go" + "from the floor"                   |
| **modifier vs free-tempo boundary**                      |     |    ●    |               | "explosive" (modifier) vs "slow eccentric" (tempo)  |
| **reps: count**                                          |  ●  |    ●    |       ●       | everywhere                                          |
| **reps: range**                                          |     |    ●    |               | Bench 8–12                                          |
| **reps: unit sec / min**                                 |  ●  |    ●    |               | :30 hold ; Row 2:00                                 |
| **reps: unit km / distance**                             |     |         |       ●       | Run 800m — ⚠️ verify (unit is km)                   |
| **reps: max**                                            |     |    ●    |               | EMOM "MAX strict HSPU"                              |
| **reps: implicit (NULL, render-inherited)**              |  ●  |         |       ●       | ladder rows                                         |
| **notes stack on block**                                 |  ●  |         |               | "smooth, no rest"                                   |
| **notes stack on schema**                                |     |    ●    |       ●       |                                                     |
| **notes stack on row**                                   |     |    ●    |               | "before BAR DIPS complex"-style                     |
| **multiple notes on ONE node**                           |     |         |       ●       | metcon schema (2 notes)                             |
| **notes on schema-group / row-group (the label)**        |     |    ●    |       ●       | "OR" ; "5 rounds:"                                  |
| **nature: concrete**                                     |  ●  |    ●    |       ●       | everywhere                                          |
| **nature: placeholder**                                  |     |    ●    |               | "ANY abs exercise"                                  |
| **nature: rest**                                         |     |    ●    |               | EMOM rest minute (Rest record)                      |
| **equipment: single ref**                                |  ●  |    ●    |       ●       | everywhere                                          |
| **equipment: multi-ref on one exercise**                 |  ●  |    ●    |       ●       | Back Squat, Bench, Wall Ball …                      |
| **row-group: compound (A+B+C)**                          |  ●  |         |       ●       | Inchworm+Scap ; Clean+FS+Jerk                       |
| **row-group: OR (substitution)**                         |     |    ●    |               | Bar Dips OR Push-ups                                |
| **row-group: per-set substitution**                      |     |         |       ●       | core [rd1                                           | rd2 | rd3] |
| **row-group: split-tier (own loads)**                    |     |    ●    |               | [5 KB24 + 10 DB15]                                  |
| **schema-group: parallel ladders**                       |     |         |       ●       | 12-9-6 ‖ 6-9-12                                     |
| **schema-group: interleave / alternating display**       |     |         |       ●       | partner-alternating                                 |
| **block floor: intensity → schema (D-FLOORS)**           |     |         |       ●       | "Metcon @ 85%" → schema intensity                   |
| **block floor: timeCap → schema (D-FLOORS)**             |     |    ●    |               | PRACTICE [5–10] → schema timeCap                    |
| **intensity: effort% / rpe / pace / hr_zone**            | rpe | hr_zone | effort%, pace | spread                                              |
| **D-EXEC-DEFER: "for time" + cap-on-ladder → note**      |  ●  |         |               |                                                     |
| **D-EXEC-DEFER: "not for score" / "90%+ effort" → note** |     |    ●    |               |                                                     |
| **D-EXEC-DEFER: "straight into / no rest" → note**       |     |         |       ●       |                                                     |
| **BACKLOG-ROUNDS: "N rounds over the group" → label**    |     |         |       ●       | "5 rounds:"                                         |
| **BACKLOG-TAIL: finisher schema after a Group**          |     |         |       ●       | the 800m Run sibling                                |
| **multi-rest per schema (2nd → note)**                   |     |         |       ●       | rest between rounds AND between ladders             |
| **footnote role 2–4 = de-specialized plain row**         |     |    ●    |               | "+ accumulate 100 band pull-aparts"                 |
| **schema header field stays**                            |  ●  |         |               | "BSS Drop Complex"                                  |
| **stage-as-rows drop-set + EXPLODE text + media**        |  ●  |         |               | BSS complex                                         |

---

## Session 1 — "Heavy & Nasty"

Max-load barbell day: a 1RM build, %1RM tempo work, a Bulgarian drop-complex, Fran-with-a-cap, a Tabata finisher.

```
A) WARM-UP — 2 rounds, smooth, no rest:
     10 cal Echo Bike
     5 Inchworm + 5 Scap Pull-ups
     :30 Wall Squat Hold  (heels down)

B) BACK SQUAT
     build to a heavy single (1RM)
     then 5×5 @ 75%  ·  tempo 3-1-X-0  ·  rest 2–3 min  ·  RPE 8  (from the rack)

   BSS DROP COMPLEX — "BSS Drop Complex" — 3 sets, each leg:
     5 @ 2× DB 22.5kg
     5 @ 1× DB 22.5kg
     5 bodyweight — EXPLODE (jump)   [video]

C) METCON — 21-15-9, FOR TIME (12 min cap):
     Thrusters   ♂ 43kg / ♀ 30kg
     Pull-ups    (kipping allowed)

D) FINISHER — Tabata, 8 × :20 on / :10 off:
     Hollow Rocks
```

| Prescription                               | Build as                                                                                                                                          | Cells                                              |  V  |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | :-: |
| Warm-up "2 rounds, smooth, no rest"        | Block(label warm-up) + a block note; Schema `repetition.count = 2`, `rest = none`                                                                 | count, block note, rest none                       | ✅  |
| 10 cal Echo Bike                           | Row: ex Echo Bike, `reps.unit = 10 cal`†                                                                                                          | equipment, reps unit                               | ✅  |
| 5 Inchworm + 5 Scap Pull-ups               | **Row-group** (compound) of 2 rows, each own reps + bodyweight                                                                                    | compound row-group                                 | ✅  |
| :30 Wall Squat Hold                        | Row: `reps.unit = 30 sec`, bodyweight; row note "heels down"                                                                                      | reps sec, bodyweight, row note                     | ✅  |
| Build to a heavy single                    | Schema `repetition.once`; Back Squat row                                                                                                          | **once**                                           | ✅  |
| 5×5 @ 75%, tempo 3-1-X-0, RPE 8, from rack | Schema `repetition.count=5`; Row: `sets=5`, `reps=5`, `load.percentage{75, self}`, `tempo = 3-1-X-0`, `intensity.rpe=8`, modifier `from the rack` | sets, %self, 4-digit tempo+X, rpe, single modifier | ✅  |
| rest 2–3 min                               | schema `rest {range 2–3 min, between sets}`                                                                                                       | rest range × between-sets                          | ✅  |
| BSS, 3 sets each leg, stages               | Schema `repetition.count=3`, **header** "BSS Drop Complex", `side.each_limb`; **3 stage rows**                                                    | count, header, each_limb, stages-as-rows           | ✅  |
| 5 @ 2× DB 22.5kg                           | stage Row: `reps=5`, `load.absolute{count:2, 22.5}`                                                                                               | absolute count:2                                   | ✅  |
| 5 @ 1× DB 22.5kg                           | stage Row: `load.absolute{count:1, 22.5}`                                                                                                         | absolute count:1                                   | ✅  |
| 5 bw — EXPLODE [video]                     | stage Row: bodyweight, note "EXPLODE (jump)", `media{url}`                                                                                        | bodyweight, note, media                            | ✅  |
| 21-15-9                                    | Schema `repetition.ladder [21,15,9]`                                                                                                              | ladder                                             | ✅  |
| (rows under the ladder)                    | rows with `reps = NULL` (inherited from ladder)                                                                                                   | reps implicit                                      | ✅  |
| Thrusters ♂43/♀30                        | Row: `load.byProfile [{♂,43},{♀,30}]`                                                                                                           | byProfile m/f                                      | ✅  |
| Pull-ups (kipping)                         | Row: modifier `kipping allowed`                                                                                                                   | modifier                                           | ✅  |
| **"FOR TIME (12 min cap)"**                | ladder typed; cap **rejected as a note** — owner wants a typed time-cap on any kind (**GAP-1** → /feature)                                        | D-EXEC-DEFER → re-open                             | ❌  |
| Tabata 8 × :20/:10                         | interval is integer-MINUTES — :20/:10 **sec unbuildable**, "нельзя писать <1" (**GAP-2** → /feature)                                              | **interval**                                       | ❌  |

† Echo Bike "10 cal" — calories aren't in the reps unit set (`sec|min|km`); see ⚠️ **Probe P-6**. Build as count `10` + note "cal", or whatever the editor offers.

**Boundary in this session:** the cap-on-a-ladder (P-1). Fran's prescription is a fixed ladder _for time_; the 12-min cap is a safety cutoff, not the rep scheme. The model carries the ladder typed and "for time / 12 min cap" as notes (D-EXEC-DEFER — no timer engine until Phase 4). Confirm that's how you'd actually want to read it back.

---

## Session 2 — "The Grinder"

Skill practice (a block timeCap that belongs on the schema), an EMOM with a MAX slot and a rest minute, a long AMRAP chipper carrying OR / placeholder / split-tier, an unscored accessory finisher.

```
A) SKILL — PRACTICE [5–10 min]:
     Snatch — build to a technical 1RM

B) EMOM 12 (every minute, cycle ×4):
     min 1 — 3 Wall Walks
     min 2 — MAX strict Handstand Push-ups
     min 3 — REST

C) CHIPPER — AMRAP 15  ·  score = rounds+reps, last 3 min @ 90%+ effort:
     12 DB Box Step-overs  (1× DB 22.5kg)
     [ 5 KB Swing 24kg  +  10 DB Snatch 15kg ]   ← one trip, alternating
     5 strict Bar Dips  OR  10 Push-ups
     15 ANY abs exercise
     Row 2:00 @ Zone 2

D) ACCESSORY — 3 sets, NOT FOR SCORE:
     8–12 DB Bench Press   ·  tempo: slow eccentric, explosive up
     Single-arm DB Row — 10 L / 8 R
     :45 Plank
   + accumulate 100 Band Pull-aparts across the 3 sets
```

| Prescription                                 | Build as                                                                                                                                               | Cells                                          |   V    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | :----: |
| **PRACTICE [5–10 min]**                      | NOT a block timeCap — a Schema `repetition.timeCap = 5–10 min` (D-FLOORS: a block is a named part, not a load carrier)                                 | timeCap, block-floor→schema                    |   ✅   |
| Snatch — build to 1RM                        | Schema `repetition.once`                                                                                                                               | once                                           |   ✅   |
| EMOM 12                                      | Schema `repetition.cadence` (every 1 min, 12 rounds)                                                                                                   | **cadence**                                    |   ✅   |
| min-1 / min-2 / min-3 slots                  | three top-level rows under the cadence schema                                                                                                          | cadence slot rows                              |   ✅   |
| MAX strict HSPU                              | Row: `reps.max`, bodyweight (Wall)                                                                                                                     | reps max                                       |   ✅   |
| REST minute                                  | Row: ex **Rest** (rest nature) — "отдых тоже задание" (D-ROW-GRAMMAR)                                                                                  | nature rest                                    |   ✅   |
| AMRAP 15                                     | Schema `repetition.timeCap = 15 min`                                                                                                                   | timeCap                                        |   ✅   |
| **"score = rounds+reps, last 3 min @ 90%+"** | → schema notes (no scoring engine — D-EXEC-DEFER)                                                                                                      | D-EXEC-DEFER                                   |   📝   |
| 12 DB Box Step-over (1× DB)                  | Row: `reps=12`, `load.absolute{count:1, 22.5}`; ex has **DB+Box** equip                                                                                | absolute count:1, multi-equip                  |   ✅   |
| [5 KB24 + 10 DB15] one trip                  | **Row-group (split-tier)** of 2 rows, each own reps+load (`split_tier` weight dies → structure, D-LOAD-FINAL); modifier `alternating` on the DB snatch | split-tier row-group                           |   ✅   |
| 5 Bar Dips OR 10 Push-ups                    | **Row-group** of 2 rows, first note = "OR" (§8 case 4, D-PLAQUE)                                                                                       | OR row-group                                   |   ✅   |
| 15 ANY abs exercise                          | Row: ex **ANY abs exercise** (placeholder nature → render-kind inferred)                                                                               | nature placeholder                             |   ✅   |
| Row 2:00 @ Zone 2                            | Row: `reps.unit = 2 min`; schema `intensity.hr_zone = Z2`                                                                                              | reps min, hr_zone                              |   ✅   |
| Accessory "3 sets, NOT FOR SCORE"            | Schema `repetition.count=3`; "not for score" → note                                                                                                    | count, D-EXEC-DEFER                            |   📝   |
| 8–12 DB Bench Press, "slow eccentric…"       | Row: `reps.range 8–12`; **tempo = free string** "slow eccentric, explosive up" (smart union, D-TEMPO-SMART); ex DB+Bench                               | reps range, **free-string tempo**, multi-equip |   ✅   |
| Single-arm DB Row 10 L / 8 R                 | one Row with `side` carrying **left 10 / right 8** (asymmetric + per-limb count)                                                                       | side L/R, per-limb count                       | ⚠️ P-2 |
| :45 Plank                                    | Row: `reps.unit = 45 sec`                                                                                                                              | reps sec                                       |   ✅   |
| + accumulate 100 Band Pull-aparts            | a **plain exercise row** added to the schema (footnote role 2–4 = de-specialized row, natural order — W2-FOOTNOTE-LAST: "это НЕ уникальная строка")    | de-specialized footnote                        |   ✅   |

**Boundary in this session:** the per-limb asymmetric count (P-2) and the calorie/distance unit gap (P-6). Both are ⚠️, not assumed gaps — check what the side editor and the reps-unit selector actually offer.

---

## Session 3 — "Parallel Hell"

The schema-group monster: a barbell complex, percentage-of-another-lift, two parallel ladders run as alternating partner rounds, a per-set-substituted core, a run finisher after the group, and a schema that needs two rests.

```
A) STRENGTH
     Clean Complex — 5 sets:
       1 Clean + 2 Front Squats + 1 Push Jerk   (touch-and-go, from the floor)
     then — Push Press  4×6 @ 60% of your Jerk

B) METCON — "5 rounds:", you & partner ALTERNATE full rounds  ·  @ 85% effort:

       Track 1 — ladder 12-9-6:        Track 2 — ladder 6-9-12:
         Chest-to-Bar Pull-ups           Wall Ball  (RX ♂9/♀6 · SC ♂6/♀4)

     — straight into —
     800m Run together  @ 5k pace

     Core (each round a different movement):
       [ rd1: GHD Sit-ups | rd2: Hanging Knee Raises | rd3: V-ups ]

     Rest 2 min between rounds AND :20 between the two ladders.
     Notes: "scale C2B to ring rows if needed" · "partner holds at the top of the ladder"
```

| Prescription                                          | Build as                                                                                                                                                                           | Cells                                         |                                                    V                                                    |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | :-----------------------------------------------------------------------------------------------------: | ----------------- | --- |
| Clean Complex 5 sets                                  | Schema `repetition.count=5`; **Row-group (compound)** of 3 rows: Clean `reps=1`, Front Squat `reps=2`, Push Jerk `reps=1`; modifiers `touch-and-go` + `from the floor` (multi-ref) | count, compound row-group, multi-ref modifier |                                                   ✅                                                    |
| Push Press 4×6 @ 60% of Jerk                          | Schema `count=4` (or sets=4); Row `reps=6`, `load.percentage{60, other: Push Jerk}`                                                                                                | **percentage other-exercise**                 |                                                   ✅                                                    |
| "5 rounds:" over the parallel                         | **Schema-group** of the 2 ladder schemas; "5 rounds:" = the group label/note (BACKLOG-ROUNDS — rounds typed only against a future engine)                                          | schema-group, **rounds→label**                |                                                   📝                                                    |
| you & partner ALTERNATE                               | the group's interleave/alternating display setting                                                                                                                                 | interleave display                            |                                                   ✅                                                    |
| Track 1: ladder 12-9-6, C2B                           | member Schema `repetition.ladder [12,9,6]`; C2B row, `reps=NULL`                                                                                                                   | ladder, reps implicit                         |                                                   ✅                                                    |
| Track 2: ladder 6-9-12, Wall Ball                     | member Schema `repetition.ladder [6,9,12]`; Wall Ball `load.byProfile [RX♂9, RX♀6, SC♂6, SC♀4]`                                                                                | parallel ladders, byProfile RX/SC             |                                                   ✅                                                    |
| "@ 85% effort"                                        | the metcon schema(s) `intensity.effort = 85%` — on the schema, NOT the block (D-FLOORS)                                                                                            | effort%, block-floor→schema                   |                                                   ✅                                                    |
| **"straight into"**                                   | schema order says "then"; "without pause" → note (D-EXEC-DEFER — no transition engine)                                                                                             | D-EXEC-DEFER                                  |                                                   📝                                                    |
| 800m Run @ 5k pace                                    | a **sibling schema after the group** (BACKLOG-TAIL — natively a following schema); Row `reps.unit = 0.8 km`; `intensity.pace = 5k`                                                 | **tail schema**, reps distance, pace          |                                                 ⚠️ P-6                                                  |
| Core [rd1                                             | rd2                                                                                                                                                                                | rd3]                                          | **Row-group (per-set substitution)**: 3 rows, no typed per-set mapping (§8 case 9, "уникальности ноль") | per-set row-group | ✅  |
| Rest 2 min between rounds **AND** :20 between ladders | ONE typed rest on the schema (`fixed 2 min, between rounds`); the **second rest → a note** (multi-rest rejected for now — F-PLAQUE/D-PLAQUE)                                       | **multi-rest → note**                         |                                                 📝 P-3                                                  |
| two notes ("scale C2B…", "partner holds…")            | **multiple ordered notes** on the one schema/group                                                                                                                                 | notes stack (2 on one node)                   |                                                   ✅                                                    |

**Boundary in this session:** the densest. P-3 (multi-rest), P-4 (rounds-over-group as label), P-5 (BACKLOG-TAIL / BACKLOG-PATTERNS confirm), P-7 ("straight into"). This session alone closes three OPEN `deferred.md` rows (BACKLOG-ROUNDS exercised, BACKLOG-TAIL + BACKLOG-PATTERNS confirmed).

---

## Boundary probes — the conscious-loss decisions the freeze rides on

These are **not** bugs to fix in this gate — they're the §7 "what we consciously lose" calls, made concrete. The e2e's real job is your **eyes-open sign-off** that each is tolerable for the freeze. If any one is _not_ tolerable, that's a spec re-open, not a build fix.

| #       | Probe                                                            | Expected behavior                                          | Ratified basis                                          |                     Tolerable?                     |
| ------- | ---------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------- | :------------------------------------------------: | ------------------ | --- |
| **P-1** | Cap on a fixed ladder ("21-15-9, 12 min cap, for time")          | ladder typed; cap + "for time" = notes                     | D-EXEC-DEFER; §8 case 10                                |                         ☐                          |
| **P-2** | Asymmetric per-limb count (10 L / 8 R on one row)                | `side` carries left/right + per-limb count                 | spec Grid B `side`                                      |                         ☐                          |
| **P-3** | A schema needing two rests (between rounds AND between ladders)  | one typed rest; the 2nd → a note                           | D-PLAQUE (ONE rest/schema; multi-rest rejected for now) |                         ☐                          |
| **P-4** | "N rounds over a parallel group"                                 | the round count lives as the group label/note              | BACKLOG-ROUNDS (OPEN)                                   |                         ☐                          |
| **P-5** | A finisher after a parallel group; non-ladder members in a group | a sibling schema after the group; a group is kind-agnostic | BACKLOG-TAIL + BACKLOG-PATTERNS ("confirm at freeze")   |                         ☐                          |
| **P-6** | Distance/calorie reps (800m run, 500m row, 10 cal)               | the reps unit set is `sec                                  | min                                                     | km` — do meters/calories fit, or render awkwardly? | spec Grid B `reps` | ☐   |
| **P-7** | "straight into / no rest" transition between schemas             | order says "then"; "without pause" → note                  | D-EXEC-DEFER (the owner flagged this gap explicitly)    |                         ☐                          |

**P-6 is the one most likely to be a real papercut** (not just a deferred-semantics note): if the editor can only enter `km` and a coach writes everything in meters, that's friction in the daily path, not an engine-deferral. Worth a hard look — it may warrant a small follow-up even if it doesn't re-open the freeze.

---

## What PASS / FAIL looks like

- **PASS** → every ✅ built and round-tripped; every 📝 landed as the note/label described; P-1…P-7 signed off tolerable (P-6 maybe with a noted follow-up); zero ❌. → `primitive-spec.md` stays frozen → **`/initiative-close`** → Phase 2.
- **FAIL** → any ❌ (a shape with no model home), or a boundary probe you decide is **not** tolerable. → capture it in `deferred.md`, re-open the relevant spec grid row, fix forward. The freeze waits.

## After this gate

`/initiative-close` (promote residue, close the board) → **Phase 2 — Coach station complete** (clone week/day/block + saved compositions, coach profile UI, the authoring polish surfaced here, DnD group-creation). The authoring papercuts this e2e surfaces (e.g. P-6, the OPEN `deferred` cleanups QA-007 / QA-D-03) feed Phase 2's polish backlog.

---

_Sources: `primitive-spec.md` (FROZEN) Grid A/B/C + §6–8 · `w4e-live-test-followups.md` (A–E + row-summary render) · `deferred.md` (BACKLOG-ROUNDS/TAIL/PATTERNS, multi-rest, W2-FOOTNOTE-LAST) · `decisions.md` D-EXEC-DEFER / D-FLOORS / D-LOAD-FINAL / D-TEMPO-SMART / D-MODIFIER / D-CATALOG-NATURE / D-ROW-GRAMMAR. The dead synthetic corpus (`7f979986^:…/plan-synthetic/`) was consulted for authentic shapes but deliberately not resurrected — these are fresh sessions._
