# compose-authoring-ux — state (the board)

**Updated:** 2026-06-09

Resume here (SessionStart hook force-loads this). Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`.

## Board

| #   | Step                                     | Status    | Pointer                                 |
| --- | ---------------------------------------- | --------- | --------------------------------------- |
| 1   | Authoring UI flow (on mocks)             | ✅ merged | PR #258 · `4bb7669f` · DR-1..6          |
| 2   | Contract + model + api reshape (persist) | 🔵 active | `/feature` (parallel session) · plan §2 |

## Next action

**Step 1 MERGED** to main (PR #258, `4bb7669f`). Coach walkthrough passed — owner verified the flow in the browser ("работает норм"); independent verify green (tsc + lint + **971** platform tests). **Step 2 LAUNCHED** via `/feature` full in a parallel session (prompt issued 2026-06-09).

Step 2 = backend honesty: derive `tracks` from children on READ, re-home `interleaveOrder` onto the schema, **restore the "parallel" card label** via `deriveCompositionLabel`-from-structure (the one coach-visible effect), atomic materialization (MATERIALIZE-ATOMICITY), QA-106 write-path guard recursion, migrate the edit-path `tracks` consumers, seed reshape. GATE = gated api-server suite (serial ~10 min, owner's manual run) + parallel round-trip (label returns) + edit round-trip + `db:reset` reseed clean.

## Open decisions awaiting ratification

None — the 8 D-decisions (D-SCOPE … D-SPLIT) RATIFIED 2026-06-09; the 6 step-1 implementation decisions (DR-1..DR-6) RATIFIED at Gate A 2026-06-09 (see `decisions.md`).

## Live carry-forwards

- MATERIALIZE (step-1 draft id-stability RESOLVED — parent keeps id; step 2 owns server-cuid) · MATERIALIZE-ATOMICITY (step-1 sequencer has no rollback on mid-sequence failure; step 2 atomic persist) · QA-106-RECUR (→ step 2; write-path only, verified ZERO step-1 UI blast radius) · QA-004 (silent ladder-discard on kind-switch — accepted for step 1; owner: "работает норм" → leave silent unless it bites) · MARKER-FATE (OPEN) · LABEL-COMBINE (OPEN, dormant until BACKLOG-ROUNDS) · BACKLOG-ROUNDS / BACKLOG-TAIL / BACKLOG-PATTERNS (OPEN, out of the 2 steps by owner directive).

## Gotchas a resuming session must know

- **`D-LADDER` is sacred** — this flow authors ONLY the container round-counter ladder. Do NOT remove the `INNER_LADDER_MARKER` row primitive; do NOT fuse a `repetition:ladder` container with a marker child (still rejected).
- **Composition is INERT today** — no athlete executor reads it (verify confirmed; ADR-0038/0039). The model is free to reshape; only the label is computed-on-read.
- **`plan-editor-compose` is CLOSED** — this is a NEW initiative over its ratified model, not a resume of it. Trust its `decisions.md` (D-LADDER/D-PERSIST/four-projection) as the floor.
- **`tracks`-derived is a contract change** (step 2) — the full consumer list (~10 files: contract + 6 platform + mappers/seed/assertions) is the verify trace; re-confirm in the step-2 `/feature` design stage, don't trust this list blind.
- **Step-1 shipped P2 (structural-only parallel)** — a parallel is persisted as a parent (`composition:{}`) + N container-ladder children, NO stored `arrangement.parallel.tracks`. Step 2's read-projection DERIVES `tracks` from those children (in `Schema.order`). The structural tree is already Step-2-shaped — Step 2 swaps stored→derived on READ + adds atomic materialization on WRITE.
- **Structural "kind" trap (step-1 build learning)** — a materialized parallel parent has NO `repetition` (parallelism is encoded as >1 child, not a field). Any reader deriving "what kind is this node" MUST consult the structural predicate (`isParallelDraft` / children count), not just `node.repetition?.kind`. A step-1 CRITICAL (editor blanked on "+ another ladder") came from exactly this; Step 2's derived-read + `deriveCompositionLabel` MUST honor it. See `decisions.md` "Step-1 build learning."
- **Edit-path is the live `tracks` consumer** — `build-axis-composition.ts` (`foldArrangement`/`identityRefMap`) + `arrangement-resolve/convert` + `parallel-arrangement-fields` still read/write stored `tracks` for editing old parallels (DR-4 left edit untouched). Step 2 must migrate them to derived or edit breaks.
- **New step-1 surface (where the flow lives)** — `plan-detail/components/create-schema-flow.tsx` (slim create body), `axes/ladder-track-stack.tsx` (the stepper-stack), `lib/parallel-ladder-draft.ts` (materialize/append/dematerialize transforms), `lib/build-parallel-schemas.ts` + `lib/use-create-parallel-schemas.ts` (the submit sequencer). EDIT mode still uses `ContainerInspector` (unchanged, DR-4).
