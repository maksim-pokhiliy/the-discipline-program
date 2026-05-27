# Session B briefing — Demo Plan canonical JSON parser

You are a parallel Claude Code session opened against the same repository
(`/home/maksym/projects/contrib/the-discipline-program`). Your single
deliverable is one file:

```
packages/api-server/prisma/seed/_canonical/plan-denys.json
```

containing a complete, validated `CanonicalSeed` value (Zod schema +
TypeScript types in `packages/api-server/prisma/seed/_canonical/canonical-schema.ts`).

You do NOT write any Prisma code, do NOT touch any TypeScript besides the
briefing artifacts in `_canonical/`, do NOT run `pnpm db:seed`. The peer
session ("Session A") owns the Prisma emit pipeline downstream.

---

## 1. Why

The Discipline Program seed currently has 21 exercises, 11 labels, and 7
days of a single archived plan (`2025 Open Prep`). The domain model
(Prisma `schema.prisma` + Zod contracts in `packages/contracts/src/entities/lms/`)
encodes ~17 value objects and 33 schema archetypes covering professional
CrossFit programming. The coach (Denys) maintains a real ~33-week training
plan dumped to markdown in `analysis/source/sheets/sheet-01.md .. sheet-33.md`,
verified by the analysis pipeline (Phases 1–7) to exercise 100% of the
domain model discriminator space.

Your job: parse the 33 sheets + the analysis artifacts into a single
canonical JSON form that the peer Prisma-emit session can consume
deterministically. Output of this session = input of the next.

Decomposition rationale (from the orchestrator session): parsing 33 weeks
of training data is mechanical, deterministic, and high-volume.
Architectural decisions (Zod schema, Prisma mapping, coverage assertions)
live in Session A. Keeping the two split (a) avoids context-window thrash
inside one /feature run, (b) gives Session A a frozen artifact to validate
against, (c) lets the coach review the JSON before any DB mutation.

---

## 2. Read first — mandatory

In order. Skim header + relevant sections; do not read every line of every
file at once.

1. **`packages/api-server/prisma/seed/_canonical/canonical-schema.ts`** —
   the Zod schema you are conforming to. Source of truth for shape +
   field constraints + cross-reference invariants (X1–X10 at the bottom).
   Every field name, optionality, enum value, and discriminator literal in
   your JSON must match this file exactly.

2. **`packages/api-server/prisma/seed/_canonical/coverage-matrix.md`** —
   what cells of the discriminator space your output must hit. Every row
   with `Required ≥ N` must be satisfied in the emitted JSON. Coverage
   assertion runs downstream; if you skip cells, the build fails.

3. **`analysis/artifacts/06-formalization/stress-final.md`** — verified
   archetype-instance mapping for all 198 block instances. Every block-NNN
   you encounter in the sheets has a representative example here with
   exact `archetypeParams` shape. Treat this as the canonical "how to map
   sheet markdown → archetypeParams". Do not invent params shapes.

4. **`analysis/artifacts/06-formalization/types.ts`** — the final
   TypeScript type definitions for all VOs + archetype params. Source of
   truth for discriminator literals. Already imported by canonical-schema.ts
   transitively via `@repo/contracts/lms`.

5. **`analysis/artifacts/01-inventory/block-instances.md`** — the 198
   canonical block instances (`block-001 .. block-198`) with raw bodies
   and `locations` (which sheet × day × session × row range each block
   instance occurs in). Use this to resolve `blockInstanceRef` and to
   locate which sheet rows feed into which block.

6. **`analysis/artifacts/02-patterns/schema-archetype-mapping.md`** —
   per-block, per-schema archetype assignment for all 337 schemas. Pairs
   directly with stress-final.md §2. Use this to identify the archetype
   for every schema you emit.

7. **`analysis/artifacts/03-content/exercise-canonical-list.md`** — 149
   canonical exercises after merge. Source for `catalog.exercises[]`. Use
   the canonical name as the basis for `ref` (kebab-case it consistently;
   e.g. `DB Bench Press` → `db-bench-press`).

8. **`analysis/artifacts/04-structure/labels-catalog.md`** — labels
   catalog (Day/Session/Block applicable levels). Source for
   `catalog.labels[]`.

9. **`analysis/artifacts/03-content/load-edge-cases.md`** + **`modifier-scope.md`** + **`exercise-edge-cases.md`** + **`compound-and-alternative.md`** + **`schema-content-primitives.md`** — VO-specific edge cases. Cite as needed when a cell is rare and you need to verify which block-NNN attests it.

