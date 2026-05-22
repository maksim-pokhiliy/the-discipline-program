# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Status: Step 8.4 CLOSED 2026-05-22

The anchor shipped — the first coach-visible Schema editor, end-to-end. Phase 0 (the archetype read-path) + Phases 1-4 (the `plan-detail` Schema editor UI: `SchemaList`/`SchemaCard`/`AddSchemaButton` in `BlockCard`, `ArchetypePicker` over all 34 archetypes, `SchemaEditorModal` thin dispatcher + the `SCHEMA_PARAM_FORM_REGISTRY` of self-contained `*SchemaForm` components, the `amrap-flat` + `n-rounds` forms, the `RestSpecFields` sub-editor). 6 per-layer atomic commits `ed386142..7f1b6cbd` (27 files, +1572/−0). Approach (A) — the registry of self-contained forms — ratified at the Design gate; QA verdict C re-assessed (2 CRITICAL → WARNING, planner-concurred); all gates green; browser smoke user-run + accepted. Full entry: [../log/step-08.4.md](../log/step-08.4.md).

**The coach can now**: create a plan → programme a week → add sessions / blocks → add schemas (pick from 34 archetypes, fill the `amrap-flat` / `n-rounds` param forms) → the schema cards render in the block. **The schema bodies are empty** — Step 9 fills them with rows.

## Next planner action: Step 9.1 thesis cycle — the SchemaRow body editor begins

Per [01-step-queue.md](01-step-queue.md) Step 9.1: **the STANDALONE_LOAD rowKind + the LoadEditor composite + the WeightEditor sub-composite.** The first row-editor sub-step — it makes schema bodies fillable. `/feature` **full** (a real UI step + a composite-VO editor surface — not `small`).

Step 9 (the row editor) executes **after** the 8.4 anchor, **before** the archetype expansion 8.5-8.20 — the row editor works inside any schema regardless of archetype (rows live in the schema body; the archetype shapes the header/structure, not row mechanics). After 8.4 + Step 9, the coach has a fully working schema+row editor for 2 archetypes — the first genuinely usable product.

**This is a full executor-session step** — write `prompt.md` → fresh executor session → `/feature` full → `output.md` → planner validates.

**Walkthrough gate (9.1).** The thesis coach view carries the queue's walkthrough as its base: Денис, inside a created `n-rounds 5×5` schema, taps "add row", picks "standalone load" from the row-kind menu, sees the LoadEditor (5 kinds), picks "absolute" → the WeightEditor (8 variants), picks `single_arm`, enters "32 kg", scope "applies to all preceding rows" — the row renders in the schema body with a load annotation.

**Thesis OQ surface (9.1's to ratify — hypotheses):**

- **The row-kind menu mirrors the 8.4 ArchetypePicker (D-8.4-2 / D-8.4-3).** _Hypothesis:_ "add row" opens a menu of the **8 coach-facing rowKinds** (the 9 `RowKind` enum values minus `REST_SLOT` — auto-materialized, not coach-added per the Step 8.1b Coach-OQ-2). 9.1 implements only `STANDALONE_LOAD`; the other 7 land in 9.2-9.9. The menu shows all 8 with **zero availability logic** (no disabling, no "coming soon") — picking an unimplemented rowKind is a no-op, exactly the 8.4 picker decision the user ratified. Confirm the menu/registry shape mirrors 8.4.
- **LoadEditor + WeightEditor — apply the approach-(A) lesson.** _Hypothesis (load-bearing):_ LoadEditor is a 5-kind discriminated editor (`absolute` / `percentage` / `bodyweight` / `without_weight` / `unspecified`); WeightEditor (inside `absolute`) is an 8-variant discriminated editor. **This is the same discriminated-dispatch shape as the 8.4 archetype forms** — a single editor owning one `useForm`/state and dispatching at runtime over heterogeneous variant types is not type-safe (the 8.4 prompt error). The 9.1 thesis must spec these as a **registry of self-contained variant components** from the start (the `SCHEMA_PARAM_FORM_REGISTRY` template), or as a discriminated structure that types cleanly — flavour (i): simulate the type before locking the spec. Do not repeat the 8.4 § 2/§ 3 miss.
- **LoadEditor is a reusable composite — ship it self-contained.** _Hypothesis:_ LoadEditor lands paired with STANDALONE_LOAD (its first consumer) but is built reusable — Step 9.3 EXERCISE consumes it for row-level load. Spec it as a standalone composite from the start (the RestSpec-sub-editor precedent).
- **Read-surface trace (flavour g).** _Hypothesis:_ `SchemaWithBody.rows` (`SchemaRow[]`) is already in the type (Step 8.3.5 depth-2 embed); `SchemaCard` currently does **not** render the body (D-8.4-4 — empty, no placeholder). 9.1 adds body rendering + the row editor inside `SchemaCard`. The `use-schema-rows` hooks (Step 8.3) exist. Trace the read path backwards at thesis time — confirm no row read-enabler is owed.
- **Param integers — QA-201 mirror.** _Hypothesis:_ the WeightEditor's `valueKg` and other Load numerics are unbounded in the frozen contract (same as 8.4's archetype params). 9.1 mirrors the QA-201 disposition — the form invents no `.max()`; the bound, if wanted, is the deferred domain-model sub-step.

