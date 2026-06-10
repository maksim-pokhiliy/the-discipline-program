# compose-authoring-ux — charter

> **Status: CLOSED 2026-06-10.** Both steps shipped (PR #258; PRs #259+#260 + ADR-0040). Superseded forward by `initiatives/session-primitive/` — the box-model redesign of the session primitive (explicit Groups replace derived parallelism; the sacred clauses below were honored for this initiative's lifetime and are re-opened THERE, not here).

**Goal.** Make schema authoring feel like the coach thinks: he builds "a ladder with N tracks" in one flow, instead of hand-assembling a container, nesting sub-containers, and wiring an arrangement axis. First target: parallel ladders.

**Driving decision.** This is the **UX layer over the ratified compose model** (`docs/adr/0037`, initiative `plan-editor-compose` — CLOSED). It changes how the coach authors composition; it does NOT re-open the algebra. The four-projection invariance lens (a primitive means the same across coach-SETS / athlete-EXECUTES / RENDER / ANALYTICS) still governs. Memory: `[[compose-four-projection]]`, `[[pm-initiatives-system]]`.

**Acceptance criteria.**

- A coach creates parallel ladders in ONE flow — pick the Ladder pattern, fill the stepper (that IS track 1), press "+ another ladder" to add track 2..N. No "go back to the parent / assign tracks / toggle arrangement" step.
- The overloaded create-schema modal is gone for this flow: no standalone `header` / `arrangement` / `rest` / derived-label fields shoved at the coach before he does anything.
- `arrangement.parallel.tracks` is no longer stored — parallelism is DERIVED from the schema having >1 ladder track. A round-trip (save → read) reconstructs the parallel from the children.
- Nothing ratified breaks: both `D-LADDER` primitives survive (container round-counter + row `INNER_LADDER_MARKER`), `D-PERSIST` (flat per-node) holds, four-projection holds.

**Scope.**

- Parallel **ladders** as "a ladder with tracks" (a single coach-facing schema).
- Contract reshape: `tracks` → derived-on-read; `interleaveOrder` → onto the schema.
- Author each track as a container round-counter ladder (`container.repetition.ladder` + movement rows), the Fran-style shared-counter case.
- Drop the standalone arrangement/header/rest authoring fields from this flow.

**Non-goals (→ where they go).**

- "N rounds OVER a parallel block" authoring (rounds on the same schema) → `deferred.md` BACKLOG-ROUNDS.
- A closing/finisher tail after the parallel (sibling schema) → BACKLOG-TAIL.
- Parallelizing non-ladder patterns (EMOM / interval / plain list) → BACKLOG-PATTERNS (owner: "only ladders, start with this").
- The athlete execution/scoring layer → `D-PHASE5-SCORING` (its own future initiative).
- Removing the `INNER_LADDER_MARKER` row primitive → it is sacred per `D-LADDER`; only kept OUT of this flow.

**Sacred (do not break).**

- `D-LADDER` — both ladder primitives (container round-counter `repetition.ladder` AND row `INNER_LADDER_MARKER`). This flow only authors the container one; the marker stays in the contract.
- `D-PERSIST` — composition persists flat per node; nesting on `parentSchemaId`; the read-projection is assembled by the mapper, never a stored recursive blob.
- Four-projection invariance — any change must mean the same in all four projections.
- The forbidden fused shape (`composeContainerSchema.superRefine`: a `repetition:ladder` container with an `INNER_LADDER_MARKER` child) stays rejected.
