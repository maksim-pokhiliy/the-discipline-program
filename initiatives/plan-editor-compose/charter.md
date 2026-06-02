# plan-editor-compose — charter

**Goal.** Replace the archetype-picker plan editor with a **compose-only constructor**: the coach assembles any workout by freely nesting primitives. Archetype is emergent, never chosen.

**Driving decision.** ADR-0037 (`docs/adr/0037-compose-only-plan-content-model.md`). Full algebra: `algebra-spec.md` (this dir).

**Acceptance criteria** — both gates, on the mock prototype, coach-POV:

1. **Expressiveness** — any structure from the coach's real plans composes by free nesting. Canonical test = the "Gauntlet" (`algebra-spec.md` §3); broader = `analysis/source/`. NOT "covers N archetypes."
2. **Ergonomics** — he builds it _fast_. The real flee-to-Sheets lever. Requires **duplication** (week/day/block/node) in scope — the real workflow is clone-and-tweak, not build-from-scratch.

**Scope.** Session-and-below plan content: the compose algebra, the constructor UI, the contracts + schema cut, the seed-as-compositions.

**Non-goals.** Parsing the coach's text notes (not the product; a possible later input accelerator _over_ this model). Migrating any corpus (no users). Billing / entitlements / OneRMRecord. The scoring/execution layer (separate later phase — the `scoring` axis is present-but-inert here).

**Sacred (do not touch).** Week/Day/Session/Block/Schema tree, recursion, `SchemaRow` + Json-VOs, Exercise/Label, Performed\*.
