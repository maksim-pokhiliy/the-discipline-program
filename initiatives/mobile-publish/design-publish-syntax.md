# mobile-publish — publish-syntax v2 (projection readability)

**Created:** 2026-06-26 · **Status:** spec locked (approach ratified by owner; exact format pending a coach render-and-show gate). Drives **D-13**.

## 1. Why — coach feedback (2026-06-25, first prod publishes)

Денys, after the first General-channel publishes landed in the iOS app:

- "оно типо не видит при синхронизации ту вкладку где **ЕМОМ или АМРАП или кол-во раундов** прописанных"
- "не хватает всяких **скобок, разделителей** и тд" (hard to scan vs. how he hand-writes)
- "А вообще супер! Экономия времени огромная" — the pipeline works; this is a readability/fidelity fix, not a rework.

The published text drops the workout **structure** (the EMOM/AMRAP/rounds identity) and reads as a flat telegram instead of his structured house style.

## 2. Root cause (verified in code + tests, 2026-06-26)

`projectBlock` (`endpoints/coaching/mobile-publish/projection/project-day.ts`) renders ONLY `schema.rows` through the flat `renderRowLine`:

```ts
exercises: block.schemas.flatMap((schema) => schema.rows.map((row) => renderRowLine(...)))
```

It drops the entire **Schema structural layer**:

- `schema.composition` — EMOM/AMRAP/rounds/ladder/interval/cap/rest/benchmark. **DROPPED.** This is the "вкладку не видит".
- `schema.header` — free text, often his hand-typed structure with `[ ]` / `|` / `:`. **DROPPED.**
- `schema.intensity` — only threaded into per-row intensity (repeated `EFFORT 80%` on every line), never shown once.

`renderRowLine` joins parts with a single space (no brackets/separators); `row.notes` is computed in `buildRowSummaryTexts` but never emitted. The current `projection/parity.test.ts` **asserts this drop as correct** (a benchmark schema → only bare rows) — the tests encode the bug.

## 3. Evidence (prod, read-only)

**Our Neon (66 schemas):** `composition` 66/66 · `intensity` 66/66 · `header` 59/66. The dropped layer ≈ **100% of Денys's authoring**, not an edge case. Repetition kinds in use: `count` 25 · `ladder` 8 · `interval` 7 · `once` 3 · `cadence`(EMOM) 1 · `timeCap`(AMRAP) 1 · `benchmark` 13. He uses the full spectrum.

**Legacy prod (his 395 manual `exercises[]` entries, read via ADMIN REST GET):** decoded his house style (§4).

**Same-week side-by-side** (one coach, one week, same legacy DB):

```
OUR PUBLISH — general id 575 (2026-06-26 Advanced), metcon block:
  Ski 18 cal RX Male:18 Female:14 EFFORT 80%
  DB walking lunges (Farmer carry hold) 14 reps RX Male:22.5 Female:15 / SC Male:15 Female:10 double DB EFFORT 80%
  Power clean & Push jerk 10 reps RX Male:50 Female:35 / SC Male:40 Female:25 EFFORT 80%

DENYS MANUAL (his real legacy rows):
  5 sets [ choose weight ]:

  3 bench presses [ jerk grip ]
  3 chin pull-ups [ w/ weight ]
```

**Live training levels drift confirmed (MP-6):** `Scaled / Pro / Advanced / Functional Bodybuilding` — a 4th level appeared. Keep reading levels live; never hardcode.

## 4. Денys's house-style conventions — the target-format SSOT (decoded from 395 legacy entries)

The legacy native shape is **one `exercises[]` entry = one schema = a header line + `\n\n` + movement lines** (their own seed example: `"5 sets [ choose weight ]:\n\n3 bench presses"`). Our bug is double: we split per-row AND drop the header.

| Element                          | His notation (verbatim from prod)                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schema structure header          | `5 sets [ choose weight ]:` · `EMOM 12 min \| 3 rounds:` · `4 sets \| 2 min rest in between sets:` · `2/4 rounds:` · ladder `9-7-5-3:` · `...then AMRAP in remaining time:`          |
| Intensity (effort/RPE)           | in the section/schema header, **once**, joined with `\|`: `INTERVALS \| 80-85% EFFORT:` · `\| RPE 8.0-8.5 \|`                                                                        |
| Load RX/female                   | `[ 60/40 kg ]` (male/female) · double implement `[ 2x24/16 kg ]` · per-set `[ 1st set: 55/30 kg \| 2nd set: 45/25 kg ]` · alt movements `bar / ring dips`, `D-ball / Sandbag cleans` |
| Rest                             | `\| 5 min rest in between sets \|`                                                                                                                                                   |
| Movement line                    | reps **first**: `12 KB snatches`, `3 bench presses`, `18 cal Ski`                                                                                                                    |
| Notes / modifiers / alternatives | bracketed: `[ jerk grip ]`, `[ OR strict pull-ups ]`, `[ w/ weight ]`                                                                                                                |

