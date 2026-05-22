# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Status: Step 9.2 CLOSED 2026-05-22

Three more SchemaRow rowKinds shipped — `REST`, `INNER_LADDER_MARKER`, `STANDALONE_URL`. The add-row menu has 4 of 8 working rowKinds. `StepArrayFields` (a reusable chip-array number editor) is shipped for Step 8.5/8.6 archetype-form reuse. OQ-C3 (`STANDALONE_URL.wrapped`) was resolved from `analysis/` verbatim — a non-semantic notation field, pinned. 6 commits `c19c0725..1a41a453`. Review APPROVE; QA verdict B (both WARNINGs fixed in-pipeline); all gates green (planner re-ran FULL); browser smoke user-run + accepted. Full entry: [../log/step-09.2.md](../log/step-09.2.md).

**The coach can now**: fill a schema body with 4 of the 8 rowKinds. The central rowKind — `EXERCISE` — lands across Steps 9.3-9.6.

## Next planner action: Step 9.3 thesis cycle — EXERCISE (atomic) + RepNotationEditor + SideEditor + the exerciseForm picker shell

Per [01-step-queue.md](01-step-queue.md) Step 9.3 — **the largest single Step 9 sub-step** (queue adversarial concern #2 — ratified to stay one step: an atomic exercise without reps is a useless coach affordance, splitting is artificial granularity). It ships **3 composite-VO surfaces** (`RepNotationEditor` — 7 kinds; `SideEditor` — 4 kinds; `LoadEditor` reused from 9.1) + the `EXERCISE` rowKind's atomic form + the exerciseForm picker shell + **an exercise read-path enabler**. `/feature` **full**.

**This is a full executor-session step** — write `prompt.md` → fresh executor session → `output.md` → planner validates. Expect this to be the heaviest prompt of Step 9.

**Walkthrough gate (9.3).** The queue's base walkthrough: Денис adds an exercise row "Bulgarian split squat 3×8 each leg @ 60% 1RM" — "add row" → "exercise" → an exerciseForm picker (6 forms: atomic / compound / cyclical / sandwich / or_alternative / placeholder_ref — 9.3 implements **atomic** only) → picks Bulgarian Split Squat from the library → `RepNotationEditor` (7-kind selector, "count", enters 8) → `SideEditor` ("each_leg") → `LoadEditor` (reused — "percentage", 60, reference "self") → saves, the row renders with a full annotation.

**Thesis OQ surface (9.3's to ratify — hypotheses):**

- **Exercise read-path enabler — flavour (g), LOAD-BEARING.** `apps/platform` has **no** exercise read-path (verified at the Step 9.1 prompt-write — no `use-exercises`, no `exercises` endpoint, no `exercisePlatformApi`); Exercise is an admin-only catalog (Step 3). The exerciseId picker needs one. _Hypothesis:_ 9.3 builds it as a **Phase 0**, the exact mirror of the Step 8.4 archetype read-path (api-server `lmsExercisePlatformApi` + `mapToExercise` + a platform route + `createExercisesAPI` + a `use-exercises` query hook — the `lms/label` platform-read slice precedent). Cross-package, additive — per-layer atomic, no squash (the 8.4 Phase 0 precedent). Trace the read path at thesis time; confirm the enabler shape.
- **QA-307 hard prerequisite — `toRestrictedReference` deleted, `PercentageReferenceEditor` gains `other_exercise`.** 9.3's exercise picker is exactly what `percentage` → `other_exercise` needs (a `targetExerciseId` cuid). _Hypothesis:_ when the exercise picker lands, `PercentageReferenceEditor` gains its 3rd scope (`other_exercise`) and `toRestrictedReference` (the 9.1 collapse-to-`self` shim) is **deleted** — the QA-307 desync is structurally closed. The 9.3 thesis MUST carry this (`03-deferred.md` "Step 9.1 follow-ups"). The `LoadEditor` `percentage` reference editor stops being 2-scope.
- **`RepNotationEditor` / `SideEditor` — discriminated `switch`-dispatch (flavour i).** `RepNotation` is a 7-kind discriminated union (`count` / `range` / `unit_bound` / `max` / `implicit` / `total_flag` / `compound_rep_unit`); `Side` (`perLimbDistribution`) a 4-kind one. _Hypothesis:_ the same `switch (value.kind)`-dispatch shape as the 9.1 `LoadEditor` / `WeightEditor` (D-9.1-4) — NOT a `Record`-registry; each variant a own-file `Extract<…>`-typed sub-component. Apply the 9.1 lesson; simulate the type before locking.
- **`EXERCISE` row is the first rowKind with top-level modifiers.** `STANDALONE_LOAD` / `REST` / `INNER_LADDER_MARKER` / `STANDALONE_URL` (9.1-9.2) wrote `rowPayload` only — no top-level modifier (D-9.1-6). `EXERCISE`'s "3×8 each leg @ 60%" puts `reps` / `side` / `load` on the **top-level `schemaRow`** fields (`rowPayload` carries `{ rowKind:"EXERCISE", exercise: exerciseForm }`; `reps`/`side`/`load`/`tempo`/… are the schemaRow-level modifiers). _Hypothesis:_ 9.3's `EXERCISE` row form writes `rowPayload.exercise` (the atomic form) + the top-level `load` / `reps` / `side` modifiers — the first use of the `createSchemaRowSchema` top-level optional fields. Confirm the payload shape against `schema-row.schema.ts` + `analysis/` § 1.4 verbatim.
- **exerciseForm picker shell — 6 forms, 1 implemented.** _Hypothesis:_ the exerciseForm picker (atomic / compound / cyclical / sandwich / or_alternative / placeholder_ref) shows all 6, 9.3 implements `atomic`, the other 5 are no-ops — the mirror of the 8.4 ArchetypePicker / 9.1 row-kind menu zero-availability-logic decision. 9.4-9.6 fill the rest.
- **Empty library state.** Exercise is coach-populated via admin (D4) — not seeded. _Hypothesis:_ if the coach has not populated the Exercise library, the picker shows an empty state (the `ArchetypePicker` loading/error/empty precedent); the smoke-test seed/precondition must create ≥1 Exercise (or the scenario populates one via admin first).

**Reference points to read at 9.3 prompt-write time:**

- `apps/platform/src/modules/plan-detail/components/` — the **Step 9.1-9.2 row-editor stack** (the `*RowForm` pattern, `ROW_KIND_FORM_REGISTRY`, `LoadEditor` for reuse, the `switch`-dispatch discriminated-editor shape, `StepArrayFields`/`RestSpecFields` controlled sub-editor pattern).
- `implementation/step-08.4/prompt.md` § 0.5 + `log/step-08.4.md` — the **archetype read-path Phase 0** — the precedent for the exercise read-path enabler.
- `packages/contracts/src/entities/lms/_shared/{reps.ts, side.ts, compounds.ts}` — `repNotationSchema` (7 kinds), `perLimbDistributionSchema` (Side), `exerciseFormSchema` (the atomic member).
- `packages/contracts/src/entities/lms/exercise/` + `packages/contracts/src/entities/lms/_shared/load.ts` `percentageReferenceSchema` — the Exercise contract + the `other_exercise` scope.
- `packages/api-server/src/endpoints/lms/label/platform.ts` + the `lms/label` platform slice — the read-path mirror.
- `analysis/artifacts/06-formalization/implementation-notes.md` § 1.3 (RepNotation fixtures) + § 1.4 (`EXERCISE` atomic row_payload) + `05-synthesis/domain-model.md` (RepNotation / Side / ExerciseRow sections) — flavour (b), cite verbatim.

## Carry-forwards into the 9.3 thesis

- **QA-307** (`03-deferred.md` "Step 9.1 follow-ups") — **a hard 9.3 prerequisite**: delete `toRestrictedReference`, add the `other_exercise` scope to `PercentageReferenceEditor`. Not optional.
- **QA-907** (`03-deferred.md` "Step 9.2 follow-ups") — if 9.3 renders an Exercise's `defaultDemoUrls` as a **clickable** link, the url MUST go through a `safeHttpUrl` allowlist. If 9.3 only shows the exercise name (no clickable demo url), QA-907 stays dormant — confirm at thesis.
- **QA-305** (`03-deferred.md`) — the `EXERCISE` row form inherits the `useMemo(..., [mode])` refetch-clobber residual; not a 9.3 fix (codebase-wide).
- **QA-301 / QA-201 / QA-905** — domain numeric-bounds carry-forwards; 9.3's `RepNotation` count/range integers inherit the same unbounded-contract situation — the form invents no `.max()`, mirrors the disposition.
- **Toast-policy** — row mutations toast as-is; not folded.

## Process reminders (active)

- Thesis = two voice-coded sections (coach view + developer view) per `[[thesis-format]]`; the coach view carries the mandatory walkthrough per `[[coach-walkthrough-gate]]`, screen-only per `[[coach-daily-ux-priority]]`. 9.3 is coach-facing — the walkthrough is real.
- Prompt spec-only per `[[planner-strategic-level]]` — § 0 verbatim quotes; no prescriptive new-code skeletons in § 3.
- **Flavour (g) `[[planner-read-surface-trace]]` — LOAD-BEARING for 9.3.** The exercise read-path is absent; trace it backwards at thesis time and spec the Phase-0 enabler (the 8.4 archetype read-path precedent). Flavour (i) `[[planner-lint-impact-trace]]` — `RepNotationEditor` / `SideEditor` are discriminated editors; apply the 9.1 `switch`-not-`Record` lesson, simulate the type. Flavour (a) — the 9.1-9.2 row stack is the canonical reference. Flavour (b) — RepNotation 7 kinds / Side 4 kinds / exerciseForm cite `analysis/` verbatim. Flavour (e) — 9.3 is cross-package (the read-path enabler); confirm the additive-per-layer-atomic commit fan-out against `.husky` + `turbo.json`.
- `/feature` full, `feat/training-domain` long-lived branch, branch-cut override mandatory (`[[always-via-feature-skill]]`).
- The next PR batches the post-#202 Step 9.x work — the planner does not open it unprompted (`[[execute-requested-outward-ops]]` — on the user's explicit request, act immediately). 15 commits currently sit local on `feat/training-domain`.

## After Step 9.3 close-out

Per [01-step-queue.md](01-step-queue.md) execution order: 9.3 → **9.4** (EXERCISE compound form + CompoundRowEditor) → **9.5-9.6** (EXERCISE cyclical/sandwich/or_alternative/placeholder_ref forms) → **9.7-9.11** (REP_DEFINITION / FOOTNOTE / PLACEHOLDER + row-level Tempo/Media/Intensity/Sequence/Position) → **8.5-8.20** archetype expansion → 10.
