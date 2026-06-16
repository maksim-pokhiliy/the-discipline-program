# coach-station — state (the board)

**Updated:** 2026-06-16 (**R1b clone editor-UX done (PR #274) + wave P coach-profile MERGED (PR #273)**. R1b: 6 commits `0f1f7b45`..`7460f907`; Review B+ / QA B−, 0 CRITICAL; walkthrough PASSED; platform jsdom 790/790. **The R1 clone pillar is DONE — engine (R1a, in main) + UI (R1b).** D-8 ratified (content-anchored source-picker + new `GET …/weeks`); wave P shipped the schema-extended coach profile (D-7 PROFILE-SCHEMA-EXTENDED). **NEXT: merge R1b PR #274** (conflicts with main resolved — initiative-doc union + R1b D-7→D-8 renumber; owner-gated by the api-server ritual), then G / A-known / R2-slot.)

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`.

## Board

| #   | Step                                        | Status                                 | Pointer                                                    |
| --- | ------------------------------------------- | -------------------------------------- | ---------------------------------------------------------- |
| 1a  | R1a — Clone server-engine (deep-clone D-3)  | 🟢 MERGED to main (PR #270)            | `r1a-server-runner-prompt.md` · gated suite owner-owed     |
| 1b  | R1b — Clone editor-UX (affordances + flows) | 🟢 DONE — walkthrough PASSED (PR #274) | `r1b-editor-runner-prompt.md` · `r1-clone-design.md` · D-8 |
| 2   | P — Coach profile UI                        | 🟢 MERGED (PR #273)                    | D-7 PROFILE-SCHEMA-EXTENDED · `feat/coach-profile`         |
| 3   | G — DnD group-creation                      | ⬜ pending                             | deferred → DND-GROUP-CREATE                                |
| 4   | A-known — Authoring polish                  | ⬜ pending                             | deferred → LABEL-FLOW-UX / QA-007                          |
| —   | R2 — Templates/archetypes                   | 🅿️ parked                              | D-2 · deferred → TEMPLATES                                 |
| —   | A-e2e — Authoring polish (e2e-fed)          | 🟠 open                                | deferred → A-E2E-POLISH / P6                               |

## Next action

**▶ Merge the R1b PR #274** (`feat/coach-station-r1b` → `main`) — conflicts with main RESOLVED (initiative-doc union + R1b's decision renumbered D-7→D-8, since wave P's D-7 PROFILE-SCHEMA-EXTENDED landed in main first via PR #273). Owner-gated by the api-server suite ritual (`db:reset && pnpm --filter @repo/api-server test`); the R1b owner browser walkthrough already PASSED ("потестировал в браузере, всё нравится"). With clone (R1) + profile (P) both in, the roadmap **Phase 2 Exit** (program a multi-week cycle, timed, beats Excel) is testable — flag for the owner to time it. Then **wave G** (DnD group-creation) / A-known / R2-slot.

## Open decisions awaiting ratification

NONE — D-1..D-8 RATIFIED. (R2 slot parked, not blocking.)

## Live carry-forwards

R1A-GATED-ACCEPTANCE (the owner's gated api-server suite run — DoD "verified for real"; clone suites in main) · QA-005-CLONE (concurrent grouped-duplicate 409, R1a-deferred) · CLONE-002 (revalidate asymmetry, documented) · R1b-accepted INFO (QA-001-week toast count, QA-002 toast-split, QA-009/010 race-only) · P-GATED-ACCEPTANCE + QA-006/QA-007 (wave P, owner-owed) · TEMPLATES (parked) · DND-GROUP-CREATE (wave G) · LABEL-FLOW-UX + QA-007 (wave A-known) · A-E2E-POLISH + P6 (open). See `deferred.md`.

## Gotchas a resuming session must know

- **The R1 clone pillar is COMPLETE** — R1a engine (in main) + R1b UI (PR #274). After #274 merges, clone is live end-to-end in the plan editor.
- **Wave P (coach profile) is MERGED** (PR #273) — schema-extended profile + credentials + avatar upload live at `/coach/profile`. Owner-owed: the gated api-server suite + `BLOB_READ_WRITE_TOKEN` in `apps/platform/.env.local` for avatar upload (see `deferred.md` → P-GATED-ACCEPTANCE).
- **D-8 (the R1b scope call):** the week/day source-picker is a content-anchored list backed by a NEW read endpoint `GET …/weeks` (populated weeks). The owner lifted "server is OUT" because the ratified list UX was unbuildable against main without it. READ-only; does NOT touch the frozen deep-clone engine. The day picker reuses the week-list + the existing single-week fetch.
- **The gated api-server suite is STILL owner-owed** (R1A-GATED-ACCEPTANCE) — `db:reset && pnpm --filter @repo/api-server test`. R1b added NO api-server test (the new GET's IDOR/correctness is covered by the static review + that gated ritual + the passed walkthrough). The new GET is additive + read-only; no Prisma change, no reseed.
- **The test harness now provides `QueryClientProvider` + `CloneHighlightProvider`** (`apps/platform/src/test/render.tsx`) — Phase 2/T3.7 made the cards require them; this was the harness fix in the R1b test commit.
- **The frozen primitive stays Sacred** — clone reuses `SCHEMA_BODY_INCLUDE`, mappers, `verify*Ownership`, `resolveGroupedOrder`, contiguity asserts; never edits them.
- **P-6 (reps-unit)** stays a session-primitive freeze call — clone copies whatever leaf shape exists, insulated.
- **`/coach` dashboard redesign ("Triage Stack" + real-data backend) shipped** as a self-contained wave (NOT a board pillar) — durable record `coach-dashboard-redesign.md`; the shared `coach-metrics` engine + 9 new `@repo/ui` primitives are the foundation for the wider apps/platform redesign. Owner-owed: the gated api-server suite (`deferred.md` → REDESIGN-GATED-ACCEPTANCE); open follow-ups PERF-001 / QA-METRICS-2 / HEALTH-CHIP-FROM-MESSAGE.