## 5. Target output (the §3 metcon, projection v2 — actual rendered text, owner-reviewed 2026-06-26)

```
metcon
AMRAP 20’ | EFFORT 80%:

18 cal Ski [ RX M:18 F:14 ]
14 reps DB walking lunges (Farmer carry hold) [ RX M:22.5 F:15 / SC M:15 F:10 ] [ double DB ]
10 reps Power clean & Push jerk [ RX M:50 F:35 / SC M:40 F:25 ]
```

Recovers: the `AMRAP 20’` identity, `80%` once (not per row), bracketed loads, reps-first, double-DB as a bracket note. One grey card in iOS — his shape. Element-value text (`RX M:18 F:14`, `@…% of 1RM`) comes from the shared formatters as-is; per-element wording tweaks (e.g. `18/14`, `from 1 RM`) are a deliberate D-13 element-level decision deferred until Денys reacts to the live iOS render.

### Construction (per block → `{ name, exercises[] }`)

- `name` = `block.labels[0]?.name ?? ""` (unchanged; his section label).
- `exercises[]` = **one entry per schema** (NOT a flatMap of rows). Each entry:
  - **header line** = join non-empty of `[ schemaHeaderText, intensityText ]` with `" | "`, suffixed `":"`.
    - `schemaHeaderText` = `schema.header` verbatim if present; else the composition summary (`formatRepetitionLabel` + cap + benchmark via the existing `format-composition-summary` family).
    - `intensityText` = resolved schema/block intensity, rendered once (reuse the intensity-text formatters).
  - blank line (`\n\n`) iff there are movement lines.
  - **movement lines** = `schema.rows` joined by `\n`, each row reps-first: `<reps> <exercise> [ <load> ] <side> [ <tempo> ] <row-own-intensity> [ <modifier> ]` (reuse `formatRepNotation`, `formatLoad`, `formatSide`, `formatTempo`, intensity-text). Block/schema intensity stays in the header (once); only a row's OWN intensity (provenance `row`) lands on the line. **`row.notes` are WITHHELD** — the platform hides them from its athlete view, so publishing them to the athlete-facing legacy text is an owner opt-in (MP-11), not a default.
  - trailing rest line from `composition.rest` if present (his `| … rest … |` shape).
- Empty schema (no rows) with a header → header line only. Empty block → `exercises: []` (unchanged). Rest day → `{ isRestDay: true }` (unchanged).

## 6. D-13 (decision — to promote into `decisions.md`)

> **D-13 — PROJECTION SYNTAX: schema-aware legacy text assembler; reframe the D-8 SSOT altitude.** RATIFIED (owner, 2026-06-26) for the approach; exact format ratified at the render-and-show gate.
> The Day→legacy-text projection gets its **own schema-aware assembler** that renders each Schema as `header(structure + intensity) + rows` in Денys's house style (§4/§5), composing the **existing UI-free element formatters** (`format-composition-summary`, `formatLoad`, `formatRepNotation`, `formatRestSpec`, `formatTempo`, `formatSide`, intensity-text). The single-`renderRowLine` SSOT (D-8) is **reframed, not discarded**: SSOT holds at the **element-formatter** level (how a load/tempo/intensity renders — one place, no drift), while **line/schema assembly is a legacy-specific VIEW**, genuinely distinct from the platform's JSX-chip rendering. D-8 placed the SSOT one level too high (a single flat `renderRowLine` for both surfaces) → the structural drop. `projection/parity.test.ts` + `project-day.test.ts` are rewritten: they currently assert the drop (benchmark schema → bare rows) and must instead assert the structured output + element-formatter parity.
> **Rationale.** The platform "display" is chips/cards, not a string (D-8 admitted this); the legacy needs the structure flattened into scannable text with his separators. Forcing one assembler for both was elegant-by-construction but failed the actual reader — we passed parity tests yet shipped text the coach couldn't scan. Element formatters stay shared (no drift on _how_ a value renders); only the _assembly_ forks. Projection-only, no schema/contract/legacy change.
> **Links.** `design-publish-syntax.md`; supersedes the _mechanism_ of D-8 §"join order mirrors chip order"; `project-day.ts`, `projection/{parity,project-day}.test.ts`.

