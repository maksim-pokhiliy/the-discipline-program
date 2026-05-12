# Exercise attributes (Phase 3.2)

Каталог типов атрибутов Exercise. **Intrinsic** = присущие exercise как сущности (стабильны across occurrences). **Use-site** = контекстные при каждом использовании (меняются от row к row).

Discrimination critereon: stability across occurrences AND semantic role. Intrinsic — что определяет «это упражнение»; use-site — как именно оно сегодня делается.

Caveats:

- Каталог не проектирует модель. Phase 5 решает, как организовать поля и сущности.
- Movement type tags — best-effort описательные, не финальная taxonomy.
- Muscle group decomposition не делается в Phase 3.2 (откладывается до Phase 5+, если потребуется).

---

## Intrinsic attributes

### canonical_name

description: нормализованная форма имени упражнения. Phase 1 уже сделала case-insensitive дедуп; Phase 3.2 предлагает дополнительные merges (см. `exercise-merge-candidates.md`).

source: `01-inventory/exercise-instances.md` headings + Phase 3.2 merge ratifications.

stability rule: имя стабильно по определению — это identity of the exercise.

### primary_equipment

description: основной снаряд / инструмент, необходимый для выполнения упражнения.

enum:

- `bodyweight` — без снарядов (strict pull-ups, burpees, HSPU базовый).
- `dumbbell` — DB-prefix или контекстно DB (`DB Snatches`, `DB thrusters`).
- `kettlebell` — KB-prefix (`KB clean & push press`).
- `barbell` — BB-prefix или контекстная BB (`overhead squats [ 50/30 kg ]` — implied BB).
- `band` — Banded prefix / "with band" suffix (`seated lateral BANDED raises`, `Hip ABduction with band`, `rear delt with BANDED`).
- `parallel_bars` — `bar dips` / `strict bar dips` / `traverses` — требует parallel-bars infrastructure.
- `rings` — `strict ring pull-ups`.
- `box` / `sofa` / `box_or_sofa` — для HSPU вариантов где equipment стабилен (если все occurrences имеют один position, считаем intrinsic; иначе use-site).
- `mixed` — exercise встречается с разными equipment в разных contexts (single arm row split-tier KB+DB; KB + DB Horn Grip variants).
- `unknown` — не выводится надёжно из имени и контекста.

source: prefix имени (DB / KB / Banded), suffix "with band", контекстное наблюдение по всем occurrences.

stability rule: equipment intrinsic если для exercise все occurrences используют тот же снаряд. Если equipment варьируется per occurrence (через `[ ]` modifier как `[ from sofa ]` vs `[ from box/sofa ]`) — это use-site position modifier, primary_equipment остаётся `bodyweight`.

decision boundary с use-site equipment:

- KB single arm row (1 KB occurrence) vs DB single arm row (DB) — это **разные exercises**, не один с use-site modifier. Equipment intrinsic.
- strict HSPU `[ from sofa ]` vs strict HSPU `[ from box/sofa ]` — same exercise, position is use-site modifier. Equipment intrinsic = `bodyweight`.

### movement_type_tag

description: best-effort тег движения. Не финальная taxonomy. Полезен для группировок Phase 5.

enum (один primary, опционально secondary):

- `squat` — squat-pattern (DB squats, air squats, overhead squats, KB Goblet squats).
- `hinge` — hip-hinge (deadlifts, KB swings, snatches, hang power cleans, DB seated good morning, glute bridge).
- `press` — vertical push (DB bench presses, strict HSPU, strict DB press, push presses, thrusters).
- `pull` — pulling (pull-ups, rows, KB high pull, pull overs).
- `lunge` — lunge-pattern (DB lunges, Bulgarian split squats, OH DB lunges).
- `carry` — loaded carry (DB farmer carry lunges — carry+lunge).
- `locomotion` — running, HS walks, walking pieces (RUN, Handstand Plate Walk, Lateral HS walk).
- `static_hold` — static positions (PLANK rows, hold patterns).
- `rotational` — rotational core (turn back 180\* inside compound).
- `cardio_flow` — multi-joint cyclical (burpees, jumping Jacks).
- `core` — abs-focused (V-ups, T2B, side PLANK).
- `combined_olympic` — composite Olympic lifts (clean & push press, clean & jerk, thrusters when treated atomic).
- `raise` — isolation raises (front raise, lateral raise, rear delt).
- `extension` — isolation extension (leg extension, hamstring curl).
- `unknown` — нельзя определить надёжно.

source: имя exercise + best-effort биомеханическая категоризация.

stability rule: тэг — свойство движения, не контекста. Intrinsic.

caveat: для compound rows (`A + B`) primary tag = tag первого элемента, secondary = tag второго. Для composite-named (`clean & push press`) primary = `combined_olympic`.