10. **Source sheets**: `analysis/source/sheets/sheet-01.md .. sheet-33.md`
    — 33 markdown dumps of the training table, one week per file. Body of
    each sheet has 7 H2 sections (`## MONDAY`, `## TUESDAY`, …), each with
    a session label (`1ST SESSION:`), then block labels, then content.

Optional / reference:

- `analysis/artifacts/06-formalization/schema.prisma` — Prisma DSL for
  the training-domain slice. Useful for enum value lists (`Equipment`,
  `MovementType`, `Position`, `DayOfWeek`).
- `analysis/artifacts/06-formalization/implementation-notes.md` — phase-6
  resolution algorithms (display header resolver, intensity inheritance,
  preprocessor rules); helpful when you need to disambiguate.
- `analysis/artifacts/00-meta/workflow.md` — Phase 1 inventory rules
  (PASS 1 LABELS / PASS 2 BLOCK-INSTANCES) — explains how the analysis
  chain itself was built.

---

## 3. What to emit

One file:

```
packages/api-server/prisma/seed/_canonical/plan-denys.json
```

Validated against `canonicalSeedSchema` from `canonical-schema.ts`. Use
the type as your mental contract.

Top-level shape (see canonical-schema.ts for full):

```json
{
  "meta": {
    "schemaVersion": 1,
    "generatedAt": "<ISO 8601 datetime>",
    "sourceRepoCommit": "<git HEAD short SHA, optional>",
    "sourceSheetsRange": { "fromSheet": "sheet-01", "toSheet": "sheet-33" },
    "notes": "Optional description of decisions/gaps."
  },
  "catalog": {
    "exercises": [ ... ExerciseCatalogEntry[] ... ],
    "labels":    [ ... LabelCatalogEntry[] ... ]
  },
  "plan": {
    "title": "Maks Pooh — Discipline 2025–2026",
    "description": null,
    "athleteName": "Maks Pooh",
    "totalWeeks": 33,
    "todayWeekIndex": <N where N = mid-plan, see §6 for offsets>
  },
  "weeks": [ ... CanonicalWeek[] ... ],
  "phase7Examples": [ ... PhaseSevenSession[] ... ]
}
```

Each `weeks[i]` carries `sheetRef: "sheet-NN"` (or `null` for gap weeks),
`weekOffsetFromTodayWeeks: <relative int>`, and `days[]` covering the
sheet's H2 sections.

---

## 4. Mapping rules (sheet markdown → canonical JSON)

### 4.1 Day

- One sheet H2 section (`## MONDAY`, `## TUESDAY`, …) → one `Day` entry,
  `dayOfWeek` enum-mapped.
- `Day.label`: only `REST DAY` (or its variants like `R E S T  D A Y`)
  produces a `Day.label = "rest-day"` ref. Active days carry `label: null`.
- `Day.sessions = []` for REST days.
- `Day.notes`: free-text coach notes if present in sheet (rare); else
  `null`.

### 4.2 Session

- `1ST SESSION:` → one `Session`, `label = "1st-session"`.
- `Session.order`: 1-based within the day. Sample has 1 session per active
  day; if a day has multiple session labels (rare), emit ordered list.
- `Session.freezeLoadsAtCreation`: default `false`. Set `true` on one
  Phase 7 cluster session (covers Q10 coverage cell, §2.27 in
  coverage-matrix.md).

### 4.3 Block

- Block boundaries: a block starts at a block-label line (`STRENGTH ENDURANCE:`,
  `CORE MUSCLES:`, `SUCCESSORY WORK:`, `GYMNASTICS:`, …) and ends before
  the next block-label / session-label / day-label / sheet end.
- Implicit block: content between `1ST SESSION:` and the first block-label
  → emit a `Block` with `labels = []`. See §5 in `04-structure/hierarchy.md`.
- `Block.blockInstanceRef`: locate the matching `block-NNN` in
  `01-inventory/block-instances.md` by exact (normalised label, raw body)
  match. If multiple sheet occurrences resolve to the same block-NNN, emit
  the same `blockInstanceRef` on each — the inventory `locations[]` count
  is preserved by repetition.
- `Block.labels[]`: 0..N catalog label refs. Composite `|`-strings decompose
  per `labels-catalog.md` Rule 3:
  - `STRENGTH ENDURANCE | Gymnastics` → `["strength-endurance", "gymnastics"]`.
  - `STRENGTH ENDURANCE | EASY PACE [ 70% EFFORT ]` → `["strength-endurance", "easy-pace"]` + `Block.intensity.effortPercent.value = 70`.