## 7. Constraints (non-negotiable)

- **Projection-only.** NO Prisma schema / migration / wire-contract / legacy-backend / legacy-DB change. Lives in `api-server` (+ `@repo/contracts/lms/*` only if a formatter is extracted for reuse, behavior-preserving).
- **Inviolable legacy prod.** This work writes NOTHING to legacy. Reads were ADMIN REST GET only.
- **Re-publish is safe & self-healing.** After the fix, a coach re-publish overwrites our own owned days (content hash differs → PUT/`updated`, D-9); it never clobbers Денys's manually-authored days (`conflict`-guard, D-4). No manual cleanup, no migration of already-published rows.

## 8. Validation gate (UI-first / coach) — blocks the prod re-publish, not the PR

Before any prod re-publish: render a **real Денys week** through projection v2 and show the owner the text (diff vs. the live legacy rows). The exact punctuation in §4/§5 is ratified there. This work **does not publish** — publishing stays a separate coach action in the platform UI. The PR can merge on green tests; the render-and-show gate governs when Денys re-publishes.

**Multiline idempotency — validated (2026-06-26).** The new `exercises[]` entries carry `\n\n`/`\n`; if the legacy backend normalized that whitespace, `contentMatches` (sha of projected vs. GET-decoded, D-9) would never match → every re-publish would PUT-churn owned days and re-`conflict` unowned ones. Confirmed it does NOT: a POST→GET byte-exact round-trip of a projection-shaped multiline string (brackets, `·`, `’`, `×`, `\n\n`) through the local harness (the prod Spring clone) returned identical bytes (190==190). The `daily_program` JSONB preserves string values verbatim.

## 9. Vocabulary rules & a follow-up

- **`timeCap` repetition = AMRAP, never "cap" (owner-ratified 2026-06-26).** In CrossFit "AMRAP" names the schema TYPE (as many rounds as possible in a window); "cap" is a time limit on NON-AMRAP work. Our model encodes an AMRAP as `repetition.kind = "timeCap"`, but the shared `formatRepetitionLabel` renders it `cap 20’` — domain-wrong. The projection relabels it to `AMRAP 20’` (`structureLabel` in `format-legacy-schema.ts`; the cross-cutting `composition.cap` field keeps "cap", correct). A schema whose `header` is the leading token of the structure label (his bare `AMRAP`) collapses to the label (`AMRAP 20’`) — no `AMRAP · AMRAP` double, no lost window.
- **FOLLOW-UP (owner to ratify — athlete-facing):** the SAME `cap`→`AMRAP` correction belongs in the shared `@repo/contracts/lms/composition` formatter (+ the byte-dup `apps/platform/.../lib/format-composition-summary.ts`), because it also drives the athlete-session view, the records-view scheme subline, and the plan-editor composition tag — all of which currently mislabel an AMRAP as `cap`. Deferred out of this projection-only PR because it changes athlete-facing UI and wants its own ratification. → `deferred.md` (MP-14).
- `composition.repetition.kind = count` → "N **sets**" vs "N **rounds**": Денys uses both (strength → sets, metcon → rounds). Resolution: prefer his verbatim `header` (he disambiguates himself); the composition-summary fallback (only the 7 headerless schemas) defaults to "rounds", trivially corrected if it reads wrong at the gate.

---

## v3 — structure-faithful (2026-06-27)

**Status:** RATIFIED (owner, 2026-06-27; `/feature` full, PR `feat/mobile-publish-structure`). Drives **D-17**. §1–9 above are v2 (D-13). v2 fixed the per-row flatten + the Schema structural-layer drop (`header`/`composition`/`intensity`); v3 fixes the three remaining STRUCTURE losses — every composition kind, parallel tracks (`SchemaGroup`), and grouped rows (`RowGroup`). Projection-only (no schema/migration/contract/legacy change, §7).

### v3.1 — Why (3 root causes, verified in code + against live prod 2026-06-27, read-only)

The v2 assembler still drops three classes of structure. All three live in `projection/{project-day.ts, format-legacy-schema.ts}`.

