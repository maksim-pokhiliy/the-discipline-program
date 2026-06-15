# coach-station — state (the board)

**Updated:** 2026-06-15 (initiative FOUNDED in an isolated worktree, parallel to the session-primitive e2e. Owner ratified D-1..D-5 + the verbatim per-floor clone logic. Next: design the R1 clone UX via `ui-ux-pro-max`, then write the R1 `/feature` prompt.)

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`.

## Board

| #   | Step                                            | Status              | Pointer                          |
| --- | ----------------------------------------------- | ------------------- | -------------------------------- |
| 1a  | R1a — Clone server-engine (deep-clone D-3)       | 🔵 prompt READY → run `/feature` | `r1a-server-runner-prompt.md` · D-3/D-4/D-6 |
| 1b  | R1b — Clone editor-UX (affordances + flows)      | ⬜ pending (after R1a)            | `r1-clone-design.md` |
| 2   | P — Coach profile UI                            | ⬜ pending           | D-5                              |
| 3   | G — DnD group-creation                          | ⬜ pending           | deferred → DND-GROUP-CREATE      |
| 4   | A-known — Authoring polish                      | ⬜ pending           | deferred → LABEL-FLOW-UX / QA-007 |
| —   | R2 — Templates/archetypes                       | 🅿️ parked           | D-2 · deferred → TEMPLATES        |
| —   | A-e2e — Authoring polish (e2e-fed)              | 🟠 open              | deferred → A-E2E-POLISH / P6      |

## Next action

**▶ Run `/feature` with `r1a-server-runner-prompt.md`** (the R1a clone server-engine — deep-clone endpoint family, server + contracts + routes + gated tests; NO UI). The prompt is self-contained and specced verbatim against the live patterns (recon done): `SCHEMA_BODY_INCLUDE` deep-read · `retryOnP2034 + $transaction(Serializable)` · `(max ?? 0)+10` / `resolveGroupedOrder` · `verify*Ownership` · idempotency auto-wire · the full `onDelete: Cascade` chain for replace. **Additive only — zero Prisma/migration/reseed.** Then **R1b** (editor-UX) builds the affordances from `r1-clone-design.md` on the working engine, under a browser walkthrough. Decide at run time whether `/feature` executes in THIS worktree session or a transported one.

## Open decisions awaiting ratification

**NONE** — D-1..D-5 are RATIFIED. (R2's slot is parked, not blocking; the R1-split decision is made at wave-plan time, not a ratification gate.)

## Live carry-forwards

TEMPLATES (parked) · DND-GROUP-CREATE (scheduled G) · LABEL-FLOW-UX + QA-007 (scheduled A-known) · A-E2E-POLISH + P6-REPS-UNIT (open, e2e-fed) · CLONE-WEEK-DESTRUCTIVE (R1 risk) · ACTIVE-FLIP (post session-primitive close).

## Gotchas a resuming session must know

- **We are in an ISOLATED worktree** (`worktree-coach-station`), running PARALLEL to the owner's session-primitive browser e2e. `initiatives/ACTIVE` in `main` stays `session-primitive` until its `/initiative-close`; this worktree sets ACTIVE locally for its own resume. **Do not touch session-primitive's durable docs.**
- **The primitive is FROZEN and Sacred** — reuse, don't edit: `primitive-spec.md`, ADR-0041 (`SchemaGroup` membership-based; no recursion / typed-relation-kinds / child-count semantics), the W4 leaf law, and the **one-predicate rule at both floors** (`buildBlockItems` / `buildRowItems` — never hand-roll clustering).
- **Clone is GREENFIELD** — zero clone/duplicate/template capability exists anywhere today (verified by recon).
- **Two clone semantics (D-4):** week/day = **replace-into-current** (source-pick + destructive warning + empty-source guard); session/block/schema/row = **duplicate-append** (in-place, same parent's end); groups clone their **members only** (append to the same group, contiguity-preserving).
- **Week/Day are calendar-keyed** (`@@unique([planId,startDate])` / `([weekId,dayOfWeek])`, no `order`, upsert-on-demand) — that's WHY week/day clone is replace-into-slot, not duplicate-beside.
- **Clone is server-side (D-3)**, one transaction, idempotent, re-references the shared catalog (does not duplicate Exercises/Modifiers/Labels). Not client orchestration.
- **P-6 (reps-unit metres/calories)** is a session-primitive freeze call owned by the parallel session — do NOT build polish assuming a unit shape.
- **Coach profile backend already exists** (GET/PUT `/api/platform/coach/profile`, `coachProfile` with only `bio`); the gap is the client hook + form (D-5).
