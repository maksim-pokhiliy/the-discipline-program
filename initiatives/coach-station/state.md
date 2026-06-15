# coach-station — state (the board)

**Updated:** 2026-06-15 (**R1b clone editor-UX BUILT + owner browser walkthrough PASSED** on `feat/coach-station-r1b` — 6 commits `0f1f7b45`..`7460f907`; Review B+ / QA B−, **0 CRITICAL**; all WARNINGs fixed; platform jsdom 790/790 + contracts green; check-types/lint clean. **The R1 clone pillar is DONE — engine (R1a, in main) + UI (R1b).** D-7 ratified (content-anchored source-picker + new `GET …/weeks`). **NEXT: open the R1b PR** (this close-out rides in it), then wave P / G / A.)

A scannable board, not prose. Narrative → `journal.md`; why → `decisions.md`; carry-forwards → `deferred.md`.

## Board

| #   | Step                                        | Status                                     | Pointer                                                         |
| --- | ------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------- |
| 1a  | R1a — Clone server-engine (deep-clone D-3)  | 🟢 MERGED to main (PR #270)                | `r1a-server-runner-prompt.md` · gated suite owner-owed          |
| 1b  | R1b — Clone editor-UX (affordances + flows) | 🟢 BUILT — walkthrough PASSED (PR pending) | `r1b-editor-runner-prompt.md` · `r1-clone-design.md` · D-7      |
| 2   | P — Coach profile UI                        | 🔵 next (owner prepping)                   | D-5 · `p-coach-profile-runner-prompt.md` · `feat/coach-profile` |
| 3   | G — DnD group-creation                      | ⬜ pending                                 | deferred → DND-GROUP-CREATE                                     |
| 4   | A-known — Authoring polish                  | ⬜ pending                                 | deferred → LABEL-FLOW-UX / QA-007                               |
| —   | R2 — Templates/archetypes                   | 🅿️ parked                                  | D-2 · deferred → TEMPLATES                                      |
| —   | A-e2e — Authoring polish (e2e-fed)          | 🟠 open                                    | deferred → A-E2E-POLISH / P6                                    |

## Next action

**▶ Open the R1b PR** (`feat/coach-station-r1b` → `main`; 6 commits + this close-out). The owner browser walkthrough — the real acceptance gate (jsdom-blind pointer/modal/scroll/highlight layer) — **PASSED** ("потестировал в браузере, всё нравится"), incl. the two trigger tweaks (clone-week button left of the calendar, label "Clone into this week"). With clone visible end-to-end, the roadmap **Phase 2 Exit** (program a multi-week cycle, timed, beats Excel) is now testable — flag for the owner to time it. Then **wave P** (coach profile UI — backend shipped, just the form; the owner has the prompt + branch staged).

## Open decisions awaiting ratification

NONE — D-1..D-7 RATIFIED. (R2 slot parked, not blocking.)

## Live carry-forwards

R1A-GATED-ACCEPTANCE (the owner's gated api-server suite run — DoD "verified for real"; clone suites in main) · QA-005-CLONE (concurrent grouped-duplicate 409, R1a-deferred) · CLONE-002 (revalidate asymmetry, documented) · R1b-accepted INFO (QA-001-week toast count, QA-002 toast-split, QA-009/010 race-only) · TEMPLATES (parked) · DND-GROUP-CREATE (wave G) · LABEL-FLOW-UX + QA-007 (wave A-known) · A-E2E-POLISH + P6 (open). See `deferred.md`.

## Gotchas a resuming session must know

- **The R1 clone pillar is COMPLETE** — R1a engine (in main) + R1b UI (on `feat/coach-station-r1b`, PR pending). After merge, clone is live end-to-end in the plan editor.
- **D-7 (the R1b scope call):** the week/day source-picker is a content-anchored list backed by a NEW read endpoint `GET …/weeks` (populated weeks). The owner lifted "server is OUT" because the ratified list UX was unbuildable against main without it. READ-only; does NOT touch the frozen deep-clone engine. The day picker reuses the week-list + the existing single-week fetch.
- **The gated api-server suite is STILL owner-owed** (R1A-GATED-ACCEPTANCE) — `db:reset && pnpm --filter @repo/api-server test`. R1b added NO api-server test (the new GET's IDOR/correctness is covered by the static review + that gated ritual + the passed walkthrough). The new GET is additive + read-only; no Prisma change, no reseed.
- **The test harness now provides `QueryClientProvider` + `CloneHighlightProvider`** (`apps/platform/src/test/render.tsx`) — Phase 2/T3.7 made the cards require them; this was the harness fix in the test commit.
- **The frozen primitive stays Sacred** — clone reuses `SCHEMA_BODY_INCLUDE`, mappers, `verify*Ownership`, `resolveGroupedOrder`, contiguity asserts; never edits them.
- **P-6 (reps-unit)** stays a session-primitive freeze call — clone copies whatever leaf shape exists, insulated.
