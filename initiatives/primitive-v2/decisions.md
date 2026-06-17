# primitive-v2 — decisions

D-numbered ratified decisions. Step-level calls that don't merit a full ADR live here; cross-initiative architecture calls go to `docs/adr/`. **Promote here at every gate** — a decision that lives only in gitignored `.feature-dev/` or an external chat is not durable. This file is the SSOT for "why."

**Status legend:** `RATIFIED` (decided + acted) · `OPEN` (awaiting user ratification — do not execute past it) · `SUPERSEDED` (replaced — kept for the trail).

Each re-open here SUPERSEDES a session-primitive original WITH the timed-test rationale (the legitimacy: the kills were corpus-FLOOR calls; the timed-test is harder, group-programming evidence — `charter.md`).

## Index

| ID                         | Topic                                                                | Status   | Supersedes (session-primitive)           |
| -------------------------- | -------------------------------------------------------------------- | -------- | ---------------------------------------- |
| D-V2-INTENSITY-TRINITY     | intensity scoped block/schema/row, render-time overlay               | RATIFIED | D-FLOORS (intensity part)                |
| D-V2-ROW-REST              | rest also a per-row carrier (by scope), alongside the schema rest    | RATIFIED | D-PLAQUE (ONE-rest, scoped re-open)      |
| D-V2-CAP-AXIS              | time cap = optional cross-cutting axis on composition; 6 kinds stay  | RATIFIED | — (sacred-adjacent; algebra preserved)   |
| D-V2-INTERVAL-UNIT         | interval work/off carry a unit (sec/min)                             | RATIFIED | — (extends the interval kind)            |
| D-V2-PROFILE-NESTING       | byProfile flat → 1–2 axes + cells; render/author-serving (no reader) | RATIFIED | — (extends D-LOAD-FINAL byProfile)       |
| D-V2-EXEC-DEFER-HOLD       | #11 score + #20 inter-schema rest stay deferred; no inert field      | RATIFIED | upholds D-EXEC-DEFER                     |
| D-V2-ONE-WAVE              | the whole reshape ships in ONE /feature; no floor-split              | RATIFIED | mirrors DR-W4-5 ONE-WAVE                 |
| D-V2-COMPOSE-ROW-UNCHANGED | composeRowSchema/projectSchemaRow carry NEITHER intensity nor rest   | RATIFIED | — (Gate-A; resolves a design open-check) |

---

### D-V2-INTENSITY-TRINITY — intensity is scoped block/schema/row with render-time overlay

- **Status:** RATIFIED (2026-06-17, owner "ОК х5"). **Supersedes** session-primitive `D-FLOORS` (the intensity-to-schema-only part + the "row-level intensity override removed" consequence).
- **Decision.** The one `intensitySchema` VO (unchanged) is carried at THREE levels — `Block.intensity`, `Schema.intensity` (exists), `SchemaRow.intensity`. Each level stores its OWN value independently. The **render** computes an effective intensity per node as a dimension-wise merge with precedence **row > schema > block** (each of the 5 dimensions resolves to the nearest level that set it). NO storage promotion; the overlay is render-time, zero storage cost. Partial (dimension-wise) overlay, not full-replace.
- **Rationale.** `primitive-spec.md` Grid B `intensity` ALREADY specified "scopes block/schema/row; partial-overlay inheritance is render-time, no storage cost" — and `D-FLOORS`, the same day, cut it to schema-only. The spec contradicted itself. `D-FLOORS` feared a block PROMOTING settings onto every child (forbidding per-track variation) — but the timed-test surfaced the INVERSE need: each level carrying its OWN value (a row needs its own RPE: "5×5 @75% RPE 8"; a block its own effort: "5 rounds @85%"). Overlay-with-override is not promotion — the nearest level wins, no level is forced. This restores Grid B's stated intent; `D-FLOORS` over-corrected on corpus-floor evidence. Channel-Т (the render already specially-renders intensity via `formatIntensityChips`; the new carriers render immediately — not inert).
- **Links.** `reshape-design.md` §2.1; `e2e-findings.md` #3/#16; spec Grid B `intensity` line + `D-FLOORS` (the contradiction).

### D-V2-ROW-REST — rest is also a per-row carrier, by scope, alongside the schema rest

