# compose-hardening — charter

**Goal.** Take the shipped compose plan-content feature from "model production-grade, authoring half-built" to "a coach can build AND iterate any real plan end-to-end" — close the authoring, correctness, read-honesty and hygiene gaps surfaced by the 2026-06-05 state-of-the-feature audit.

**Driving decision.** Independent 13-agent audit (`audit-findings.md`, this dir; 6 layer-mappers + 7 adversarial verifiers over merged `plan-editor-compose` PR #245). Verdict: model / contract / persistence are faithful + clean (zero drift, independently re-confirmed); but the **authoring surface is create-only** and **~⅓ of the algebra (program/slot, conditional-scoring) is unauthorable**. Builds on the concluded [[plan-editor-compose]] initiative + `docs/adr/0037`.

**Acceptance criteria.** (properties of the result, not a task-list)

- A coach can re-open an existing block and edit its axes (`repetition`/`arrangement`/`scoring`/`rest`) without delete-and-recreate.
- Wave / cluster / drop-set / named-program / EMOM-slot are authorable and round-trip through persist — no flatten-on-input data loss.
- Write-guards are symmetric create vs update (no `arrangement`-ref scope hole on create); the authoring→contract mapping has no silent data-loss path.
- Read cards never present an inert axis (`scoring`) as if it executes; `parallel`/`superset` render their structure, not just a one-word label.
- No zombie contract types claiming support that does not exist; `coverage-matrix.md` matches code; the archetype ontology is archived out of any live read-path.

**Scope.** Authoring **edit-mode** + missing **expressiveness** (program/slot) + api-server **correctness** fixes + read-side **honesty** + doc/seed/type **hygiene**. Tiers 0–3, catalogued in `deferred.md`, evidenced in `audit-findings.md`.

**Non-goals.** The **scoring / execution engine = ph.5**, its own future initiative — this initiative only fixes how the inert axis is _presented_ and _authored-or-hidden_, never how it is _evaluated_. Conditional-scoring _execution_ is ph.5. No new training-domain primitives beyond **resolving** the program/slot ontology question (the resolution may add one).

**Sacred (do not touch).** The FROZEN `@repo/contracts/lms/composition` axes contract — reuse, never edit; any change is a Gate-A escalation (per [[plan-editor-compose]]). The `Week→Day→Session→Block→Schema→SchemaRow` tree + `parentSchemaId` recursion + Json-VO leaves. Archetype stays excised. `scoring` stays present-but-inert until ph.5.
