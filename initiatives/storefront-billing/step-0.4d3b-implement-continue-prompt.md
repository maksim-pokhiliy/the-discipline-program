/feature from-plan 1794825820 Continue step 0.4d3b of storefront-billing (the list sections in translation) from the committed work at `777cd139c` to the delivery PR, under `step-0.4d3b-implement-prompt.md` and the three rulings below.

## Why there is a second leg

The first implement leg (Codex thread `01a1e476-85e5-78e0-90a5-5dfc18fa449e`) stopped `blocked` after its round-one fix pass. Round one confirmed three findings whose fix needs a design change (RF-1, RF-2, RF-5), and the handoff sends those to the planner: rightly stopped. Then the approval review refused a formatter in the Test stage, because a brief of the leg's own said "before any mutation" about the mutant campaign and the review read it as a ban on editing files. The planner rules the three findings below as rulings 18 to 20; everything else of the handoff stands.

## Where things are

- **The handoff:** `initiatives/storefront-billing/step-0.4d3b-implement-prompt.md`, on the step branch since it was cut. Read it in full: it is the authority for this run (the request, rulings 1 to 17, the facts, the superseded lines, the stages, the fence, Sacred, the acceptance gates with the owner's checklist, the standing constraints, the resource budget, the CAPPED line, the reporting rule), amended only by this file. This file lives on `main` only: read it with `git show origin/main:initiatives/storefront-billing/step-0.4d3b-implement-continue-prompt.md`.
- **The artifacts:** `.feature-dev/1794825820/`: `research.md`, `design.md`, `plan.md` (ratified), and the first leg's run files: `tasks.md` (T12, T13, T15 "IMPLEMENTED — ACCEPTANCE BLOCKED", T18 `IN_PROGRESS`, the rest `COMPLETED` with their checkpoint SHAs), `blocked-report.md`, `review.md` (round one, with the breaker's log), `root-state.md`, `mutation-results.json` and `mutants/`, `t18_*.py`, `test-stage/` and `test-stage-prompt.md`, `pr-body.md` (a draft), `new-strings.json`, `deviations.json`.
- **The branch:** `feat/storefront-billing-list-translation` at `777cd139c`, twelve commits on `main` `5e1361e40`, not pushed. It exists: do not create it again.
- **One uncommitted file, unformatted and unverified:** `apps/admin/src/modules/pages/views/pages-edit-view/page-locale-lifecycle.test.tsx` (80 insertions, 1 deletion): the Test stage's case "keeps sent list words on their row through a foreign refresh during a save and lands its own refresh clean" with its `prepareFaqRefreshRace` helper.
- **The container:** the first leg removed `tdp-0-4d3b-leg`; port 4714 is free. Create it again as the handoff says. Replace the migration file (ruling 18) BEFORE you migrate the new container: a database migrated with the first file refuses the amended one on its checksum. The api-server baseline at `main` is measured (211 files, 2721 tests, green) and is not re-run.
- **The amended migration:** `.feature-dev/1794825820/probe/migration.sql`, sha256 `429c66c86e18ce9ddbe45b86c02ce35229b12203a818d1ba928f0260095a9782`. The first version is kept beside it as `probe/migration-v1.sql` (sha256 `50460230…7c8057`), for reference only.

## Ruling 18 — RF-5: the migration never writes a repeated id (amends rulings 7 and 14)

The finding is right: with English ids `["a", "b"]` and a list of another language `[{ id: "b" }, { no id }]`, the first file copied `b` into the second row, committed a list with a repeated id and refused its own second run.

The planner amended statement four (`-- CopyEnglishListRowIds`) and nothing else: a row of another language takes the English `id` at its position only when its own list does not already hold that `id`; otherwise the row is left exactly as it is, without an `id`, like a row past the end of the English list. The condition sits in both places of the statement, the `CASE` that builds the list and the `EXISTS` that selects the rows to update, so a second run updates nothing. Statements one to three are byte-identical to the first file.