**Reference points to read at 9.1 prompt-write time:**

- `apps/platform/src/modules/plan-detail/components/` — the **Step 8.4 Schema editor stack** (`schema-list`, `schema-card`, `schema-editor-modal`, `schema-param-form-registry`, `*-schema-form`, `rest-spec-fields`) — the canonical row-editor precedent + the approach-(A) registry pattern.
- `implementation/step-08.4/{prompt.md, output.md}` + `log/step-08.4.md` — the immediate precedent (the registry pattern, the QA-201 disposition, the flavour-(i) lesson).
- `apps/platform/src/lib/hooks/use-schema-rows.ts` — the Step 8.3 SchemaRow CRUD hooks.
- `packages/contracts/src/entities/lms/schema-row/` — `schemaRowSchema`, the `RowKind` enum, the `rowPayload` discriminator, the `load` field.
- `packages/contracts/src/entities/lms/_shared/load.ts` + `weight.ts` — `loadSchema` (5 kinds) + `weightSchema` (8 variants) — the LoadEditor / WeightEditor contracts.
- `analysis/artifacts/06-formalization/implementation-notes.md` § 1.1 (Load — 13 fixtures), § 1.4 (`STANDALONE_LOAD` row_payload), § 2.1/2.2 (the Weight / Load Zod) — the authoritative shapes (flavour (b) — cite verbatim).

## Carry-forwards into the 9.1 thesis

- **QA-201** (`03-deferred.md` "Step 8.4 follow-ups") — param integer ceilings, a deferred domain-model sub-step. 9.1's Load numerics inherit the same unbounded-contract situation; the 9.1 form mirrors the disposition (no invented `.max()`). Not 9.1 scope.
- **Toast-policy** (`03-deferred.md` "Step 8.3 follow-ups") — the schema-editing UI has landed (8.4), the trigger is live, but the user deferred ("leave it as is"). 9.1's row mutations will toast via `useWeekMutation` like the rest; not folded — the toast-policy change stays a separate `/feature small`.
- **QA-204-adjacent** (`03-deferred.md` "Step 8.4 follow-ups") — Block/Session/Day forms lack per-field validation feedback; 9.1's LoadEditor should ship **with** `fieldState.error` wiring (match the 8.4 `*SchemaForm` bar, not the older `block-editor-modal` bar).

## Process reminders (active)

- Thesis = two voice-coded sections (coach view + developer view) per `[[thesis-format]]`; the coach view carries the mandatory walkthrough per `[[coach-walkthrough-gate]]`, screen-only per `[[coach-daily-ux-priority]]`. 9.1 is coach-facing — the walkthrough is real.
- Prompt spec-only per `[[planner-strategic-level]]` — § 0 verbatim quotes; no prescriptive new-code skeletons in § 3.
- **Flavour (i) `[[planner-lint-impact-trace]]` — load-bearing for 9.1.** The 8.4 prompt prescribed a single-`useForm` dispatcher without simulating the type under a runtime dispatch over heterogeneous forms — caught at the Design gate, approach (A) ratified. LoadEditor (5 kinds) + WeightEditor (8 variants) are the **same discriminated-dispatch shape**; the 9.1 thesis must apply the registry-of-self-contained-components pattern from the start and simulate the type — do not re-prescribe a non-type-safe ownership shape.
- Flavour (a) `[[scope-via-existing-patterns]]` — the 8.4 Schema editor stack is the canonical reference; read it verbatim in § 0.
- Flavour (g) `[[planner-read-surface-trace]]` — trace the SchemaRow read path before locking the UI thesis.
- `/feature` full, `feat/training-domain` long-lived branch, branch-cut override mandatory (`[[always-via-feature-skill]]`).
- The next PR batches the post-#201 work (8.3.7 + 8.4 onward) — the planner does not open it unprompted (`[[execute-requested-outward-ops]]` — on the user's explicit request, act immediately).

## After Step 9.1 close-out

Per [01-step-queue.md](01-step-queue.md) execution order: 9.1 → **9.2-9.11** — the rest of the SchemaRow editor (the remaining 8 rowKinds + the composite VOs RepNotation / Side / CompoundRep / Tempo / Media / Intensity, each shipped paired with its first consuming rowKind) → **8.5-8.20** — the archetype expansion (the 32 remaining archetype param forms, each one `*SchemaForm` file + one registry entry) → 10 (end-to-end smoke + workflow close-out).
