# Next planner action

> Concrete next-action handoff brief. Updated every close-out as the queue shifts.

## Status: Step 8.3.7 CLOSED 2026-05-21

`@@unique([parentSchemaId, order])` on the `Schema` Prisma model (sub-schemas) + a `schemas_block_top_order` partial unique index in `lms-checks.sql` (top-level schemas, `WHERE "parentSchemaId" IS NULL`) — the dual-scope positional-uniqueness constraint, **the last Step 8 infrastructure sub-step**. 1 atomic commit `cda82308` (6 files, +152/−0) + close-out docs. `lmsSchemaApi.reorder` not rewritten (confirmed two-pass since `0d7c6943`; flavour-(h) trace verified compatibility — D-8.3.7-3). Independent review APPROVED (1 INFO applied); all gates green; 722/722 api-server tests; scope confined. Executed in-session by the planner — a one-off proportionality call for a ~50-line micro-step (D-8.3.7-1); **not a workflow change** — see below. Full entry: [../log/step-08.3.7.md](../log/step-08.3.7.md).

**All Step 8 infrastructure is shipped** (8.0a → 8.3.7): the `Schema` / `SchemaRow` / `AlternatingGroup` slices are complete end-to-end — contracts, api-server, routes, client hooks, the week read-embed, and DB-level positional-uniqueness on `Block` / `SchemaRow` / `Schema`. The next step is the **8.4 anchor** — the first coach-visible Schema editor.

## Next planner action: Step 8.4 thesis cycle — the anchor (first coach-visible Schema editor)

Per [01-step-queue.md](01-step-queue.md) Step 8.4: **ArchetypePicker UI shell + Schema CRUD wire-up in `apps/platform/src/modules/plan-detail/` + the first 2 `archetypeParams` forms hand-rolled (`n-rounds` + `amrap-flat`) + the RestSpec sub-editor.** The first coach-visible Schema editor end-to-end — a coach picks an archetype, fills its params form, the schema renders in the block. `/feature` **full** (a real UI step, not `small`).

**This is a full executor-session step.** 8.3.7's in-session planner execution was a one-off proportionality call for a ~50-line additive micro-step — 8.4 is a large UI step (new components, new forms, real coach UX): the full planner→executor shuttle applies (write `prompt.md` → fresh executor session → `/feature` → `output.md` → planner validates). WORKFLOW.md "Roles" is canonical here.

**Walkthrough gate (8.4).** A coach-facing UI step — the thesis coach view carries the queue's walkthrough verbatim as its base: Денис opens a plan day, taps "add schema" in a training block, sees the ArchetypePicker (34 archetype options, 32 grey "coming soon", 2 active — `n-rounds`, `amrap-flat`), picks `n-rounds`, fills the params form (rounds count exact/range, reps per set, optional rest interval via the RestSpec sub-editor), saves — the schema renders in the block with its header. The body stays empty (Step 9 row editor next).

