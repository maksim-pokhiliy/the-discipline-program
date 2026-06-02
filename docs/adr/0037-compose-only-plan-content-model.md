# 0037. Compose-only plan-content model (supersedes the 34-archetype catalog)

- **Status:** Accepted (supersedes the 34-archetype catalog asserted in `analysis/` and `docs/roadmap.md` Phase 0)
- **Date:** 2026-06-02
- **Deciders:** Maksim (owner), Claude (co-owner)
- **Tags:** `lms`, `plan-content`, `domain-model`, `training-domain`

## Context

The training-domain plan-content model was built around an **Archetype** — a structural class of workout (`n-rounds`, `ladder-descending`, `emom-nested`, `parallel-ladders`, …). The analysis (`analysis/artifacts/`, 7 phases) derived **34 archetypes** as equivalence classes over a real corpus of ~337 schemas from one coach's 9-month plan. That catalog was wired in end to end: a `model Archetype` lookup table + `Schema.archetypeId` FK + an `archetypeParams` discriminated union (34 variants) + stored `kind`/`family`; a contracts slice; an api-server endpoint + seed; and — critically — a Plan Editor UI where the coach **picks an archetype from a ~30-option picker, then fills a bespoke per-archetype form** (~18 forms, 4 still stubbed).

Two problems surfaced:

1. **It measures the tool against the corpus, not against expressiveness.** "Covers 34 archetypes" is corpus-fidelity, not a product property. The 34 are _observed combinations_ of a much smaller set of generative primitives; ~11 are corpus singletons, and one (`ladder-spike`) is flagged in the analysis as possibly a source typo. The distinguishing feature of most archetypes is **derivable from data** — a ladder's direction is a function of its `steps[]`; `nested-rounds-over-X` names the child's own type. That is a _value_, not a _type_.
2. **The archetype propagated into the authoring UX as a picker-first flow** — exactly the "pick your archetype from a dropdown, then fill its form" experience that pushes an expert coach back to Google Sheets. The over-cataloguing and the flee-risk are the same problem at two layers.

A blind stress test settled it: the meanest CrossFit workout we could invent (nested EMOM, parallel ladders into an AMRAP, drop-sets with tempo + footnotes, conditional scoring) decomposed cleanly into **~8 composable primitives** with no loss of structure. The structural backbone the project already had — the `Schema`/`Block`/`SchemaRow` tree + recursion + Json value-objects + the 9 `ArchetypeFamily` values — _is_ those primitives.

## Decision

The plan-content model becomes **compose-only**: a coach assembles any workout by **freely nesting a small set of primitives**, and "archetype" is an **emergent, computed-on-read label**, not a stored entity.

Full algebra: `initiatives/plan-editor-compose/algebra-spec.md`. In brief:

- **Two node types.** `Container` (internal node ≡ `Schema`) and `Row` (leaf ≡ `SchemaRow`, unchanged).
- **A Container is a point in orthogonal axes**, not a type: `repetition` (`count` / `range` / `ladder(steps[])` / `timeCap` / `cadence` / `window`), `arrangement` (`ordered` / `parallel` / `superset`), `scoring`, `rest`. **Any Container accepts any child; any axis value combines with any other.**
- **Archetype is emergent.** `n-rounds` = `Container{count}`; `AMRAP` = `Container{timeCap, scoring:amrap}`; `parallel-ladders` = `Container{parallel}·[Container{ladder}, …]`. None are enumerated.
- **Acceptance = expressiveness, not coverage.** "Any structure the coach writes by hand composes from the primitives" — verified against the corpus, never measured as "N archetypes covered."

**Cut** (no users, nothing to migrate): `model Archetype` + `Schema.archetypeId` FK + the `archetypeParams` 34-variant discriminated union + **stored** `kind`/`family`; the contracts archetype entity + endpoint + seed catalog; the `archetype-picker` + ~18 per-archetype `*-schema-form.tsx`. `kind`/`family` become **computed-on-read labels, never denormalized to a column** (a cached derived column would be `archetypeId` reincarnated). `AlternatingGroup` folds into the `arrangement: parallel` axis (its relation data migrates into the axis, not deleted). Authoring becomes **compose-from-primitives**; the `step-09.x` `SchemaRow` leaf editors **survive**.

**Stays sacred** (passed the blind stress test): the Week/Day/Session/Block/Schema tree, recursion via `parentSchemaId`, `SchemaRow` + all Json value-objects (`load`/`reps`/`tempo`/`side`/`position`/`intensity`/`media`/`compoundRep`/`program`), the Exercise/Label catalogs, the Performed\* tables.

**Deferred** to a separate later phase (this decision does **not** build it): the **scoring/execution layer** (live AMRAP/for-time/max-in-remaining scoring, conditional scoring, parallel-track interleave). The `scoring` axis is **present-but-inert** — values are valid and stored at compose time, no code computes a score yet, and that inertness is enforced by **type + test, not a comment**.

The live Prisma schema + `@repo/contracts` are the **single source of truth** going forward. The prior "living mirror" protocol (`implementation/WORKFLOW.md` mandated mirroring every schema change into `analysis/artifacts/06-formalization/`) is **dropped** — mirroring the schema into docs is doc-level denormalization (the same anti-pattern this decision rejects at the model level), and it was a two-session-workflow artifact. `analysis/06-formalization/` is frozen as history.

## Consequences

- **Blast radius is large (~50 files across `contracts` + `api-server` + `platform`), and that is not a blocker.** No users, nothing to migrate; the sole criterion is giving the coach a good tool. Blast radius sizes the workflow, it does not gate the decision.
- Sequenced as the **`plan-editor-compose` initiative** (see its `plan.md`): UI prototype on mocks → contracts + schema cut (`db:reset`, non-prod) → backend + seed-as-compositions → mechanical removal of the old forms/picker. Each code step ships through `/feature`; the mechanical sweep through an ultracode workflow. Quality pipeline unchanged.
- **`analysis/` is retained, not deleted.** `source/` is the coach's real corpus = the acceptance fixture for the new model (sacred). The archetype-taxonomy artifacts are superseded _as target design_ but kept as evidence + history. A directory-level supersede note records this; the ~65 superseded files are **not** edited individually (per the 2026-06-02 doc audit: zero garbage, zero delete-candidates).
- Supersedes the archetype assumptions in `docs/roadmap.md` Phase 0 (recorded in its decision log). The dangling `ADR-0028` reference in ADR-0017 is corrected to point here — the LMS plan-content domain model is decided in this ADR.
- Reverses the earlier "implement `analysis/` as-is; archetype expansion only, never model redesign" stance — that was scoped to a frame where the archetype is the primary authoring entity; this decision changes that frame deliberately.
