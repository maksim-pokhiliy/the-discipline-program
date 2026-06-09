# compose-authoring-ux — state (the board)

**Updated:** 2026-06-09

Resume here (SessionStart hook force-loads this). Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`.

## Board

| #   | Step                                     | Status                        | Pointer                                                               |
| --- | ---------------------------------------- | ----------------------------- | --------------------------------------------------------------------- |
| 1   | Authoring UI flow (on mocks)             | 🟢 shipped (PR pending merge) | branch `feat/compose-ladder-tracks-ui` · DR-1..6 · journal 2026-06-09 |
| 2   | Contract + model + api reshape (persist) | ⬜ next                       | D-TRACKS-DERIVED · plan §2                                            |

## Next action

**Step 1 SHIPPED** on `feat/compose-ladder-tracks-ui` (6 feat/fix commits + 1 docs close-out; platform suite 961 green). Acceptance gate = the owner's **coach walkthrough on the dev server** (Ladder → stepper → "+ another ladder" → 2nd stepper stacked → submit → two track cards each with "+ Add row") — to run before merge. Then `/feature` full for **Step 2** (contract+model+api reshape: derive `tracks` from children, re-home `interleaveOrder`, atomic materialization, QA-106 write-path fix, seed reshape). Step-1 P2 already persists the structural tree Step 2 derives from.

## Open decisions awaiting ratification

None — the 8 D-decisions (D-SCOPE … D-SPLIT) RATIFIED 2026-06-09; the 6 step-1 implementation decisions (DR-1..DR-6) RATIFIED at Gate A 2026-06-09 (see `decisions.md`).

## Live carry-forwards

- MATERIALIZE (step-1 draft id-stability RESOLVED — parent keeps id; step 2 owns server-cuid) · MATERIALIZE-ATOMICITY (NEW — step-1 sequencer has no rollback on mid-sequence failure; step 2 atomic persist) · QA-106-RECUR (→ step 2; write-path only, verified ZERO step-1 UI blast radius — the "fix in step 1" disposition was stale) · QA-004 (silent ladder-discard on kind-switch — accepted for step 1, product-domain polish later) · MARKER-FATE (OPEN) · LABEL-COMBINE (OPEN, dormant until BACKLOG-ROUNDS) · BACKLOG-ROUNDS / BACKLOG-TAIL / BACKLOG-PATTERNS (OPEN, out of the 2 steps by owner directive).

## Gotchas a resuming session must know

- **UI-first order** — step 1 is the UI flow on mocks (coach approves the feel); the contract reshape (`tracks`-derived) is step 2, under the approved UI. Do NOT lead with the backend.
- **`D-LADDER` is sacred** — this flow authors ONLY the container round-counter ladder. Do NOT remove the `INNER_LADDER_MARKER` row primitive; do NOT fuse a `repetition:ladder` container with a marker child (still rejected).
- **Composition is INERT today** — no athlete executor reads it (verify confirmed; ADR-0038/0039). The model is free to reshape for authoring; only the label is computed-on-read.
- **`plan-editor-compose` is CLOSED** — this is a NEW initiative over its ratified model, not a resume of it. Trust its `decisions.md` (D-LADDER/D-PERSIST/four-projection) as the floor.
- **`tracks`-derived is a contract change** (step 2) — the full consumer list (~10 files: contract + 6 platform + mappers/seed/assertions) is the verify trace; re-confirm in the step-2 `/feature` design stage, don't trust this list blind.
- **Step-1 shipped P2 (structural-only parallel)** — a parallel is persisted as a parent (`composition:{}`) + N container-ladder children, NO stored `arrangement.parallel.tracks`. Step 2's read-projection DERIVES `tracks` from those children (in `Schema.order`). The structural tree is already Step-2-shaped — Step 2 swaps stored→derived on READ + adds atomic materialization on WRITE.
- **Structural "kind" trap (step-1 build learning)** — a materialized parallel parent has NO `repetition` (parallelism is encoded as >1 child, not a field). Any reader deriving "what kind is this node" MUST consult the structural predicate (`isParallelDraft` / children count), not just `node.repetition?.kind`. A step-1 CRITICAL (editor blanked on "+ another ladder") came from exactly this; Step 2's derived-read must honor it. See `decisions.md` "Step-1 build learning."
- **New step-1 surface (where the flow lives)** — `plan-detail/components/create-schema-flow.tsx` (slim create body), `axes/ladder-track-stack.tsx` (the stepper-stack), `lib/parallel-ladder-draft.ts` (materialize/append/dematerialize transforms), `lib/build-parallel-schemas.ts` + `lib/use-create-parallel-schemas.ts` (the submit sequencer). EDIT mode still uses `ContainerInspector` (unchanged, DR-4).