- `Block.intensity`: extract `[ N% EFFORT ]` / `[ N-M% Effort ]` annotations
  from block-label string → `intensity.effortPercent`. Move pace component
  (`EASY PACE`) into `labels[]` (Phase 4 decision; do not collapse into
  Intensity).
- `Block.timeCap`: extract `[ N min ]` / `[ N-M min ]` / `[ N sec ]` annotations
  from block-label string → `timeCap`. Example: block-146 `PRACTICE [ 5-10 min ]`
  → `timeCap = { min: 5, max: 10, unit: "min" }`.
- `Block.schemas[]`: ordered list, can be empty (Phase 4 ratified).

### 4.4 Schema

- Schema boundary inside a block: each `header:` line (e.g. `3-5 rounds:`,
  `15-12-9:`, `EMOM 16 min:`, `3 sets | shoulders:`) starts a new schema.
  Headerless archetypes (parallel-ladders-descending, flat-list-headerless,
  single-line-bare, pull-ups-dips-cycle, run-distance, placeholder-body,
  practice-list, url-only-body) start at the body line directly under the
  block-label / preceding header.
- `Schema.kind`: per archetype assignment (ATOMIC / HEADERLESS / NESTED /
  NAMED / COMPOSITE). See per-archetype `kind` mapping in
  `stress-final.md` §2.
- `Schema.archetype`: full `archetypeParams` discriminated-union value
  with `archetype` literal + `params` object. Match the example in
  `stress-final.md` §2 verbatim (do not invent param keys).
- `Schema.header`: the raw header string from the sheet (e.g. `"3-5 rounds:"`,
  `"15-12-9:"`); `null` for headerless schemas.
- `Schema.notes`: EXAMPLE annotations (`EXAMPLE: ... etc.`) extracted from
  body → here (Q15).
- `Schema.intensity`: `[ N% Effort ]` / `[ N-M% Effort ]` body annotations
  on the schema row (NOT block-level) → here (block-078 / schema-1).
- `Schema.alternatingGroupRef`: when two or more schemas in the same block
  form an alternating-sets group (block-009: schema-1 `1st | 3rd | 5th sets`
  - schema-2 `2nd | 4th | 6th sets`), emit the same scoped ref string on
    both (e.g. `"block-009-alt-group-1"`) and set
    `alternatingGroupRelation = "ALTERNATING_SETS"`. For all other schemas,
    both fields are `null`.
- `Schema.rows`: per row in the body. See §4.5.
- `Schema.subSchemas`: nested archetypes (time-window-outer,
  emom-nested-per-minute, nested-rounds-over-rounds, nested-rounds-over-parallel-ladder,
  nested-composite-rounds-over-ladder). Recurse.

### 4.5 Row

- Each `SchemaRow` matches a meaningful body line:
  - Exercise line → `rowKind = "EXERCISE"`, `rowPayload.exercise = { form: "atomic" | ... }`.
  - Inline rest line (`- 5 min rest -`, `REST IN BETWEEN SETS UNTIL RECOVERY`)
    → `rowKind = "REST"`, `rowPayload.raw = "<original text>"`, `rowPayload.parsed = <RestSpec>`.
  - Trailing standalone load (`[ 2x 15 kg ]` on its own row, applies to
    preceding rows) → `rowKind = "STANDALONE_LOAD"`, `rowPayload.scope = "applies_to_all_preceding_rows"`.
  - URL row → `rowKind = "STANDALONE_URL"`, `wrapped` true/false depending
    on bracket form.
  - Placeholder (e.g. `biceps / triceps`) → `rowKind = "PLACEHOLDER"`,
    `rowPayload.placeholder = { placeholderKind, text, ... }`.
  - Inner ladder marker (in parallel-ladders-descending; e.g. `36-28-20`)
    → `rowKind = "INNER_LADDER_MARKER"`, `steps: number[]`.
  - Rep-definition row (`5 reps = 1 rep [ 1 HS walk + 2 strict HSPU ]`)
    → `rowKind = "REP_DEFINITION"`.
  - REST sub-minute slot inside EMOM (single `REST` word body) → `rowKind = "REST_SLOT"`.
  - Footnote line (`** 5 strict HSPU [ AFTER EACH ROUND ]`) → `rowKind = "FOOTNOTE"`,
    `marker = "**"`, `target`, `content = CompoundRow`.
