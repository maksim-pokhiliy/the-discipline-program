# compose-authoring-ux — plan

Phased, **UI-first** (project rule `ui-first-for-training-domain`: each step ships UI on mocks first, the backend lands under the approved UX after). Budget ≤1 `/feature` per session → expect 2 sessions. Owner directive: **2 steps, not 3** — rounds/tail/other-patterns are backlog, not steps.

| #   | Step                                     | Gate                                                                                         | Status                        |
| --- | ---------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------- |
| 1   | Authoring UI flow (on mocks)             | coach walkthrough: create parallel ladders in one flow (Ladder tile → stepper → "+ another") | 🟢 shipped (PR pending merge) |
| 2   | Contract + model + api reshape (persist) | gated api-server suite green; parallel-ladder round-trip reconstructs tracks from children   | ⬜ next                       |

## Step 1 — authoring UI (the coach flow, on mocks)

The visible win first. Build the new ladder-with-tracks authoring on mock/draft state so the coach can click the flow and approve the UX before any contract churn.

- The Ladder pattern stepper IS track 1. Below the step row: a **"+ another ladder"** button that appends a second stepper. Tracks render stacked — NO "go back to the parent / toggle arrangement / assign tracks" round-trip.
- Adding the 2nd ladder MATERIALIZES the parallel parent in draft state (`deferred.md` MATERIALIZE) — invisible to the coach ("a second column appears").
- Remove the standalone `header` / `arrangement` / `rest` authoring fields from the create flow (the overloaded modal — the owner's "biggest problem"). Pattern tiles + their own settings only.
- A single ladder stays flat (no parallel wrapper) per `D-FLAT-SINGLE`.
- Persist wiring is NOT required to be production-correct in step 1 — the flow runs on draft/mock; the real persist (with derived tracks) is step 2. The existing authoring path must not hard-regress (degrade per the project's aggressive-migration philosophy is acceptable; the new flow is the forward path).
- **Gate = coach walkthrough**: the owner builds parallel ladders (e.g. 21-15-9 ‖ 15-12-9, each with its movements) start-to-finish in one flow and signs off on the feel.

**Shipped 2026-06-09** (`feat/compose-ladder-tracks-ui`, hybrid B per DR-1). The flow: tiles-first slim create modal → Ladder stepper (track 1) → "+ another ladder" appends a stacked stepper (materializes the parallel parent in draft, DR-3) → submit creates parent + N container-ladder tracks (P2, DR-2) → each track card carries the existing "+ Add row". Platform suite 961 green; 6 commits + docs close-out. The coach-walkthrough gate is the owner's manual dev-server pass before merge.

## Step 2 — backend (model honesty, persist under the approved UI)

Make the persisted model match what the UI already implies: parallelism is derived, not stored.

- `arrangement.parallel.tracks` removed from the stored contract; `interleaveOrder` moves onto the schema/composition root (verify: `interleaveOrder` is consumed by nothing but a display label — safe to move).
- Read-projection DERIVES tracks from the parallel container's child sub-schemas (in `Schema.order`). Verify: `tracks` was always a 1:1 mirror of children — no information lost.
- `assertArrangementRefsInScope` (api-server) → re-derive expected tracks from actual children instead of validating a stored array.
- Fix QA-106 (guard recursion): the write/read guard projector recurses to real depth, not hard-coded depth-2 (`schema.mapper.ts:41`). Real data is already depth-3 (`block-010` rounds-over-parallel) — cap-at-2 would break it.
- Seed reshape: the 4 parallel blocks (`week-1-saturday`, `week-2-tuesday-compose`, `-compose-2`) drop stored `tracks`; `interleaveOrder` re-homed.
- Wire the step-1 UI flow to the real persist (derived tracks). `deriveCompositionLabel` left as-is for now (parallel-only label is fine until BACKLOG-ROUNDS → LABEL-COMBINE).

The ~10 consumer sites are enumerated (verify ran the trace) — they ride into the step-2 `/feature` design stage, re-confirmed there, not trusted blind.

Open design details deferred to their step: persist strategy for the step-1 flow on mocks + parent-materialization id-stability (step 1); exact derived-tracks read shape (step 2). Listed so they are not silently decided early.
