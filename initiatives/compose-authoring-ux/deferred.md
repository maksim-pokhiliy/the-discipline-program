# compose-authoring-ux — deferred

Carry-forwards: findings/obligations not yet scheduled, with disposition + status. **Promote here at every gate.**

**Status:** `OPEN` (live) · `SCHEDULED` (assigned to a step) · `CLOSED` (done — kept for the trail) · `DROPPED` (decided not to).

| ID                    | One-liner                                                                                          | Disposition                                                                           | Status    |
| --------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | --------- |
| QA-106-RECUR          | Guard projector hard-codes depth-2; real data is depth-3                                           | fix in step 2 (write-path only; ZERO step-1 UI blast radius — verified)               | SCHEDULED |
| MATERIALIZE           | Adding the 2nd track restructures the tree under the hood (id-stability)                           | step-1 draft RESOLVED (parent keeps id); step 2 owns server-cuid stability            | SCHEDULED |
| MATERIALIZE-ATOMICITY | Parallel submit fires N sequential creates; mid-sequence failure leaves a partial (no rollback)    | step 2 atomic/transactional materialization                                           | SCHEDULED |
| QA-004                | Switching a materialized parallel to a non-ladder kind silently discards both ladders (no confirm) | accepted silent for step 1 (matches QA-14 wholesale-replace); add confirm if it bites | OPEN      |
| MARKER-FATE           | `INNER_LADDER_MARKER` stays a primitive but has no authoring flow                                  | revisit if per-track single-mvmt scheme is needed                                     | OPEN      |
| LABEL-COMBINE         | `deriveCompositionLabel` shows parallel OR rounds, not both                                        | fix when BACKLOG-ROUNDS lands                                                         | OPEN      |
| BACKLOG-ROUNDS        | "N rounds OVER a parallel block" authoring (rounds on the same schema)                             | future increment, post step-2                                                         | OPEN      |
| BACKLOG-TAIL          | Closing/finisher tail after the parallel (sibling schema, e.g. 800m run)                           | future increment                                                                      | OPEN      |
| BACKLOG-PATTERNS      | Parallelizing non-ladder patterns (EMOM / interval / plain list)                                   | future increment                                                                      | OPEN      |

## Detail on the live ones

**QA-106-RECUR** — inherited from `plan-editor-compose/deferred.md` QA-106. `buildSchemaWithBody` (`schema.mapper.ts:41`) hard-codes `subSchemas: []`, so the write/read guard projector only sees depth-2. Real seed data (`block-010`, rounds-over-parallel ladders) is already depth-3, so the deferred's other option — "assert depth ≤ 2" — is WRONG (would break legit data). The projector must recurse to real depth. **STEP 2** (corrected 2026-06-09): this is a WRITE-path/persist concern with ZERO step-1 UI blast radius — verified during step-1 research/review (the READ path already recurses via `buildSchemaForest`, fixed in `4a67b6e2`; step 1 is draft/mock, never hits the write guard). The earlier "fix in step 1" disposition was stale. It is a correctness backstop for `D-TRACKS-DERIVED` (deriving tracks from children needs them read at depth) and ships with the step-2 persist.

**MATERIALIZE** — `D-FLAT-SINGLE` means the 1st→2nd track transition restructures: the flat ladder schema becomes a child of a new parallel parent. **Step-1 RESOLVED (draft layer, DR-3):** `materializeParallel` reuses the flat single's draft id for the PARENT (stable top-level ref for the modal's `onUpdateNode`/`onRename`); track 1 gets a fresh child id. Draft ids are throwaway UUIDs, so this is purely the modal's in-session identity. **Step 2 owns the SERVER-cuid stability** of the transition (a different question — real cuids on the persisted tree); surface in the step-2 `/feature` design stage, do not pre-decide.

**MATERIALIZE-ATOMICITY** — step-1 persist (DR-2) fires the parent + N track creates as a sequence of independent `api.schemas.create` calls (no batch endpoint). A mid-sequence failure leaves a recoverable partial (parent + k tracks) — the error is surfaced (modal Alert) + retryable, but a retry re-creates the parent (a duplicate parallel the coach must delete). Accepted degrade-on-peripheral for the UI-first step. **Step 2** replaces the sequencer with an atomic/transactional materialization (ships with the contract reshape + api-server changes), removing the failure mode.

**QA-004** — switching a materialized parallel to a non-ladder pattern (Count/Once/EMOM/Interval/Time cap) collapses it to a flat single, silently discarding both authored ladders (no confirm). This is the intended collapse per `D-SCOPE` (non-ladder isn't parallelizable) and is consistent with the codebase's existing wholesale-replace-on-kind-switch (QA-14, which discards a single pattern's body). The defect is the SILENT loss of a whole authored structure. Accepted for step 1 (a confirm dialog would be a new pattern absent elsewhere). Revisit as a UX polish (confirm/undo) if the coach reports losing work; tracked as a product-domain call.

**MARKER-FATE** — `D-CONTAINER-PER-TRACK` leaves `INNER_LADDER_MARKER` in the contract with no authoring path in this flow. It remains valid + readable + seedable. Revisit only if a coach genuinely needs the per-track single-movement rep-scheme case (Block C shape) authored — then it gets its own affordance, NOT folded into the ladder-track flow.

## Closed history

(none yet)
