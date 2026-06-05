# compose-hardening — audit findings (state-of-the-feature, 2026-06-05)

**Type:** analytical artifact (read + synthesis, no code changes). The evidentiary base for `deferred.md` + `plan.md`. Method = an independent fan-out over the merged compose feature, deliberately **re-verifying** `plan-editor-compose/theory-vs-code-reconciliation.md` rather than trusting it.

## Method

- **Trigger.** Owner suspicion mid-UX-session: "рванул полировать UX, а в коде, может, бардак и непонятны границы — кто за что отвечает."
- **13 agents**, one `Workflow` run (`wf_fc0a986c-5ae`; 588s; 514 tool-uses; 869k subagent tokens): **6 layer-mappers** (contract · prisma/DB · api-server · seed · platform-read · platform-authoring) → ownership + gaps; **7 adversarial verifiers** each trying to _refute_ one drift/gap claim on live code.
- **Synthesis** by the orchestrator, verify-not-trust applied to both the agents and the prior reconciliation. Every finding below carries a verbatim `file:line`.

## Bottom line

**Model / contract / persistence = production-grade, zero drift (independently re-confirmed). Authoring surface = half-built.** "Bardak" is **not** supported; "UX-polish premature" **is** — but the cause is a _readiness boundary_ (create-only authoring + ⅓-unauthorable algebra), not messy code. Polishing a card you cannot re-open to edit, into which you cannot enter half the real training forms, is polishing a facade with no stairs to the second floor. The owner's instinct to stop was right; the reason he gave ("bardak") was wrong.

### Verifier verdicts

| #   | Claim                                                                           | Verdict                                                                                                                               |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| V1  | archetype taxonomy fully excised from all live layers                           | **confirmed**                                                                                                                         |
| V2  | `scoring` axis present-but-inert (zero evaluators; 3 guard tests live)          | **confirmed**                                                                                                                         |
| V3  | conditional-scoring authoring absent in platform UI                             | **confirmed**                                                                                                                         |
| V4  | StagedProgram/SlotSpec have no row-level home; 0 seed instances; wave flattened | **confirmed** (harder — they are zombie types, 0 consumers anywhere)                                                                  |
| V5  | EMOM `MIN n` wired read-side only, not the drawer canvas                        | **confirmed**                                                                                                                         |
| V6  | editing axes of an existing composition has no UI entry (create-only)           | **confirmed** (`blocker`)                                                                                                             |
| V7  | Gauntlet Block C not assembled end-to-end; `INNER_LADDER_MARKER` 0 in seed      | **partial** (parallel-ladders half IS seeded via `container.repetition`, block-037; the AMRAP-tail combo + marker-via-row are absent) |

## Carry-over map — what migrates from `plan-editor-compose/deferred.md`

These live OPEN obligations are **re-homed** here (this initiative now owns them); the old file keeps the trail.

- `DEFER-001` (program/slot row-level home) → **T0-2**.
- `QA-106` (depth-2 projector truncation) → **T1-3**.
- `QA-108` (no DB-level ladder enforcement) → **T3-DB-2**.
- `QA-untilrec` (`until_recovery` not pinned `value:1`) → **T3-CT-2**.
- `REVIEW-005` residual (two divergent axis formatters) → **T3-RD-2**.
- `coverage-matrix.md` stale/lying → **T3-SEED-1**.
- `ADR-0023` (`fast-check` reconcile) → **T3-MISC-1**.
- reconciliation §(c) C1 conditional-scoring authoring-absent → **V3 / T2-2 + T0** (presentation), execution stays ph.5.

## Findings by tier (evidence)

Tags: **NEW** = surfaced by this fan-out, not in the prior reconciliation. **CARRY** = already a live obligation, re-homed.

### Tier 0 — structural authoring (gates the rest)

