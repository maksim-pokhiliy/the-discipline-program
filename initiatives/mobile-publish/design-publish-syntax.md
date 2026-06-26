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

## 9. Vocabulary rules & a follow-up

- **`timeCap` repetition = AMRAP, never "cap" (owner-ratified 2026-06-26).** In CrossFit "AMRAP" names the schema TYPE (as many rounds as possible in a window); "cap" is a time limit on NON-AMRAP work. Our model encodes an AMRAP as `repetition.kind = "timeCap"`, but the shared `formatRepetitionLabel` renders it `cap 20’` — domain-wrong. The projection relabels it to `AMRAP 20’` (`structureLabel` in `format-legacy-schema.ts`; the cross-cutting `composition.cap` field keeps "cap", correct). A schema whose `header` is the leading token of the structure label (his bare `AMRAP`) collapses to the label (`AMRAP 20’`) — no `AMRAP · AMRAP` double, no lost window.
- **FOLLOW-UP (owner to ratify — athlete-facing):** the SAME `cap`→`AMRAP` correction belongs in the shared `@repo/contracts/lms/composition` formatter (+ the byte-dup `apps/platform/.../lib/format-composition-summary.ts`), because it also drives the athlete-session view, the records-view scheme subline, and the plan-editor composition tag — all of which currently mislabel an AMRAP as `cap`. Deferred out of this projection-only PR because it changes athlete-facing UI and wants its own ratification. → `deferred.md` (MP-14).
- `composition.repetition.kind = count` → "N **sets**" vs "N **rounds**": Денys uses both (strength → sets, metcon → rounds). Resolution: prefer his verbatim `header` (he disambiguates himself); the composition-summary fallback (only the 7 headerless schemas) defaults to "rounds", trivially corrected if it reads wrong at the gate.