**Thesis OQ surface (8.4's to ratify — hypotheses):**

- **ArchetypePicker shape.** _Hypothesis:_ a dropdown/select listing all 34 archetypes grouped by `ArchetypeFamily`, the 32 unimplemented ones rendered disabled ("coming soon"), not hidden — the coach sees the roadmap. Verify against the existing `plan-detail` selection affordances (Block label assignment UI, Step 7.x) before specing the component.
- **The 2 `archetypeParams` forms — `n-rounds` + `amrap-flat`.** _Hypothesis:_ each is a hand-rolled typed form driven by the entity Zod schema (`[[no-json-editor-in-ui]]` — no generic JSON editor; one form per archetype discriminator). `n-rounds` params + the optional `rest` field, `amrap-flat` params (`durationMin`) — read the contract schemas + `analysis/` archetype definitions verbatim at prompt-write; do not instinct-spec the field set.
- **RestSpec sub-editor.** _Hypothesis:_ first materialization of the RestSpec editor (raw text + parsed `scope`); it is reused later (Step 9.2 REST rowKind, archetype expansion 8.13/8.14). Spec it as a standalone reusable component from the start. Ground its shape in `restSpecSchema` + `analysis/` § 2.6-ish RestSpec.
- **Schema CRUD wire-up — read path.** _Hypothesis (flavour-(g) trace):_ the read path is already shipped — Step 8.3.5 embedded `schemas[]` (depth-2 `SchemaWithBody`) into the week response; the 8.3 client hooks (`useCreateSchema` / `useUpdateSchema` / `useDeleteSchema` / `useReorderSchemas`) exist. Trace the read path backwards at thesis time to confirm no read-enabler sub-step is owed before the UI (the Step 7.4 anti-precedent).
- **Step decomposition.** _Hypothesis:_ 8.4 is large (picker + 2 forms + RestSpec sub-editor + CRUD wire-up). Consider at thesis whether it splits into ratified sub-steps (e.g., 8.4a picker + CRUD shell, 8.4b the 2 forms + RestSpec) or ships whole. Decide from the walkthrough's natural seams, not a line count.

**Reference points to read at 8.4 prompt-write time:**

- `apps/platform/src/modules/plan-detail/` — the current plan editor (Block UI from Step 7.4, Intensity/TimeCap UI from Step 7.5) — the canonical `plan-detail` component patterns.
- `implementation/log/step-07.4.md` + `step-07.5.md` — the nearest `plan-detail` UI-step precedents (component structure, the `useWeekMutation` wiring, lint-impact lessons).
- `apps/platform/src/lib/{api,hooks}/` — the Step 8.3 `Schema` client API + the `useXxxSchema` mutation hooks.
- `packages/contracts/src/entities/lms/schema/` + `lms/_shared/` — the `Schema` contract, the `archetypeParams` discriminated schemas, `restSpecSchema`.
- `analysis/artifacts/06-formalization/implementation-notes.md` § 1.7 (ArchetypeParams samples) + the archetype catalog in `03-content`/`04-structure` — the `n-rounds` / `amrap-flat` / RestSpec authoritative shapes (flavour-(b) — cite verbatim, do not invent).
- `apps/admin/src/modules/exercises/` (Step 3) — the canonical hand-rolled-form patterns, if a form primitive is reused.

## Carry-forwards into the 8.4 thesis

- **Toast-policy — drop editor-wide success toasts except session-delete** (`03-deferred.md` "Step 8.3 follow-ups"). The deferred trigger is explicit: _"once the schema-editing UI lands (Step 8.4+) and the toast cadence is observable."_ 8.4 is that landing. _Hypothesis:_ keep it a separate `/feature small` (a behavioural change to already-shipped Block/Session/Day UX, ~5 files, distinct from 8.4's additive scope) — but the 8.4 thesis must consciously decide fold-in vs separate, since 8.4's new Schema hooks will toast like Block unless told otherwise.
- **QA-001c** (`03-deferred.md` "Pre-Step-8 cleanup") — `lmsSchemaApi.create` joined the `retryOnP2034`-widening list at this close-out. A codebase-wide `/fix`, not 8.4 scope.
- **`BLOCK_WITH_LABELS_INCLUDE` / `DAY_INCLUDE` hoists** (`03-deferred.md` "Step 8 surface triggers") — still 2-callsite, hoist deferred; 8.4 is UI, unlikely to add a 3rd. Not 8.4 scope.

## Process reminders (active)

- Thesis = two voice-coded sections (coach view + developer view) per `[[thesis-format]]`; the coach view carries the mandatory walkthrough per `[[coach-walkthrough-gate]]`, screen-only per `[[coach-daily-ux-priority]]`. 8.4 is coach-facing — the walkthrough is the real thing, not a backend-step proxy.
- Prompt spec-only per `[[planner-strategic-level]]` — § 0 verbatim quotes of existing code; no prescriptive new-code skeletons in § 3.
- Flavour (a) `[[scope-via-existing-patterns]]` — load-bearing for 8.4: read the `plan-detail` Block/Intensity UI verbatim before specing the ArchetypePicker / forms; project component patterns are sacred.
- Flavour (g) `[[planner-read-surface-trace]]` — trace the schema read path backwards before locking the UI thesis (8.3.5 shipped the embed — confirm, do not assume).
- Flavour (i) `[[planner-lint-impact-trace]]` — UI step: simulate `react/no-multi-comp`, `[[one-component-per-file]]`, the `@repo/ui` ESLint surface on any planned component extraction.
- `/feature` full, `feat/training-domain` long-lived branch, branch-cut override mandatory (`[[always-via-feature-skill]]`).
- The next PR batches the post-#201 work (8.3.7 onward) — the planner does not open it unprompted (`[[execute-requested-outward-ops]]` — on the user's explicit request, act immediately).

## After Step 8.4 close-out

Per [01-step-queue.md](01-step-queue.md) execution order: 8.4 → **9.1..9.11 — the SchemaRow editor** (9 rowKinds + 7 composite VOs; the row editor runs inside any schema regardless of archetype) → **8.5..8.20 — archetype expansion** (32 remaining archetypes) → 10 (end-to-end smoke + workflow close-out). 8.4 + Step 9 together = the first genuinely usable product — 2 working archetypes with real exercises in their bodies.
