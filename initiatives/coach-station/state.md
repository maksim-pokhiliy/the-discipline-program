# coach-station — state (the board)

**Updated:** 2026-06-15 (**R1a clone server-engine MERGED to `main`** — PR #270, after syncing with the latest main `30835113` (which had merged PR #271); no conflicts. R1a = the server deep-clone family (`clone-from` replace + `duplicate` append) + contracts + 6 routes + gated tests; additive, zero Prisma change; Review B / QA B, 0 CRITICAL. `ACTIVE=coach-station` now lives in `main`. **NEXT: R1b — the clone editor-UX** (the affordances + flows over the now-shipped engine; design `r1-clone-design.md`, prompt `r1b-editor-runner-prompt.md`). The gated api-server suite — now incl. the 6 clone suites — stays the owner verify ritual.)

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`.

## Board

| #   | Step                                        | Status                      | Pointer                                                |
| --- | ------------------------------------------- | --------------------------- | ------------------------------------------------------ |
| 1a  | R1a — Clone server-engine (deep-clone D-3)  | 🟢 MERGED to main (PR #270) | `r1a-server-runner-prompt.md` · gated suite owner-owed |
| 1b  | R1b — Clone editor-UX (affordances + flows) | 🔵 next (prompt ready)      | `r1b-editor-runner-prompt.md` · `r1-clone-design.md`   |
| 2   | P — Coach profile UI                        | ⬜ pending                  | D-5                                                    |
| 3   | G — DnD group-creation                      | ⬜ pending                  | deferred → DND-GROUP-CREATE                            |
| 4   | A-known — Authoring polish                  | ⬜ pending                  | deferred → LABEL-FLOW-UX / QA-007                      |
| —   | R2 — Templates/archetypes                   | 🅿️ parked                   | D-2 · deferred → TEMPLATES                             |
| —   | A-e2e — Authoring polish (e2e-fed)          | 🟠 open                     | deferred → A-E2E-POLISH / P6                           |

## Next action

**▶ Run `/feature` with `r1b-editor-runner-prompt.md`** — the clone editor-UX (the visible half: duplicate icon-buttons on session/block/schema/row + group members; the week/day "Clone … into current" source-picker + destructive-confirm; wired to the shipped R1a endpoints). The UX design is locked in `r1-clone-design.md`; the engine is in `main`. **The research stage MUST re-verify the UI insertion points** — PR #271 reworked the plan-detail card components, so `r1-clone-design.md` §2's file:line are stale. Acceptance = the owner browser walkthrough (jsdom is blind to the pointer/modal layer). Separately, the gated api-server suite (now incl. the clone suites in main) is the owner's verify ritual for R1a — `pnpm db:reset && pnpm --filter @repo/api-server test`.

## Open decisions awaiting ratification

NONE — D-1..D-6 RATIFIED. (R2 slot parked, not blocking.)

## Live carry-forwards

R1A-GATED-ACCEPTANCE (owner verify ritual — clone suites now in main) · QA-005 (concurrent grouped-duplicate 409, deferred) · CLONE-002 (revalidate asymmetry, documented) · TEMPLATES (parked) · DND-GROUP-CREATE (wave G) · LABEL-FLOW-UX + QA-007 (wave A-known) · A-E2E-POLISH + P6 (open). ACTIVE-FLIP CLOSED (ACTIVE=coach-station in main). See `deferred.md`.

## Gotchas a resuming session must know

- **R1a is MERGED and LIVE in `main`** — the clone server endpoints (`/clone-from`, `/duplicate`), the `_shared/deep-clone.ts` engine, contracts, and the 6 `admin.clone.test.ts` suites are all in main. The isolated worktree is gone; work happens on `main` + feature branches now.
- **R1b is the VISIBLE half** — `/clone-from` + `/duplicate` have NO UI yet; R1b builds the affordances (duplicate icon-buttons, the week/day source-picker + danger-confirm) that call the live endpoints. Design = `r1-clone-design.md`. **This is what makes clone show up in the editor.**
- **⚠️ Re-verify R1b insertion points** — PR #271 (`feat/plan-editor-e2e-polish`, merged) reworked plan-detail components (schema-card-head, block-card-head, schema-row-card, session-card-head, the group-box-heads, schema-card-meta, intensity-fields, row-timeline-marker, …). `r1-clone-design.md` §2's file:line for affordance placement are PRE-#271 → the research stage must re-confirm them against current main.
- **Gated suite is the R1a verify ritual** — clone tests are in main's api-server suite now; `pnpm db:reset && pnpm --filter @repo/api-server test` runs them (db:reset only re-applies `lms-checks.sql` — no Prisma change). Owner-run.
- **The frozen primitive is Sacred** — clone reuses `SCHEMA_BODY_INCLUDE`, mappers, `verify*Ownership`, `resolveGroupedOrder`, contiguity asserts; never edits them.
- **P-6 (reps-unit)** stays a session-primitive freeze call — clone copies whatever leaf shape exists, insulated.