- `Row.refId`: ONLY required for rows referenced by `parallel-ladders-*.ladders[].pairedWithInnerRowId`
  or `super-set.pairs[].schemaRows[]`. Convention: `"<block-NNN>-row-<order>"`
  scoped within the block.
- `Row.load`, `Row.reps`, `Row.side`, `Row.tempo`, `Row.position`,
  `Row.sequence`, `Row.intensity`, `Row.media`, `Row.compoundRep`,
  `Row.notes`: extract from `[ ... ]` annotations on the exercise line.
  See VO mapping below.

### 4.6 VO extraction from `[ ... ]` annotations

Each `[ ... ]` annotation on an exercise line maps to a row-level VO. Walk
`03-content/load-edge-cases.md` + `modifier-scope.md` for the full table.
Common mappings:

| Annotation pattern                                           | VO target                                                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `[ N kg ]`                                                   | `Load.absolute.weight.single`                                                   |
| `[ 2x N kg ]`                                                | `Load.absolute.weight.dual`                                                     |
| `[ 1x N kg ]` (single-arm)                                   | `Load.absolute.weight.single_arm`                                               |
| `[ N kg \| LEFT arm DO \| RIGHT arm HOLD in UP ]`            | `Load.absolute.weight.with_asymmetric_arm` (workingArm/passiveArmAction)        |
| `[ A KB N kg + B DB M kg ]`                                  | `Load.absolute.weight.split_tier.stages[]`                                      |
| `[ N kg \| to the parallel ]`                                | `Load.absolute.weight.with_depth_modifier` (depth=to_parallel)                  |
| `[ N/M kg ]`                                                 | `Load.absolute.weight.dual_value` (first=N, second=M, resolver=athlete_profile) |
| `[ N% ]` / `[ N% EFFORT ]` / `[ N-M% Effort ]` (block-label) | `Block.intensity.effortPercent`                                                 |
| `[ N% Effort ]` body annotation                              | `Schema.intensity.effortPercent`                                                |
| `[ WITHOUT WEIGHT ]` / `[ EXPLODE ]` (drop-set stage)        | `Load.without_weight` with `context = "drop_set_stage"`                         |
| `[ each leg ]`                                               | `PerLimbDistribution.each_leg`                                                  |
| `[ each arm ]`                                               | `PerLimbDistribution.each_arm`                                                  |
| `[ alternative ]`                                            | `PerLimbDistribution.alternating`                                               |
| `[ LEFT ]` / `[ RIGHT ]` standalone                          | `PerLimbDistribution.explicit_split` with `side`                                |
| `[ from sofa ]` / `[ from box ]`                             | `Position.FROM_SOFA` / `FROM_BOX`                                               |
| `[ neutral grip ]`                                           | `Position.NEUTRAL_GRIP`                                                         |
| `[ ONLY ONCE before METCON ]`                                | `SequenceIndicator.only_once_before` with `targetLabel = "METCON"`              |
| `[ AFTER EACH ROUND ]` (footnote)                            | `Footnote.target = each_round`                                                  |
| `[ AFTER EACH GYMNASTICS set ]` (footnote)                   | `Footnote.target = each_typed_round`, `type = "GYMNASTICS"`                     |
| `[ TOTAL ]`                                                  | `RepNotation.total_flag`                                                        |
| `[ MAX ]` / `MAX in remaining time:`                         | `RepNotation.max` (subForm `bare` / `in_remaining_time` / `progressive`)        |
| `EXAMPLE: ... etc.`                                          | `Schema.notes` verbatim (Q15)                                                   |
| URL inline `[ https://... ]`                                 | `Row.media` with `position=inline`, `appliesTo=current_row`                     |
| URL standalone wrapped (no `[`/`]`)                          | `rowKind = STANDALONE_URL`, `wrapped=true`                                      |
| `5 reps = 1 rep [ inner+inner ]`                             | `rowKind = REP_DEFINITION`, `equality.composition[]`                            |

For rare / ambiguous patterns: consult `03-content/load-edge-cases.md` +
`modifier-scope.md` + `exercise-edge-cases.md`. If still unclear, set the
field to `null` and add a `notes` entry on the row explaining the
ambiguity. Session A will surface unresolved entries for the orchestrator
to ratify.

---

## 5. Cross-reference resolution