- **RC-1 — `count` repetition (rounds/sets) dropped when a header is present.** `resolveHeaderBase` appended the composition label only when `repetitionKind ∈ STRUCTURE_APPEND_KINDS = {timeCap, cadence, interval, ladder}` — `count` was excluded. So a schema with BOTH a `header` AND `repetition.kind === "count"` lost its "N rounds" label; only the bare header survived. Prod evidence: `BSS DROP COMPLEX` (`count:3` → "3 rounds" lost), `STRENGTH ENDURANCE` (`count:4` + rest → "4 rounds" lost), plus `BASIC`/`PUMP SESSION`/`SHOULDERS`/`legs`/… — ≈100% of strength/successory blocks. (Headerless `count` already rendered the label via the `header === ""` branch; the bug was specifically header-present + `count`.)
- **RC-2 — `SchemaGroup` (parallel tracks) ignored entirely.** `projectBlock` iterated `block.schemas` flat and never called `buildBlockItems(block.schemas, block.groups)`. Schemas sharing a `groupId` rendered as independent flat entries; the group + its `interleaveOrder` vanished. Prod evidence: Jerkub's week-2 metcon — two `fran` schemas share one `groupId` (`interleaveOrder:"track_by_track"`), rendered as two unrelated blocks.
- **RC-3 — `RowGroup` (grouped rows + notes-labels) ignored entirely.** `buildSchemaEntry` mapped `schema.rows` flat and never called `buildRowItems(schema.rows, schema.rowGroups)`. Денys puts his SEPARATORS in `rowGroup.notes[0]` (`super-set`, `AMRAP in remaining time`, `1st round:`/`2nd round:`/`3rd round:`) — all dropped, grouped rows flattened into one canvas.

(RC-4 — labels — verified, no dropped surface: `block.labels[0]` is parity-consistent with the platform athlete view (`build-session-detail.ts` uses the same `labels[0]?.name`); `schema.label` is a derived `CompositionLabel` classification enum, not user-authored free text. Nothing to recover. Folding 2nd+ labels would DIVERGE from the platform view — a platform-wide change, out of this projection-only scope.)

### v3.2 — The fix

Reuse the platform's own SSOT groupers — the EXACT functions `endpoints/lms/session-detail/build-session-detail.ts` walks to render the athlete view — so published text and the platform athlete view group identically (zero drift; the D-13 element-formatter-SSOT principle, extended to grouping):

- `buildBlockItems(schemas, groups)` from `@repo/contracts/lms/schema-group` → `BlockItem = {kind:"schema",schema} | {kind:"group",group,members}`.
- `buildRowItems(rows, rowGroups)` from `@repo/contracts/lms/row-group` → `RowItem = {kind:"row",row} | {kind:"group",group,members}`.

`projectBlock` now walks `buildBlockItems(...)` and `.flatMap`s each `BlockItem` to one-or-more `exercises[]` entries (`renderBlockItem`); `buildSchemaEntry` now walks `buildRowItems(...)` (`buildBodyLines`), emitting a label line per named row-group. **RC-1 is a one-token fix:** add `"count"` to `STRUCTURE_APPEND_KINDS` (now `{count, timeCap, cadence, interval, ladder}`) — **KEEPING the `.has()` gate** so `once` (literal `"once"` from `formatRepetitionLabel`) and `benchmark` stay excluded; `count` then appends exactly like every structured kind. Element formatters stay shared & untouched; only the legacy-text ASSEMBLY changes. Output type `LegacyDailyProgram` is unchanged — only the content + count of `exercises[]` strings change. New file `projection/format-schema-group.ts` holds the wrapper formatter (one-formatter-per-file convention).