- **T0-1 — Create-only: no edit path for an existing block's axes.** `blocker`. The drawer always seeds `emptyBlockProgram` (`compose-editor-drawer.tsx:80`); `ComposeEditorDrawerProps` has no `schema`/`composition` prop (`:65-71`); the only converter is `composeRootToCreatePlan` (no inverse); the draft `ComposeContainer` carries a synthetic `NodeId`, never a `schemaId` (`compose-tree.types.ts:49`); repo-wide grep for `compositionToContainer|toComposeProgram|fromComposition|hydrateCompose` = empty. To change `count:3→5` a coach deletes + recreates the whole block. This is a missing **data-mapping layer**, not a missing button. (Re-confirms reconciliation §d `deriveMinuteView`-adjacent; the create-only nature was newly load-bearing here.)
- **T0-2 — program/slot unauthorable (CARRY `DEFER-001`).** `StagedProgram`/`SlotSpec` Zod schemas exist + are unit-tested but are **zombie types — zero consumers anywhere** (`staged-program.ts`, `cap-spec.ts:40` exported via `_shared/index.ts:13`; `schemaRowPayloadSchema` has 9 variants, none carries program; no Prisma column; no form in `row-payload-form-registry.tsx`; 0 seed instances). Wave/cluster/drop-set/named-program/EMOM-slot collapse to a flat row on input: snatch wave "70/80/90" seeds as ONE row 70%×3, stages 80/90 **gone** (`phase-7-blocks.ts:141-169`); pull-up cluster 5×(3+3+3) → one row + one rest (`:173-202`); drop-set → 2 flat rows (`week-2-monday-strength.ts:23-66`). `coverage-matrix.md:325-331` _claims_ these are covered — it lies.

### Tier 1 — correctness (silent bugs, not cosmetics)

- **T1-1 — composition guard asymmetric: update validates, create does not. NEW.** `major`. **Verified at source** (`admin.ts:108-162`): the **create** path (`:121-131`) writes `composition: marshalNullableJson(data.composition)` with **no composition validation at all** — no `assertCompositionUpdateValid`, hence no `assertArrangementRefsInScope`. The **update** path runs it (`:157-158`, `if (data.composition !== undefined) await assertCompositionUpdateValid(...)`). (Ladder-collision is covered separately, on schema-**row** create — `assertComposeTreeValidForWrite`, `schema-row/admin.ts` — not here; so the create hole is specifically the **arrangement-ref scope/existence** check.) Consequence: a `Schema` created directly with `arrangement: parallel/superset` whose `childSchemaId`/`rowId` is foreign persists unchecked. **Reachability nuance:** the normal S2 authoring cascade writes arrangement via a _phase-2 update_ (`use-persist-compose-cascade.ts` `wireArrangements`), which IS guarded — so this is an API-level asymmetry / poison-intermediate class (cf. D-10.4-S1-INT), not a normal-UI path today. Still: the guard reads as accidentally one-sided.
- **T1-2 — `mapScoring` drops `condition` → silent data-loss path. NEW.** `major`. Platform draft `ScoringDirective` (`compose-tree.types.ts:39-45`) has no `condition`; `mapScoring` (`compose-to-create-requests.ts:82-98`) reconstructs `{kind}` only. Even if `condition` were added to the draft, the write-path would silently strip it before the contract. Needs a tripwire test pinning the invariant (or the full pass-through when conditional-authoring lands).
- **T1-3 — depth-2 projector truncation (CARRY `QA-106`).** `minor` (latent). `buildSchemaWithBody` hard-codes `subSchemas:[]` at level 2 (`schema.mapper.ts:38-42`); both the write-guard and the read-path `assertComposeTreeValid` reuse it → a ladder/marker collision at depth-3 evades both silently. Safe while nesting is shallow; a guard or explicit depth-≤2 assert is owed before nesting deepens.

### Tier 2 — read honesty / authoring UX