- `exerciseRef`: pick stable kebab-case derived from canonical name from
  `exercise-canonical-list.md`. Lowercase, replace spaces with hyphens,
  drop non-alphanumeric (e.g. `DB Bench Press` → `db-bench-press`,
  `5 strict DB press + 5 DB push press` → `compound-5-strict-db-press-plus-5-db-push-press`
  — for compound entries, scope within the catalog as one compound exercise
  with its own canonical name per §3.2 of `exercise-canonical-list.md`).
- `labelRef`: same kebab-case rule applied to label name.
- `archetypeName`: the literal enum value from `ArchetypeName` (see
  `types.ts` line ~521).
- `blockInstanceRef`: exact `block-NNN` (3-digit zero-pad) from the
  inventory.

Refs are deduplicated globally (catalog entries unique by `ref`); cells
referencing the same exercise multiple times use the SAME ref string.

---

## 6. Date handling

Session B does not emit calendar dates. Each `Week` carries
`weekOffsetFromTodayWeeks: number` (integer, signed):

- Negative = past weeks (e.g. `-15` = 15 weeks before "today" / seed-run instant).
- `0` = the week currently containing "today" (the mid-plan reference).
- Positive = future weeks.

The plan-shell `todayWeekIndex` field marks WHICH `weeks[i].weekIndex`
corresponds to `weekOffset = 0`. Session A resolves absolute dates as
`Week.startDate = startOfWeek(seedRunInstant, MONDAY) + weekOffset * 7 days`.

For a 33-week plan, recommend:

- `weeks[0].weekOffsetFromTodayWeeks = -15`
- `weeks[16].weekOffsetFromTodayWeeks = 0` (= `todayWeekIndex = 16`)
- `weeks[32].weekOffsetFromTodayWeeks = +17`

(Adjust if the source mid-plan moment makes more sense at a different
week, but offsets must be monotonic by `weekIndex`.)

Missing source weeks (calendar gaps per `01-inventory/edge-cases.md`):
emit `Week` rows with `sheetRef: null`, `days: []`, and a `notes` string
explaining the gap. Offsets still must be monotonic — gap weeks occupy a
positional slot.

---

## 7. Phase 7 examples

Phase 7 conceptual sessions (HR Z2 base run, numeric pace row intervals,
tempo back squat, snatch wave, cluster pull-ups, accessory super-set) are
emitted as the `phase7Examples` flat list. Source: `stress-final.md` §7.1–§7.6.

Each `PhaseSevenSession` carries:

- `exampleId`: one of the six enum values (see `canonical-schema.ts`).
- `dayOfWeek`: pick whichever weekday fits the body (e.g. tempo back squat
  on MONDAY, row intervals on WEDNESDAY).
- All `Session` fields as for normal sessions.

Session A injects them as one synthetic week tail at `weekIndex = totalWeeks + 1`
with `weekOffset = +18` (one week after the last sheet week).

The six examples MUST cover:

1. `Intensity.hrZone: { zone: "Z2" }` (§7.1)
2. `Intensity.numericPace` + `Equipment: ROW_ERG` (§7.2)
3. `TempoModifier.fullTempo: { eccentric: 3, pauseBottom: 1, concentric: 2, pauseTop: 0 }` + `Load.percentage.reference.self` (§7.3)
4. `StagedProgram.programKind: "wave"` (§7.4) with 3 stages, `restBetweenStages`
5. `StagedProgram.programKind: "cluster"` (§7.5) with `restBetweenStages` (intra-cluster sec scope) + `InlineRestRow` (inter-set min scope)
6. `archetype: "super-set"` (§7.6) with two `SuperSetPair`s + `restBetweenPairs`

Reproduce the pseudocode shapes from §7.1–§7.6 verbatim (with real
`exerciseRef` and `labelRef` values from the catalog).

Additionally use Phase 7 sessions to fill cells missing from the sample
(per coverage matrix §11): remaining `Intensity.pace` values (`moderate`,
`hard`, `recovery`), remaining `Intensity.hrZone` values (`Z1`, `Z3`, `Z4`,
`Z5`), `Intensity.rpe`, `numericPace.paceType = distance_per_min`,
`Position` enum singletons not attested in sample.

---

## 8. Validation

Before declaring done:

1. Parse your JSON via `canonicalSeedSchema.parse(...)`. Zero Zod errors.
   - To run: `pnpm --filter @repo/api-server check-types`, then write a
     short throwaway script at `packages/api-server/prisma/seed/_canonical/validate.ts`
     that imports `canonicalSeedSchema`, reads the JSON, calls `.parse()`,
     prints OK or errors, exits. Delete this script before final commit.