**Byte-identical guarantee (the prime risk — Денys is LIVE in prod):** for an ungrouped block/schema (today's 100% reality) the grouper walk emits the identical order to the old flat `.map()` — the Prisma include orders schemas/rows `order: asc` (`day-include.ts`, `schema-body-include.ts`) and the groupers sort by the same `order`, with `@@unique([blockId, order])` / `([schemaId, order])` ruling out ties. Adding `"count"` to the set is additive (cannot change `.has()` for the other kinds). The ONLY outputs that change are the three bugged classes — structural, not luck (Review + QA independently confirmed).

### v3.3 — Ratified target format (A–D)

#### A. Composition NEVER dropped (RC-1)

Header line = `header` joined to the composition structure label via `NAME_LABEL_SEPARATOR` (`·`), suffixed `:`. Appended for ALL structured repetition kinds incl. `count`, keeping the existing "header already conveys the label → don't duplicate" (`headerConveysLabel`) collapse.

```
before:  BSS DROP COMPLEX:
after:   BSS DROP COMPLEX · 3 rounds:
```

Already-working kinds (ladder/EMOM/AMRAP/interval) stay byte-identical where the header conveys them.

#### B. Row-group with a notes label (RC-3)

```
before:  10 cal Echo Bike          after:  10 cal Echo Bike
         5 reps Inchworm                   super-set:
         5 reps Scap Pull-ups              5 reps Inchworm
         30 sec Wall Squat Hold            5 reps Scap Pull-ups
                                           30 sec Wall Squat Hold
```

Ungrouped rows before/after the group keep their position (order from `buildRowItems`). Group label line = `normalizeHeader(rowGroup.notes[0]) + ":"`. Unnamed group → a blank-line separator (no synthetic "ROW GROUP" header — that's platform-chip language).

#### C. Row-groups as rounds (real example, RC-3)

```
after:   STRENGTH ENDURANCE | 2 sets | 1 set is: | EFFORT 80%:

         1st round:
         18 reps Cal row
         9 reps Squat snatch [ RX M:45 F:30 / SC M:35 F:20 ]
         9 reps Pull-ups
         2nd round:
         14 reps Cal row ...
         | 5 min rest in between sets |
```

(Trailing rest line from `composition.rest` unchanged.) This schema is `once` — three DIFFERENT rep schemes (18/9/9 → 14/7/7 → 10/5/5) structurally REQUIRE three distinct row-groups, which a uniform `count:N` cannot express — so the composition layer emits NO label (`once ∉ STRUCTURE_APPEND_KINDS`); the row-group layer carries the round labels. No `· once`.

#### D. Schema-group wrapper (RC-2)

A `{kind:"group"}` BlockItem renders a wrapper line, then each member schema rendered normally, members separated by a blank line. Wrapper wording by `interleaveOrder` (ratified default — Денys has no existing house-style token):

- `round_by_round` → `"N tracks — alternating rounds:"`
- `track_by_track` → `"N tracks — one after another:"`

(N = member count.)

```
after:   2 tracks — one after another:

         fran · ladder 21-15-9 | cap 5’ | benchmark time:
         Thrusters [ M:43 F:30 ]
         Pull-ups

         fran · ladder 21-15-9 | cap 5’ | benchmark time:
         ...
```

The wrapper line is its OWN `exercises[]` entry; each member schema is its own entry after it (D-13 §5 one-schema-one-entry preserved). A group whose every member renders empty contributes nothing (no orphan wrapper).

### v3.4 — Design decisions D-1..D-5 (RFC-local record; the initiative-level ratification is D-17)

These are the v3 RFC's internal decision record — a distinct namespace from the initiative D-1..D-17. Each is reversible.

- **D-1 — separator is `·` (NAME_LABEL_SEPARATOR), not `|`.** The shipped code + locked tests already join header↔label with `·` (`fran · ladder 21-15-9 | cap 5’ | benchmark time:`, `Part 2 · EMOM 12’×10:`); `count` flows through the same `resolveHeaderBase` path → `BSS DROP COMPLEX · 3 rounds:`. The brief's `BSS DROP COMPLEX | 3 rounds` (pipe) was ILLUSTRATIVE; code wins (manifesto 2.11). The `|` (`LABEL_SEPARATOR`) stays the separator between the header-base and cross-cutting extras (cap/benchmark/intensity), exactly as today. Reversible: one constant.
- **D-2 — `composition` label and `rowGroup.notes` labels are orthogonal layers; no double-counting; `once` excluded from the append.** The composition append is driven PURELY by `composition`; row-group label lines PURELY by `rowGroup.notes`. No logic reads one to decide the other — no "suppress rounds if row-groups exist" special case. (a) `count:3` + header, no row-groups → `· 3 rounds` (RC-1 fix). (b) `once` + row-groups labelled `1st/2nd/3rd round:` → the row-group layer emits the rounds; the composition layer emits NOTHING (`once ∉ STRUCTURE_APPEND_KINDS`; `formatRepetitionLabel` returns the literal `"once"` → `STRENGTH ENDURANCE · once` would be noise). A `count:N`-AND-round-labelled-row-groups shape is semantically contradictory (uniform count vs per-round variation) and does not occur. Reversible: one set literal.
- **D-3 — schema-group entry shape: wrapper line is its own `exercises[]` entry; one entry per member.** A `{kind:"group"}` BlockItem contributes `[wrapperLine, ...memberEntries]`; if every member renders empty it contributes nothing. Preserves the D-13 §5 one-schema-one-entry invariant; the §D blank-line separation is emergent from the consumer rendering each array element (no manual `\n\n`); reuses `buildSchemaEntry` verbatim. Rejected: one combined entry per group (breaks the invariant, forces manual member separators). Reversible: local to `renderBlockItem`.
- **D-4 — reuse the SSOT groupers (no hand-roll).** Grouping/ordering comes from `buildBlockItems`/`buildRowItems`; zero drift from `build-session-detail.ts`; pure, already prod-tested. Rejected: hand-roll (duplicates bucket+order+orphan logic, drifts from the SSOT — a parallel-invention anti-pattern). Two new `@repo/contracts/lms/*` imports, same direction the file already uses; the forbidden dep-cruiser edge is api-server `lms → coaching` (the reverse), so `dep:check` stays green.
- **D-5 — row-group label = `normalizeHeader(notes[0]) + ":"`; unnamed group = blank-line separator.** Reusing `normalizeHeader` (strip trailing `[\s:]+`) + `HEADER_SUFFIX` normalizes Денys's inconsistent notes (`super-set` no-colon vs `1st round:` colon) to a uniform colon-suffixed line. Unnamed group (`notes` null/empty) → a single LEADING blank line before its members when preceded by body content (no platform-chip header). Unnamed groups don't occur in current prod data — leading-blank-only is an unobserved edge, easy to flip at the gate (the asymmetry → MP-17). Reversible: local to `buildBodyLines`/`rowGroupLabel`.

### v3.5 — Mechanism alternatives (locked)

- **RC-1:** add `"count"` to the set (one-token diff; `once` stays excluded) — NOT drop the `.has()` gate entirely (would make `once` eligible → `STRENGTH ENDURANCE · once` noise, contradicting §C).
- **Grouping:** reuse the SSOT groupers — NOT hand-roll.
- **Schema-group entry:** wrapper-as-own-entry + one entry per member — NOT one combined `wrapper\n\nmember1\n\nmember2` entry.

### v3.6 — Constraints & idempotency (unchanged from D-13 §7/§8)

Projection-only; element formatters untouched; reuse `buildBlockItems`/`buildRowItems` (don't reimplement grouping). The new multiline structure changes the D-9 content-hash → a re-publish PUT-updates Денys's OWNED days (self-heal, D-9) and never clobbers his manually-authored days (conflict-guard, D-4). No migration of already-published rows; the legacy round-trip is byte-exact (validated 2026-06-26, §8). The owner render-and-show gate (§8) still governs the prod re-publish — the PR merges on green tests; re-publishing a real Денys week through v3 (text diff vs live) is a separate owner action.

### v3.7 — Shipped

`feat/mobile-publish-structure` — feat `c6e18657` (project schema-groups, row-groups, all composition types) · test `64731cf4` (cover structure-faithful projection) · fix `78ce4c15` (match group track count to rendered tracks; guard empty row-group label = QA-001/QA-002). 5 files, all under `projection/` (+ new `format-schema-group.ts`); isolated projection suite **38/38 green** (`SKIP_ENV_VALIDATION=1 npx vitest run …/projection/`); `check-types`/`lint` clean; `dep:check` direction safe. **Review APPROVE** (0 CRITICAL / 0 WARNING) · **QA B** (0 CRITICAL, 4 WARNING — QA-001/QA-002 fixed; QA-003/QA-004 → carry-forwards). Tests rewritten: `projection/{parity,project-day}.test.ts` had asserted the structure DROP as correct (the D-13 §2 stance); they now assert the structured output — this **SUPERSEDES the D-13 §2 "structure-drop is correct" stance**. Carry-forwards: MP-17 (unnamed-group blank-line asymmetry, owner KEPT the D-5 default at Gate B), MP-18 (`count` digit-collision collapse — non-issue), MP-19 (headerless `once:` — pre-existing), MP-20 (`notes[0]`-only — by-design SSOT parity) → `deferred.md`.