### default_demo_url

description: youtube/youtu.be ссылка на демо упражнения, если она стабильно присутствует across occurrences.

determination rule:

- intrinsic если same URL appears в **≥80%** occurrences где URL вообще присутствует, AND no conflicting URL для same exercise.
- если URL встречается только в одном positional variant (`[ from box/sofa ]` имеет URL, `[ from sofa ]` без URL) — variant-specific intrinsic (хранится с qualifier) или omit и считать use-site.
- если 0/N occurrences имеют URL — `none` (no intrinsic URL).
- если 2+ разных URL в разных occurrences — `none` (URL контекстный).

source: inline `[ URL ]` annotation в occurrences + standalone `[ URL ]`-only rows из same schemas (Phase 3.1 §13.1).

stability rule: URL intrinsic, если он consistent demonstration ссылка для exercise. Use-site URL — exception для variant-specific demos.

note: 50 standalone `[ URL ]`-only rows из Phase 3.1 (hamstring curls demo `s3_W2rAbCiA` — 31x, hip thrust demos — 18x) — это intrinsic URLs для своих exercises, просто оформлены отдельной row вместо inline.

### canonical_compound_type

description: классификация по составу имени exercise.

enum:

- `atomic` — single named movement (`DB Snatches`, `strict pull-ups`, `burpees`).
- `compound_plus` — связан через `+` connector, compound-rep / compound-set (`DB hang power clean + DB push press`, `traverses + 5 bar dips + traverses + 5 bar dips`).
- `composite_named` — historical composite name через `&` (`clean & jerk`, `DB hang power clean & push press`, `KB clean & push press`).
- `placeholder` — `*X exercise`-style slot без concrete movement (резолвится через per-set annotation).
- `alternative_or` — `X OR Y` substitution row (cardinality 2 в Phase 3.1 как exercise rows + 1 inside annotation).

source: visual analysis имени.

stability rule: structural property имени — intrinsic.

### placeholder_flag

description: flag = true если exercise — placeholder slot, не concrete movement.

values: `true` / `false`.

source: `*` prefix или содержание имени (`ANY exercise for ...`, `Burpee variation`).

cardinality: 2 placeholders в sample (`*DB exercise`, `*Burpee variation`) + 1 placeholder-compound (`ANY exercise for ABS + DB seated good morning`) + 1 muscle-group reference (`biceps / triceps` — Phase 3.1 §10).

stability rule: intrinsic. Placeholder либо ЕСТЬ placeholder, либо нет.

### aliases (informational, не атрибут)

description: список альтернативных имён, ratified merges (Phase 3.2 propose).

source: `exercise-merge-candidates.md` решения.

stability rule: историческая metadata, intrinsic.

---

## Use-site attributes

Use-site — контекстные при использовании exercise. Меняются от occurrence к occurrence. Phase 3.1 уже инвентаризировала все эти типы; здесь summary с указанием что они НЕ intrinsic.

### reps

description: per-occurrence rep count или rep notation. Phase 3.1 §2.

variants:

- integer count (`10 DB Snatches`)
- range count (`10-15 single leg GLUTE BRIDGE`)
- unit-bound count (sec/min/km — `30 sec PLANK`, `5 km run`)
- MAX-notation 3 sub-forms (bare MAX, MAX rounds progressive, MAX in remaining time)
- implicit (наследуется из ladder marker или schema header)
- per-limb count (`[ 5 each leg ]` — total count specified, distribution per-limb)
- range + per-limb

stability rule: per-occurrence варьируется (5 DB squats vs 50 DB squats — same exercise). Use-site.

### weight

description: per-occurrence weight VO. Phase 3.1 §3.

variants (per main-session modifier classification):

- single — `[ 15 kg ]`, `[ 24 kg ]`
- dual — `[ 2x 15 kg ]`
- single-arm — `[ 1x 15 kg ]`
- compound-device — `[ DB 2x 15 kg ]`, `[ DB 1x 15 kg ]` (DB prefix in annotation)
- split-tier — `[ 5 KB 24 kg + 10 DB 15 kg ]` (2 stages within 1 set)
- dual-value — `[ 50/30 kg ]` (interpretation deferred)
- weight-with-asymmetric-arm-action — `[ 15 kg | LEFT arm DO | RIGHT arm HOLD in UP ]`
- bodyweight (no annotation) — implicit

stability rule: weight per-occurrence варьируется (DB Snatches с `[ 1x 15 kg ]` vs `[ 2x 15 kg ]` vs `[ 15 kg ] [ alternative ]`). Use-site.