2. Coverage check: walk `coverage-matrix.md` and ensure every cell with
   `Required ≥ N` is satisfied. Self-audit by counting occurrences of each
   discriminator in your JSON.
3. Cross-reference check: every `exerciseRef` / `labelRef` resolves in
   `catalog`. Every `blockInstanceRef` matches a real `block-NNN`. Every
   `Row.refId` referenced by a parallel-ladder / super-set actually exists
   in the same containing schema/block.

If any check fails, fix the JSON and re-run.

---

## 9. Output handoff

On success:

1. Write the validated JSON to
   `packages/api-server/prisma/seed/_canonical/plan-denys.json` (pretty-print
   2-space indent — Session A's emit code parses either form, but pretty
   makes review feasible).
2. Append a short summary to `meta.notes` describing any decisions made
   (e.g. ambiguities resolved, gap weeks, edge cases flagged).
3. Stop. Do NOT commit, do NOT run other tasks. Tell the orchestrator
   (Session A) via the user that the JSON is ready. They will validate
   downstream and proceed to `/feature C8.5`.

---

## 10. What you must NOT do

- Do NOT write any Prisma client code, do NOT touch `packages/api-server/prisma/seed/training-weeks/` or `seed/_supporting-catalog.ts` (existing Open Prep stays unchanged).
- Do NOT add new fields to `canonical-schema.ts`. If the JSON needs a
  field not present, surface it to the orchestrator instead of editing.
- Do NOT alter `analysis/artifacts/*` content. They are frozen source of
  truth.
- Do NOT use `--no-verify`, `--no-edit`, or any skip-hooks flag if you
  end up making any commit (and you shouldn't be committing in the first
  place — the orchestrator owns commit timing).
- Do NOT invent archetype names, VO discriminator literals, or enum
  values not present in `types.ts` / `schema.prisma`. If a sheet row
  describes something not covered, emit `notes` on the row and surface
  to the orchestrator.
- Do NOT cast / `as any` / `as unknown` in the validation script. Use
  Zod's `safeParse` and let it surface real errors.

---

## 11. If you get stuck

For each kind of stuck:

- **Sheet markdown ambiguous** → look up the corresponding `block-NNN` in
  `01-inventory/block-instances.md`, then its representative in
  `02-patterns/schema-archetype-mapping.md`, then the archetype example
  in `stress-final.md` §2. The chain disambiguates 99% of cases.
- **VO mapping unclear** → `03-content/load-edge-cases.md` (load),
  `modifier-scope.md` (side/tempo/sequence/position),
  `exercise-edge-cases.md` (exercise variants), `compound-and-alternative.md`
  (compound row forms), `schema-content-primitives.md` (schema content).
- **Exercise not in canonical-list.md** → the list is supposed to cover
  149 entries verbatim from the sheets. If a sheet row references an
  exercise not in the list, that's a sheet typo or an analysis-chain
  gap. Add to `catalog.exercises[]` with best-effort attributes, flag in
  `meta.notes`.
- **Schema doesn't fit any archetype** → check
  `02-patterns/schema-archetype-mapping.md` — every schema has an
  assignment, including sub-schemas. If something genuinely doesn't fit,
  flag in `meta.notes` and emit best-effort.
- **Phase 7 example needs an exercise not in catalog** → add to
  `catalog.exercises[]`; the analysis catalog only covers the 33-sheet
  sample. ROW_ERG-related exercises (`ROW_ERG row`, etc.) and Olympic
  variants for wave/cluster need to be added with `primaryEquipment`
  from the Phase 7 Equipment-enum extensions (`ROW_ERG`, `ASSAULT_BIKE`,
  `ATLAS_STONE`, `JUMP_ROPE`, `SKI_ERG`, `SLED`, `YOKE`).

---

## 12. Acceptance — what "done" looks like

- `packages/api-server/prisma/seed/_canonical/plan-denys.json` exists.
- `canonicalSeedSchema.parse(json)` succeeds with zero errors.
- Coverage matrix §1–§24 cells all satisfied (you can grep the JSON to
  verify cardinalities).
- All cross-references (X1–X10 in `canonical-schema.ts`) resolve.
- `meta.notes` lists any ambiguities, edge cases, or decisions worth
  flagging to the orchestrator.

When this is true, you are done. Hand off to the orchestrator session.
