# coach-station — state (the board)

**Updated:** 2026-06-15 (**R1a clone server-engine BUILT** via `/feature` in this worktree — 6 commits `63c03778`..`1961abc6`; Review B / QA B, 0 CRITICAL; no-DB gates GREEN (check-types 16/16, lint 16/16, dep:check clean); additive, zero Prisma change. **PENDING: the gated api-server suite (owner ritual) is the acceptance gate.** Then R1b editor-UX.)

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`.

## Board

| #   | Step                                        | Status                                   | Pointer                                                          |
| --- | ------------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| 1a  | R1a — Clone server-engine (deep-clone D-3)  | 🟢 BUILT (gated suite PENDING owner-run) | 6 commits `63c03778`..`1961abc6` · `r1a-server-runner-prompt.md` |
| 1b  | R1b — Clone editor-UX (affordances + flows) | ⬜ next                                  | `r1-clone-design.md`                                             |
| 2   | P — Coach profile UI                        | ⬜ pending                               | D-5                                                              |
| 3   | G — DnD group-creation                      | ⬜ pending                               | deferred → DND-GROUP-CREATE                                      |
| 4   | A-known — Authoring polish                  | ⬜ pending                               | deferred → LABEL-FLOW-UX / QA-007                                |
| —   | R2 — Templates/archetypes                   | 🅿️ parked                                | D-2 · deferred → TEMPLATES                                       |
| —   | A-e2e — Authoring polish (e2e-fed)          | 🟠 open                                  | deferred → A-E2E-POLISH / P6                                     |

## Next action

**▶ Owner runs the R1a acceptance gate: the gated api-server suite** — `pnpm db:reset && pnpm db:seed && pnpm --filter @repo/api-server test` (~10 min, live Neon, serial; the 6 clone suites SELF-FIXTURE the plan→week→…→row tree + catalog since `db:seed` is users-only). No-DB gates are already green. On green → **PR** for `worktree-coach-station` (the 6 R1a commits + the founding scaffold; this close-out rides in it). Then **R1b — Clone editor-UX**: build the affordances from `r1-clone-design.md` on the working engine, under a browser walkthrough.

## Open decisions awaiting ratification

NONE — D-1..D-6 RATIFIED. (R2 slot parked, not blocking.)

## Live carry-forwards

R1A-GATED-ACCEPTANCE (the owner's gated-suite run — the DoD "verified for real" gate) · QA-005 (concurrent grouped-duplicate 409, deferred) · CLONE-002 (revalidate asymmetry, documented) · TEMPLATES (parked) · DND-GROUP-CREATE (wave G) · LABEL-FLOW-UX + QA-007 (wave A-known) · A-E2E-POLISH + P6 (open) · ACTIVE-FLIP (post session-primitive close). See `deferred.md`.

## Gotchas a resuming session must know

- **Isolated worktree** `worktree-coach-station`, parallel to the owner's session-primitive e2e. `initiatives/ACTIVE` in `main` stays `session-primitive` until its close; this worktree's ACTIVE is `coach-station`. **PR merges `worktree-coach-station` → main** (founding scaffold + R1a). Don't touch session-primitive docs.
- **R1a is the clone SERVER engine only** — `/clone-from` (week/day replace) + `/duplicate` (session/block/schema/row append) endpoints, the `_shared/deep-clone.ts` recursive copier, contracts, routes, gated tests. **NO UI** — that's R1b (the next wave; design is `r1-clone-design.md`).
- **The gated api-server suite is UNRUN** — the no-DB gates (check-types/lint/dep:check) are green, but the live round-trip/cascade/contiguity assertions only run under `db:reset && db:seed && pnpm --filter @repo/api-server test`. That is the acceptance gate; treat R1a as "built, not yet accepted" until the owner runs it.
- **Clone is additive** — zero Prisma change, no migration, no reseed needed for the schema (the gated `db:reset` only re-applies the existing `lms-checks.sql`). The engine reuses the frozen primitive's models verbatim.
- **The frozen primitive is Sacred** — clone reuses `SCHEMA_BODY_INCLUDE`, the mappers, `verify*Ownership`, `resolveGroupedOrder`, the contiguity asserts; it never edits them (one `schema/assertions.ts` import-path change broke a barrel cycle — behavior-identical).
- **P-6 (reps-unit)** stays a session-primitive freeze call — clone copies whatever leaf shape exists, so it's insulated.