caveat: для несколько exercises доминирует один weight стабильно (`DB bench presses` — все 5 occurrences с `[ 2x 15 kg ]`). Это НЕ делает weight intrinsic — он остаётся per-occurrence параметром, просто coach использовал один и тот же по всем sample-сессиям. Future sessions могут изменить.

### side / per-limb distribution

description: указание стороны или распределения. Phase 3.1 §6.2.

variants:

- `each_leg` enum (with explicit per-limb counts variant `5 each leg`, etc.)
- `each_arm` enum (with explicit per-limb counts)
- explicit `LEFT ARM` / `RIGHT ARM` / `LEFT arm` / `RIGHT arm` (paired-rows для asymmetric distribution)

stability rule: per-occurrence. Same exercise может быть выполнен `each leg` в одном occurrence и `LEFT/RIGHT` paired-rows в другом.

### tempo / pause modifier

description: per-occurrence tempo modification. Phase 3.1 §4.

variants:

- pause_in_up `[ + N sec pause in UP position ]`
- per_nth_rep_pause `[ AFTER each Nth REP - M sec pause ]`
- slow_eccentric `[ N sec SLOW down ]`
- hold_after_last `[ N sec HOLD after LAST ]`

stability rule: per-occurrence. Same exercise может быть с pause в одной schema, без — в другой.

### position / equipment modifier

description: per-occurrence positioning / equipment removal. Phase 3.1 §3 (modifier).

variants:

- enum: `neutral_grip`, `from_sofa`, `from_box`, `from_box_or_sofa`, `from_sofa_box`, `without_bench`, `without_jump`, `hold_farm_carry`, `hand_on_DB`, `hands_on_DB`, `hand_on_DB | neutral_grip` (composite)

stability rule: per-occurrence. Same exercise может быть с position modifier или без. Note: для HSPU position modifier `from sofa` / `from box/sofa` присутствует в большинстве occurrences — близко к intrinsic, но всё ещё use-site (Phase 3.1 классифицирует как exercise-scope modifier).

### sequence indicator (positional timing)

description: positional / timing modifier относительно других blocks в block-topology. Phase 3.1 §6.6.

variants:

- `before_named` (`before BAR DIPS complex`)
- `after_named` (`after BAR DIPS complex`)
- `only_once_before` (`ONLY ONCE before METCON`)
- `after_each_round` (`AFTER EACH ROUND`)
- `after_each_typed_round` (`after each GYMNASTICS round`)
- composite (`after BAR DIPS complex and before NEXT block`)

stability rule: per-occurrence — same exercise в одной schema может быть `before BAR DIPS complex`, в другой — без модификатора. Use-site.

### effort intensity

description: per-occurrence effort target. Phase 3.1 §6.8.

variants:

- percent (`75-80% Effort`, `70% EFFORT`)
- categorical (`EASY PACE`)

scope: schema или block (не exercise — но привязка к conrete occurrence).

stability rule: per-occurrence. Use-site.

### URL (when not intrinsic)

description: variant-specific demonstration URL. Phase 3.1 §6.9.

stability rule:

- intrinsic если 80%+ occurrences имеют тот же URL.
- иначе use-site (variant-specific — `DB single arm row [ WITHOUT BENCH ]` имеет own URL `_LJQDmOcTbE`, отличающийся от `xl1YiqQY2vA` для regular variant).

### drop-set program details

description: nested drop-set program structure внутри annotation. Phase 3.1 §9.

instance: `3 sets [ x5 [ DB 2x 15 kg ] ...then... x5 [ DB 1x 15 kg ] ...then... x5 [ EXPLODE / WITHOUT WEIGHT ] ]`.

scope: per-schema (entire Bulgarian split squats schema). Per-occurrence параметризованная программа (rep-stage values меняются между occurrences — x5 vs x7).

stability rule: program structure attached к named-exercise-program archetype occurrence. Use-site (хотя сама "Bulgarian split squats" Exercise — intrinsic).

### per-set substitution mapping

description: per-set assignment для placeholder exercises. Phase 3.1 §8.

instance: `[ *DB exercise: 1st set HANG SQUAT CLEANS | 2nd set HANG POWER CLEANS | 3rd set FRONT SQUATS ]`.

scope: per-schema mapping от placeholder slot до 3-set instances.

stability rule: per-occurrence. Use-site (специфичная mapping для конкретной schema).

### media reference (general)

description: external URL reference annotation. May be inline, standalone, bare URL, labeled (`EXPLODE: URL`).

stability rule: использование URL — intrinsic если стабильно (default_demo_url); occurrence-specific URL — use-site.

### compound-rep definition

description: redefining what counts as 1 rep. Phase 3.1 §11, §12.

variants:

- curly-brace `{ 1 push up + each arm row = 1 rep }` (2 occurrences для DB Renegade row)
- inline rep-equality `5 reps = 1 rep [ ... ]` (1 occurrence, block-043 HS walk + HSPU)