- **Status:** RATIFIED (2026-06-17, owner "ОК х5"). **Supersedes** session-primitive `D-PLAQUE`'s ONE-rest-per-schema clause — by SCOPE, narrowly.
- **Decision.** `restSpecSchema` (unchanged) is carried on `SchemaRow.rest` too. Schema rest stays as the round-rest of the whole schema; row rest is the per-exercise rest (between this movement's sets) — **additive**, a different scope. Row rest reuses the full `restSpecSchema`; the editor accents `between_sets` on a row but scope is not over-validated (render/coach meaning).
- **Rationale.** The leaf already carries load / reps / tempo / side / sets — but rest and intensity were stuck at the schema. Asymmetry. The owner's #3 ("rest & RPE not addable on a row") is exactly that: the row should hold the full movement prescription. This is NOT the thing D-PLAQUE rejected — that was a SECOND rest on ONE schema ("второго отдыха в схеме сейчас не делаем", multi-rest). Row rest is a different carrier/scope (per-exercise), not a second schema-rest. When a strength block holds several movements (squat rest 3', bench rest 90"), each needs its own rest without splitting into artificial single-row schemas. Channel-Т (renders as the rest strip immediately).
- **Links.** `reshape-design.md` §2.2; `e2e-findings.md` #3; `D-PLAQUE` (ONE-rest clause).

### D-V2-CAP-AXIS — time cap is an optional cross-cutting axis on composition; the 6 repetition kinds stay a set

- **Status:** RATIFIED (2026-06-17, owner "ОК х5"; owner-directed in GAP-1). Sacred-adjacent — the one call that touches the algebra's neighbourhood; resolved WITHOUT adding a kind.
- **Decision.** `compositionSchema` gains `cap: timeCapSchema.optional()` — a ceiling over ANY repetition kind. The 6 `repetitionAxisSchema` kinds (`once/count/ladder/timeCap/cadence/interval`) are **untouched**. The `timeCap` KIND stays for AMRAP / pure time-bound ("the 15 minutes IS the scheme"); `composition.cap` is the orthogonal ceiling ("21-15-9 capped at 12 min"). `cap` when `kind === "timeCap"` is redundant-but-valid — the UI hides the cap toggle there; NO reject `superRefine` (cost > value, not an invariant violation).
- **Rationale.** Owner in `e2e-evil-corpus.md` GAP-1, verbatim: "make cap a separate optional axis on the composition, orthogonal to repetition.kind" + "a time cap must be an optional setting on every repetition kind." The discriminated union made `ladder` XOR `timeCap` — a fixed ladder FOR TIME with a safety cap was unexpressible as a typed field. Cap-as-orthogonal preserves the sacred 6-kind algebra (the charter red line — "#4 does NOT add a 7th kind; it asks whether timeCap should ALSO be a cross-cutting cap") while making "FOR TIME (12 min cap)" typed instead of a note. Channel-Т. Lives inside the existing `Schema.composition` Json — no Prisma column, `mapToSchema` parses it for free.
- **Links.** `reshape-design.md` §2.3; `e2e-findings.md` #4 + GAP-1; charter "Sacred" §; spec Grid C `repetition`.

### D-V2-INTERVAL-UNIT — interval work/off carry a unit (sec/min)

- **Status:** RATIFIED (2026-06-17, owner "ОК х5"). Extends the `interval` kind; no re-open.
- **Decision.** The `interval` variant's `workMin`/`offMin` (int) become `work`/`off` = `{value, unit: sec|min}` (`INTERVAL_DURATION_UNITS = ["sec","min"]`; `value` is positive/nonnegative, NOT int — `:20 sec`; `off` may be 0). `count` unchanged. Mirrors the existing `{value, unit}` duration pattern (`restSpecSchema.duration`, `timeCapSchema`).
- **Rationale.** Tabata `8 × :20 on / :10 off` is seconds; `z.number().int()` (field min 1) made it unbuildable ("нельзя писать <1" — GAP-2). The unit is the house pattern for sub-minute durations. Lives inside `Schema.composition` Json — no Prisma column. Channel-Т.
- **Links.** `reshape-design.md` §2.4; `e2e-findings.md` #6 + GAP-2.

### D-V2-PROFILE-NESTING — byProfile becomes 1–2 axes + cells; serves render/authoring (no live reader yet)

- **Status:** RATIFIED (2026-06-17, owner "ОК х5", incl. my "max 2 axes" rec). Extends `D-LOAD-FINAL`'s byProfile; D-5 flagged.
- **Decision.** `load.byProfile` goes from flat `entries: {label,kg}[]` to `{ axes: {name, values[]}[] (1–2), cells: {coords[], kg}[] }`. `coords` = one value per axis in order; `cells` cover the cartesian product (`superRefine`). 1 axis → list; 2 axes → grid. **Max 2 axes (ratified — flagged explicitly so it can be caught at prompt review if N was meant).** `db:reset` world — old flat shape drops, no data migration.
- **Rationale.** Owner #17: combining "works in the model but renders garbled" (4 flat entries "RX (M):9 / …"); no true nesting. **Honest D-5 note:** the byProfile resolver (athlete-context weight pick) is Phase-3 (D-LOAD-FINAL) — nothing machine-READS these weights today. So nesting serves AUTHORING (set axes, fill a grid, vs hand-typing "RX (M)") + RENDER (grid vs garble), NOT a new machine-read projection. Legitimate under D-5 because byProfile is ALREADY typed + rendered — this is doing the existing axis right, not an inert field for an absent projection (contrast the killed `window`). The Phase-3 resolver will read this structured shape directly.
- **Links.** `reshape-design.md` §2.5; `e2e-findings.md` #17; `D-LOAD-FINAL` byProfile.

### D-V2-EXEC-DEFER-HOLD — #11 (score) and #20 (inter-schema rest) stay deferred; no inert field

- **Status:** RATIFIED (2026-06-17, owner "ОК х5"). Upholds `D-EXEC-DEFER`.
- **Decision.** #11 (schema score / "last 3 min @90%+ effort") and #20 (rest BETWEEN schemas) are NOT built in primitive-v2. Both stay coach notes; typed FRESH against the Phase-4 executor (re-introduce-fresh, ADR-0038). NO inert boolean/field now.
- **Rationale.** #11 is scoring/time-window semantics — no engine reads it (charter non-goal). #20 decomposes: "rest 2 min between rounds" is ALREADY `schema.rest {between_rounds}` (expressible today); the remnant ":20 between the two ladders" is a group-track transition ("straight into" family) — execution semantics, and touching it as a sibling carrier would brush D-2 (siblings don't know each other; the box links them). Both are the execution layer, deferred whole — not holes in the primitive. A stored field awaiting a reader is the inert-surface disease the drains removed (ADR-0039 `window`).
- **Links.** `reshape-design.md` §3.7–3.8; `deferred.md` EXEC-11 / EXEC-20; `D-EXEC-DEFER`.

### D-V2-ONE-WAVE — the whole reshape ships in ONE /feature (no floor-split)

- **Status:** RATIFIED (2026-06-17, owner-directed: "всё делаем одним прогоном, не разбиваем на волны").
- **Decision.** Contracts + Prisma (3 new columns: `SchemaRow.intensity`, `SchemaRow.rest`, `Block.intensity`) + mappers + api-server guards + platform editor remap + spec re-freeze ship in ONE `/feature` (full). No row→block→schema→cross floor-split. `db:reset` world, no migration files, aggressive bridge-free — only the final pushed tree green (intermediate RED fine).
- **Rationale.** The plan's floor-split was a sequencing default, not a constraint. Three of five changes ride inside existing Json (cap/interval in `composition`, byProfile in `load`) and the three editors already exist (`IntensityFields`/`RestSpecFields`/`TimeCapFields`) — the wave is a coherent leaf reshape on ONE migration, exactly the `DR-W4-5 ONE-WAVE` precedent. Splitting buys no safety (house aggressive-migration tolerates staged-green) and burns ≥1 `/feature` budget per session needlessly.
- **Links.** `reshape-design.md` §1; `plan.md`; `DR-W4-5`.

### D-V2-COMPOSE-ROW-UNCHANGED — composeRowSchema + projectSchemaRow carry NEITHER intensity nor rest

- **Status:** RATIFIED (2026-06-17, owner at Gate A). Resolves the design's open "check `composeRowSchema`" note (`reshape-design.md` §2.1/§2.2).
- **Decision.** The compose-tree VALIDATION projection — `composeRowSchema` (`composition.schema.ts`) + `projectSchemaRow` (`compose-projection.mapper.ts`) — is LEFT UNCHANGED; it does NOT gain `intensity`/`rest`.
- **Rationale.** `composeRowSchema` feeds only the compose-tree validation projection (`assertComposeTreeValid`/`ForWrite`), NOT a write path — rows are written via `createSchemaRowSchema`/`updateSchemaRowSchema`. `intensity`/`rest` are leaf-PRESCRIPTION (sibling Json columns on `SchemaRow`), not composition-STRUCTURE. Adding them would force a parallel `projectSchemaRow` change (the `.strict()` projection would otherwise be missing required keys) for zero functional benefit. Contrast cap/interval, which ARE composition-structure and DO thread through the compose/draft path.
- **Links.** `reshape-design.md` §2.1; Gate-A; `plan.md` Risks #1.

## Implementation notes (2026-06-17 reshape wave)

- **byProfile axis values are unique within an axis** (extends D-V2-PROFILE-NESTING). A QA pass (QA-001) found a value rename could create two identical values in one axis → duplicate coords surfaced only by the cell-uniqueness check, with a misleading message. The byProfile `superRefine` now rejects duplicate axis values with a coach-grade message. Semantically obvious (no two "RX" levels); the contract is the backstop, not editor-side prevention.
- **Doc-fidelity correction:** `reshape-design.md` §2.1 + the founding research cited `isStructurallyParallel` as the "thread-once" precedent for the intensity overlay. That symbol does NOT exist in the repo (grep-confirmed at implement time). The one-merge-helper rule was honored regardless — `resolveIntensity` (`apps/platform/.../lib/resolve-intensity.ts`) is the single render-time merge. Don't chase the phantom in future work.
- **Latent fix:** the `timeCap` repetition KIND now renders a `sec`-unit cap as `Ns` (was always `N’`, wrong for seconds) — folded through the same `capLabel` as the new `composition.cap`.
- The 8 research drift items the design's §2 touch-lists undercounted (interval ~16 files, `deep-clone`, `coach-row-issue`, overlay prop-drilling, fixture sweep) are detailed in `journal.md` (2026-06-17 reshape entry).
- **QA-002/003 follow-ups** (`IntensityFields` can't author `effortPercent` range / `numericPace`) → `deferred.md` (pre-existing, out of this wave's ratified scope).