- **T2-1 — `scoring` rendered as an active fact though INERT. NEW.** `major`. `format-composition-summary.ts:54-55` unconditionally pushes `scoring.kind` into the card caption — no dashed/opacity/"inert" cue. A coach sees "AMRAP" next to "5 rounds" as if both execute; once ph.5 lands, stored-vs-computed is indistinguishable. Decide: visual draft/inert signal, or hide scoring in the editor until ph.5.
- **T2-2 — `parallel.interleaveOrder` / `superset.pairs` / `scoring.condition` never rendered. NEW.** `major`. `format-composition-summary.ts:50-52` collapses any non-ordered arrangement to the bare word "parallel"/"superset"; `round_by_round` vs `athlete_by_athlete` read identically; superset rows aren't visually grouped; `condition` (`appliesToRounds`) is invisible.
- **T2-3 — EMOM `MIN n` markers not in the drawer canvas (V5; owner snag #1).** `minor`. `deriveMinuteView` has exactly two call-sites, both read-side (`schema-row-list.tsx:27,61`); the authoring `compose-container-card.tsx` renders only `formatAxesSummary` (shows `EMOM 1'×3` aggregate, not per-row MIN). Pure wiring gap — same data is in the draft tree. Cheap; fits coach-daily-UX.
- **T2-4 — ladder-collision reject is late (on persist, not on input; owner snag #2).** `minor`. Free authoring; reject arrives at `compositionSchema.safeParse` during `composeRootToCreatePlan`. Consistent with the "free nest, reject at the boundary" philosophy but a UX paper-cut.
- **T2-5 — axis fields silently store malformed input (owner snag #3).** `minor`. `axis-fields-safety.test.tsx` pins it; validation lives at the contract-zod persist boundary, not field-level UI (was deferred to 10.2 zod home). The UI-level affordance is still absent.
- **T2-6 — demote-hint with no demote button (owner snag #4).** `minor`. `compose-container-inspector.tsx:85-93` renders the hint as an `Alert`; `compose-node-actions.tsx` has inspect/duplicate/delete, no promote/demote, no handler in `useComposeProgram`. The hint advertises an action that does not exist — misleading.
- **T2-7 — `BlockEditorModal` "Edit block" edits meta, not structure. NEW (UX).** `minor`. `block-editor-modal.tsx:36-46` form = `{intensity,timeCap,notes}` (Block-level cascade), never the axes (which live on `Schema.composition`). A coach hunting "edit block" finds a modal that cannot fix a wrong rep-scheme — systematic confusion. (Compounds T0-1.)

### Tier 3 — hygiene / debt

- **T3-CT-1 — zombie contract types.** `stagedProgramSchema`/`slotSpecSchema` exported + tested, 0 production consumers (see T0-2). Either wire (T0-2 resolution) or delete — the in-between reads as "the model supports this" when it does not.
- **T3-CT-2 — `until_recovery` not pinned `value:1` (CARRY `QA-untilrec`).** `cap-spec.test.ts:89` documents the DEC-4 footgun; any duration passes. Touches the FROZEN contract → Gate-A escalation.
- **T3-CT-3 — ladder-collision `superRefine` uses a string literal, not the enum const. NEW.** `composition.schema.ts:241` matches `"INNER_LADDER_MARKER"` by literal; a rowKind rename breaks the guard with no compiler catch.
- **T3-CT-4 — platform `RepetitionAxis` is 7/8 (no `range`). NEW.** `compose-tree.types.ts:17-24` omits `range`; `mapRepetition` has no `range` case; `axes-summary.ts` switch has no `range` branch (empty preview string). DB can hold range (via seed); UI can't author or preview it.
- **T3-DB-1 — `Schema.composition Json?` nullable, zero DB-level validation. NEW.** `schema.prisma:668`. The primary algebra carrier accepts NULL/malformed silently; downstream destructuring without a null-guard throws. Decide the stance (NOT NULL + `{}` default, or keep + document).
- **T3-DB-2 — no DB-level ladder-collision enforcement (CARRY `QA-108`).** `lms-checks.sql` has 4 constraints, none touch composition. App-layer-only; a guard bug / new write-path / TOCTOU persists corruption with no backstop. Consistent with project posture (INFO); long-term hardening.
- **T3-API-1 — `scoring-inert` SCAN_ROOTS incomplete. NEW.** `scoring-inert-consumers.test.ts:12-15` scans `mappers/lms` + `endpoints/lms/schema` but NOT `endpoints/lms/schema-row` — the most likely future home for a submit-result flow. The guard's name over-promises its coverage.
- **T3-API-2 — reorder is a non-atomic two-pass outside Serializable. NEW.** `schema/admin.ts:248-255` + `schema-row/admin.ts:269-276` batch negative-then-positive updates without `isolationLevel:Serializable` (contrast: create wraps it). Concurrent reorders can interleave. Low-probability single-coach.
- **T3-RD-1 — `formatSchemaHeader` empty for scoring-only composition. NEW.** Takes `formatCompositionSummary[0]`; a `{scoring:'amrap'}`-only composition (no repetition) yields `''` → a nameless card with no structural hint.
- **T3-RD-2 — two divergent axis formatters (CARRY `REVIEW-005`).** Read-side `format-composition-summary.ts` vs authoring `compose/lib/axes-summary.ts` — parallel `repetitionLabel`/`restLabel`, different input types (`Composition` vs `ComposeContainer`), authoring lost the `range` branch. Full dedup blocked until `compose-tree.types` aligns to the contract.
- **T3-RD-3 — module-isolation leak. NEW.** `derive-minute-view.ts` lives in the authoring `compose/` tree but is imported by read-side `schema-row-list.tsx:27`. Authoring → read dependency; extract to a shared lib.
- **T3-SEED-1 — `coverage-matrix.md` lies + is stale (CARRY).** Claims StagedProgram/INNER_LADDER_MARKER/slot covered; code has zero. A banner exists (`:6`), but the dead sections remain. Active doc↔code drift that would mask a regression. Rewrite or delete.
- **T3-SEED-2 — duplicate `blockInstanceRef` across weeks. NEW.** `block-008` (`week-1-friday.ts:46` named-program AND `week-2-monday-strength.ts:24` drop-set), `block-047`, `block-098` — different content, same ref; no uniqueness gate. Any per-ref coverage/analytics double-counts.
- **T3-SEED-3 — `BLOCK_EMOM_20` is 22 minutes. NEW.** `sub-schema-coverage.ts:32` `EMOM_MINUTES=22` behind a `:62` const named `_20` + a "20-min EMOM" header. Name/data mismatch.
- **T3-SEED-4 — `block-020` empty stub. NEW.** `week-2-tuesday-compose.ts:204-221` — header, but 0 rows + 0 sub-schemas (a non-empty schema with an empty body).
- **T3-SEED-5 — `INNER_LADDER_MARKER` 0 seed instances + Gauntlet C not assembled (V7).** rowKind exists in the Prisma enum, but the read/projection pipeline is never exercised on live DB data for it; the "parallel-ladders → AMRAP" combo exists nowhere (seed `block-037` is parallel-ladders via `container.repetition`, no AMRAP tail; the marker-via-row form lives only in the four-projection test). Ties to D-MARKER (deprecate-vs-seed) + ph.5.
- **T3-ARCH-1 — archive `analysis/artifacts/06-formalization/`. NEW.** The ONLY surviving carrier of the full archetype ontology (real `model Archetype`/`AlternatingGroup`, the 34-name union). Not imported by any build target; README warns "don't plan off it" — but a future planner could read it as SSOT. Archive/quarantine so `grep archetype` over the repo is a clean zero.
- **T3-MISC-1 — reconcile `ADR-0023` (CARRY).** `fast-check` is now a real workspace dep (S2-R2); the ADR's "deferred until money/date-math" trigger is superseded. One-line ADR update.

## What is healthy (do not re-litigate)

archetype excised everywhere (V1); `scoring` inert with a live triple guard (V2); 8/3/6 axes frozen to the algebra with `.strict()` + ladder-collision `superRefine` + a four-projection test; recursion exercised 8-deep; `kind`/`family` computed-on-read, never stored; the AlternatingGroup fold preserved every datum (`setEnumeration`/`pairedWithRowId`/N-ary). The migration is clean — build on it without backwards-compat for archetype.

## Sources

`plan-editor-compose/{algebra-spec,decisions,deferred,theory-vs-code-reconciliation}.md`; FROZEN `@repo/contracts/lms/composition/*`; Workflow run `wf_fc0a986c-5ae` (13 agents, full output in the session task dir). Memory: [[compose-four-projection]], [[compose-ph5-seed]], [[coach-daily-ux-priority]].