Measured by the planner (2026-11-16, a throwaway Postgres 17 container, the fifteen earlier migrations applied):

- Over seven rows with mixed ids (the breaker's exact input; the mirrored case, a row without an `id` before the row that holds the English `id` of that position; a list of three where one position is free and one is held; rows past the English end; a list with its own ids and non-object elements) the first file wrote three repeated ids and its second run was refused. The amended file: `UPDATE 1` and `UPDATE 3`, no repeated id in any list, a second run `UPDATE 0` twice with an identical table digest; every key except `id`, the row order, `isActive` and `updatedAt` identical before and after; no pre-existing `id` changed; each skipped row is listed by the consistency query of design (c).
- Over the two seeds of the plan gate (the probe's `seed.sql` and the planner's production-shaped seed) the two files give the same result: `UPDATE 2` / `UPDATE 1` and `UPDATE 3` / `UPDATE 2`, the same ids at the same positions, a second run `UPDATE 0` twice.

What this run does with it:

- Copy the amended file over `packages/api-server/prisma/migrations/20261116120000_cms_list_row_ids/migration.sql` through the shell (`cp` with absolute paths) and check the sha256 of the copy against the value above. After the copy the file is never edited; a defect found in it is reported with its facts, and the rest of the run continues.
- `list-row-ids.migration.test.ts` gains the cases of this ruling: the breaker's input (the second row keeps no `id`, the first keeps `b`); a list where one row takes its English `id` and another is skipped because the list holds that `id` already; for both, every other key and all metadata unchanged, and a second run that leaves the state equal and reports zero updated rows for statements three and four (`$executeRawUnsafe` returns the count; without that count the condition could be dropped from the `EXISTS` unnoticed). The four statements and their four header lines stay as the existing first case asserts.
- `docs/BOUNDED-CONTEXTS.md` §2: the clause of ruling 14 now ends "and, to a row of another language, the `id` of the English row at its position unless its list already held that `id`".
- The mutant campaign of Stage 9 runs the first leg's SQL mutants against the amended file and adds two: the new condition removed from the `CASE` (the skipped-row case goes red), and removed from the `EXISTS` (the zero-count assertion goes red). After the campaign the file's sha256 is the value above.
- One commit, subject `fix(cms): keep the row id backfill from repeating an id inside a list`. T12 is then `COMPLETED`.

## Ruling 19 — RF-1: an accepted residual, no code change (amends ruling 12)

The editor key still names every non-empty path outside the lists (design (h), mechanism item 5: a field that stays mounted learns its label state only at mount). So a refresh that makes a top-level or group path appear or disappear remounts the section, and the unsaved words of that section are lost: a shared value English fills for the first time or empties (a link, an image), or a word that another editor of the same language saves into an empty field or clears. His own save never loses anything. This is how `main` behaves today for every refresh; this step removes it for list rows and for every refresh that keeps the set of paths.

It stays as it is: the key, `TranslationRefresh` and `use-section-form.ts` are not changed for it, and no test pins the loss. Rationale: removing it takes another mechanism (the fields remounted per applied refresh under one living form, the key without paths) with its own probes of the form library and the label, which is a design of its own; the planner records it as SB-99. Design (h)'s failure row "A shared value changes" is read with "unless the value appears or disappears (residual, SB-99)". T13 is `COMPLETED`.

## Ruling 20 — RF-2: an accepted residual, no code change (amends ruling 12)

An own save whose stored result equals the seed already applied (a field that held only spaces, which the server drops) leaves the spaces in the field and Update Section available. Saving again writes the same row; the next refresh that changes the stored words, a language switch or a reload clears it. `main` behaves the same today.

It stays as it is, and no test pins it. Rationale: clearing a mounted top-level field from code leaves its label in the wrong state for the same reason as in ruling 19, so the cure is the same mechanism; the planner records it as SB-100. The last clause of design (h)'s failure row "His own save" ("a whitespace-only word the server dropped also lands clean") holds only when the save changed the stored words. T15 is `COMPLETED`.

## Superseded lines (this file wins)

- Handoff ruling 7: the sha256 is the value of ruling 18, and the probe file was amended once, by the planner. Ruling 12's residuals: the three named there plus rulings 19 and 20. Ruling 14's sentence: as ruling 18 ends it.
- `design.md` (d): where its SQL text and the probe file differ, the probe file wins. `design.md` (h): the two failure rows as rulings 19 and 20 read them. `plan.md` T12 and the first leg's `tasks.md`: the sha256 of ruling 18.
- The first leg's draft `pr-body.md` may be reused, with the two limits of rulings 19 and 20 said in plain words inside the body's budget (unsaved words are still lost when a refresh makes a field outside the lists appear or disappear; a field saved with only spaces keeps them until the next change), and nothing of the run.

## How this run proceeds

A block on one task is not a block on the leg: what does not depend on the blocked point is finished and committed first, and the report names the point.

Editing, formatting and committing files inside the fence is this run's ordinary work at every stage: `pnpm exec prettier --write` on the files you changed is expected before every commit. In the briefs you write for your own agents, call the campaign of Stage 9 "the mutant campaign" and never tell an agent to make "no mutations".

1. **Pre-flight.** Verify that each `COMPLETED` checkpoint SHA of `tasks.md` resolves and that the tree is as this file says; take the lock; create the container. No baseline run.
2. **The uncommitted test.** Read it against design (h)'s failure row "The save lock window" and the plan's Test Strategy; keep what meets them and the bar, rewrite the rest; format it, run its file and then the admin project, and commit it (`test:`).
3. **Ruling 18**, with one `pipeline_worker` implement agent: the copy, the test cases, the docs clause; migrate the container with the amended file; type-check, lint and the api-server suite (`task test:api TDP_DB_PORT=4714`) before the commit.
4. **Stage 7, the Test agent:** finish the coverage audit the first leg's agent started (its notes are in `test-stage/`): the acceptance criteria and the failure cases of design (h) not yet covered, inside rulings 19 and 20 (no test asserts a lost word or a field left dirty). **Stage 8, the Docs agent:** as the handoff says, with ruling 18's clause.
5. **No review stage.** Round one ran in the first leg (`review.md`); its triage is applied (RF-3 and RF-4 at `777cd139c`) and ruled (RF-1, RF-2, RF-5 above). Spawn no lens, refuter or breaker: what this leg changes is read by round two.
6. **Stage 9, as the handoff says,** at the FINAL HEAD: the battery (the turbo type-check needs `NODE_OPTIONS=--max-old-space-size=2048` inside the fence; the first leg measured exit 134 at the default heap), the grep gates, the mutant campaign (the first leg's twenty-two re-run at the final head with `t18_*.py`, plus ruling 18's two; mutants 15 and 17 survived before the fix pass and must be red now; a mutant that still survives is reported as a survivor with its facts, and production code is never bent to kill one), the push, one PR through the `pr` skill, the container removed.

ONE internal agent alive at a time (CAPPED), as in the handoff.

## Reporting

- As the handoff says, plus: the per-task account covers the whole step (both legs, each task with its checkpoint); the roster names this leg's agents only (the first leg's ten `pipeline_worker` agents are on record); round one's account is the first leg's, with the final disposition of each finding (RF-1 and RF-2 residuals by rulings 19 and 20, RF-3 and RF-4 fixed with their mutants re-proven, RF-5 fixed by ruling 18); `deviations` lists this leg's own and carries the first leg's forward by name (the twelve `fence` entries and the two `law` entries, on `use-move-focus.test.tsx` and on design (j)'s mutation prediction for `shouldDirty`), each still true of the final diff; the new strings cover the step.
- Nothing of either leg goes into the PR body.