stability rule: per-occurrence rep definition. Use-site (specifies how to count this occurrence).

caveat: для DB Renegade row оба occurrences имеют same `{ 1 push up + each arm row = 1 rep }`. Можно argue это intrinsic для DB Renegade row movement specifically. Phase 3.2 не финализирует — escalate.

### multi-stage arm program (free-text complex)

description: complex per-arm action description, обычно free-text. Phase 3.1 §12.

instance: `[ 1 ARM HOLD in UP | another ARM DO 5 reps | than opposite | AND + 5 reps BOTH arms ]` (2 occurrences).

stability rule: per-occurrence specific program. Use-site free-text annotation.

---

## Decision boundary (intrinsic vs use-site)

Применяется правило **stability ∧ semantic role**:

| attribute               | stability check                   | semantic role                     |
| ----------------------- | --------------------------------- | --------------------------------- |
| canonical_name          | identity definition               | what is this exercise             |
| primary_equipment       | 100% stability across occurrences | required tool                     |
| movement_type_tag       | tag of movement                   | biomechanics description          |
| default_demo_url        | ≥80% across occurrences with URL  | exercise demo (when stable)       |
| canonical_compound_type | structural property of name       | composition of identifier         |
| placeholder_flag        | structural property of name       | is this a slot or concrete        |
| **boundary**            | ---                               | ---                               |
| reps                    | varies per occurrence             | how much today                    |
| weight                  | varies per occurrence             | how heavy today                   |
| side                    | varies per occurrence             | how distributed today             |
| tempo                   | varies per occurrence             | how slow today                    |
| position                | varies per occurrence             | which variant today               |
| sequence                | varies per occurrence             | where in block today              |
| effort                  | varies per occurrence             | how hard today                    |
| drop-set program        | varies per occurrence schema      | program details for this schema   |
| substitution mapping    | varies per occurrence schema      | per-set exercises for this schema |

### Edge cases by boundary

**case 1: position modifier на 100% occurrences одного exercise.**

- `strict HSPU [ from sofa ]` — 6 occurrences, все имеют `[ from sofa ]`.
- `strict HSPU [ from box/sofa ]` — 5 occurrences.
- `strict HSPU` (bare) — 11 occurrences.
- Решение: position остаётся use-site, потому что bare-form существует (есть occurrences без position modifier).

**case 2: weight на 100% occurrences одного exercise.**

- `DB bench presses` — все 5 occurrences с `[ 2x 15 kg ]`.
- Решение: weight остаётся use-site (это случайное совпадение sample, не intrinsic constraint).

**case 3: URL на 100% occurrences.**

- `DB Renegade row` — обе occurrences с `bi1Nf5G86gU` URL.
- `seated lateral BANDED raises` — 9 occurrences, все с `KXqJzrrTDBo`.
- Решение: URL intrinsic (`default_demo_url` filled).

**case 4: rep-definition на 100% occurrences.**

- DB Renegade row — обе occurrences с `{ 1 push up + each arm row = 1 rep }`.
- Решение: borderline. Это compound-rep semantic для exercise definition. Phase 3.2 — оставляет как use-site annotation (Phase 5 может upgrade в intrinsic для specific exercises).

---

## Coverage

Intrinsic attribute coverage по 152 canonical exercises (after merges):

- canonical_name: 152/152 (100%).
- primary_equipment: 152/152 (100% включая `unknown` где не выводится — но в практике все имеют конкретный enum или `mixed`).
- movement_type_tag: 145/152 (~95% c primary tag; ~7 with `unknown` для слишком sparse / placeholder).
- default_demo_url: 38/152 (~25% — большинство exercises не имеют intrinsic URL).
- canonical_compound_type: 152/152 (100% — structural property имени).
- placeholder_flag: 152/152 (100%).

Details — `exercise-canonical-list.md`.

---

## Summary

- **Intrinsic attributes**: 7 (canonical_name, primary_equipment, movement_type_tag, default_demo_url, canonical_compound_type, placeholder_flag, aliases).
- **Use-site attributes**: 11 type families (reps, weight, side, tempo, position, sequence, effort, URL-variant, drop-set program, substitution mapping, compound-rep definition, multi-stage arm program).
- **Boundary criterion**: stability (≥80% — для URL; 100% — для equipment/structural) AND semantic role (identity-defining vs occurrence-specific).
- **Edge cases**: 4 documented с явными decisions.
- **Discussion bonus**: Phase 3.2 рекомендует **не** делать automatic upgrade use-site → intrinsic по 100% sample stability — sample мал, future occurrences могут варьировать. Intrinsic boundary based on semantic role first, statistics second.
