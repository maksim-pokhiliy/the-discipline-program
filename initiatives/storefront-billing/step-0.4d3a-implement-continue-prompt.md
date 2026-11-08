/feature from-plan 1794092977 Continue step 0.4d3a of storefront-billing (languages in the page editor) from the three verified checkpoints and the preserved wave-four work to the delivery PR, under `step-0.4d3a-implement-prompt.md` and the amendment below.

## Why there is a second leg

The first implement leg (Codex thread `01a1bb6b-eb8d-70c0-89e4-b62b1a9c52c1`) stopped `blocked` in wave four, rightly: ruling 11 of the handoff asks for design §8.2 verbatim, and the last sentence of §8.2's item 1 contradicts the handoff's own state rule (its "Superseded lines", the R3 entry). The planner rules the contradiction below; everything else of the handoff stands.

## Where things are

- **The handoff:** `initiatives/storefront-billing/step-0.4d3a-implement-prompt.md`, on the step branch since `17c222b00`. Read it in full: it is the authority for this run (the request, rulings 1 to 12, facts, superseded lines, the stages, the fence, Sacred, the acceptance gates, the standing constraints, the resource budget, STOCK, the reporting rule), amended only by this file. This file lives on `main` only: read it with `git show origin/main:initiatives/storefront-billing/step-0.4d3a-implement-continue-prompt.md`.
- **The artifacts:** `.feature-dev/1794092977/`: `research.md`, `design.md`, `plan.md` (ratified), and the first leg's run files: `tasks.md` (T6, T12, T15 `FAILED`; T13, T16 `PENDING`; the rest `COMPLETED` with their checkpoint SHAs), `blocked-report.md`, `orchestrator-progress.md`, `run-state.json`, `gates.jsonl`, `verification-summary.json`, the wave reports `wave1-*` to `wave4-*`, `wave3-field-diagnostic.md`, `browser-checklist.md`, `new-strings.json`, `run-gate.py`.
- **The branch:** `feat/storefront-billing-editor-locales` at `6cb7e715c`, not pushed. It exists: do not create it again. Checkpoints: `d24a009e1` (T1, T2, T8, T14), `305bb83bc` (T3, T4, T7, T10), `6cb7e715c` (T5, T9, T11).
- **The uncommitted wave-four work, unverified:**
  - T6: `apps/admin/src/app/api/admin/pages/route.ts` (modified) and `route.test.ts` (new).
  - T12: `section-editor/index.tsx`, `section-editor-key.ts`, `section-editor-key.test.ts`, `section-editor.test.tsx`, `pages.fixtures.tsx`, `views/pages-edit-view/pages-edit-form.tsx` (modified); `section-editor/clear-translation-button.tsx`, `section-editor-actions.tsx`, `section-editor-form.tsx`, `section-notices.tsx`, `section-state-chip.tsx`, `translation-form-values.ts`, `use-section-form.ts` (new). Still missing by the first leg's account: `translation-form-values.test.ts`, `section-translation.test.tsx`, formatting, the function-cap review and the translated-form acceptance coverage.
  - T15: `docs/BOUNDED-CONTEXTS.md` §2 with the §8.2 sentences.
- **The container:** the first leg removed `tdp-0-4d3a-leg`. Create it again on 4714 and migrate it as the handoff says; the api-server baseline at `main` is already measured (`baseline-api.log`: 208 files, 2604 tests, green) and is not re-run.

## The amendment to ruling 11 (planner, 2026-11-08)

The last sentence of the invariant "A non-default section row is live only when every word is written" (design §8.2, item 1) is written as:

> Any inactive non-default row that the reader would otherwise serve reads as a draft in the editor, including the rows the hide-first rollback note of ADR-0045 deactivates.

Every other sentence of §8.2 stays verbatim. The state code stays as it is (`page-sections.ts`, `sectionTranslationState`: a row that fails `isServedSectionRow` is `NOT_TRANSLATED` before `isActive` is read). Rationale: the ratified rule (the handoff's R3 superseded line, design §5.3.3 and its state tests in §8.1) makes a row that fails to parse, an empty row and a row of another page not translated whatever its `isActive`, so a no-word save and a clear, which store an inactive `{}`, read as not translated; the §8.2 sentence was looser than the rule it documents. The rows ADR-0045's rollback note hides hold the coach's words, so they still read as drafts.

## How this run proceeds

- **Stage 4 resumes from `tasks.md`** by the skill's resume rules: verify each `COMPLETED` checkpoint SHA resolves and skip it; T6, T12 and T15 are retried, T13 and T16 run.
- **The preserved files first.** Before building on the uncommitted work, read each file above against its task in `plan.md`, design §5.4 and the rulings, and keep only what meets them and the bar; rewrite the rest. Nothing is committed unverified: type-check, lint and the affected tests before every checkpoint, as the handoff says. The explicit `"en"` that the first leg passed from `PagesEditForm` until T13 is replaced by T13's resolved locale; no default or fallback locale remains in production code.
- **Then the handoff's stages, unchanged:** the rest of Stage 4 with `pipeline-worker` implement agents (T6, T12 and T15 to their checkpoints, T13, T16), Stage 5–6 (review-flow at deep, round one, one fix pass), Stage 7–8 (Test and Docs agents; the Docs agent checks §2 against the final code, ruling 11 as amended here), Stage 9 (the battery at the final head, the grep gates, the mutants of design §8.1 and plan T16 without M14 plus ruling 1's position mutant, the push, one PR through the `pr` skill, the container removed).

## Reporting

- As the handoff says, plus: the per-task account covers the whole step (both legs, each task with its checkpoint); the roster names this leg's agents only (the first leg's eight implement workers are on record); `deviations` lists this leg's own and carries the first leg's forward by name (the thirteen `fence` entries and the `law` entry on `page-save-lifecycle.test.tsx`'s last disabled assertion), each still true of the final diff; the new strings cover the step.
- Nothing of either leg goes into the PR body.
