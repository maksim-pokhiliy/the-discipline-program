/feature from-plan 1794825820 Implement step 0.4d3b of storefront-billing (the list sections in translation) from the ratified artifacts to the delivery PR, under the rulings below.

You are the IMPLEMENTER of step 0.4d3b. The planner's Opus executor researched, designed and planned this step, and the plan was ratified at the plan gate on 2026-11-16 (the rulings below; no revision round). Nothing is implemented yet: the tree is on `main`, clean, and the ratified artifacts are on disk. Your run is `/feature from-plan`: Stage 4 pre-flight, the implementation of the plan's eighteen tasks, round one of the step's two review rounds, the tests, the documents and the PR.

## Where things are

- Branch `main` at `081866115` or later (the planner's docs commit with this file lands on `main` before you start), checked out and clean; base branch `main`. You create `feat/storefront-billing-list-translation` from it at Stage 4 pre-flight; one PR against `main`.
- `.feature-dev/1794825820/`: `research.md`, `design.md` and `plan.md` (eighteen tasks in seven waves under "Task Order"), and `probe/` with `migration.sql`, `seed.sql` and `consistency.sql`. In `design.md`: the architecture §5.1, the item schemas §5.2, the server behaviour §5.3 and §5.4.2, `DynamicListItem` §5.4.3, the shared list editor §5.4.4, the unsaved words §5.4.5, the banner §5.4.6, the types §5.6, the compatibility surface §8, "Request vs tree", and the plan-gate answers (a) to (m): the registry (a), the server guarantee (b), the end of positional pairing (c), the migration and its test (d), the editor and the `LIST_SECTIONS` table (e), the reference paths and the layout (f), the `DynamicListItem` props and the strings (g), the refresh mechanism and its failure cases (h), the lifecycle test rewrites site by site (i), the test files with their mutants (j), the docs sentences (k). They are the ratified artifacts; where a ruling below and an artifact disagree, the ruling wins.
- The step prompt: `initiatives/storefront-billing/step-0.4d3b-prompt.md`. Read it in full: its rulings R1–R11, "Live-verified facts", the Sacred line and the acceptance gates are the request's detail; the lines this file supersedes are listed under "Superseded lines".
- The initiative: `initiatives/storefront-billing/` (`state.md`, `decisions.md` D-21, D-22, D-24 with its amendments, `deferred.md` rows SB-79, SB-82, SB-83, SB-84, SB-90, SB-91, SB-92, SB-93, SB-94, SB-95, SB-98, `design-0.4-admin-pages-editor.md`). Read-only for you: nothing under `initiatives/` enters a commit.

## The step's request (the step prompt's opening, verbatim)

## Mission

Since 0.4d3a (PR #458, on production since 2026-11-16) the coach edits every page in any
language: words start empty with the English beside each, links and images come from
English, a section is a draft until every word is written (D-24). Six sections hold lists,
and their forms were left out of that step: `home:whyChoose` (`features`), `about:journey`
(`timeline`), `about:credentials` (`items`), `faq:content` (`items`), `offer:requisites`
(`items`), `offer:terms` (`blocks`). In another language these six still show no English
beside their fields, still offer "add", "move" and "remove" although the server keeps the
English row set, and in five of them a translated word belongs to a row's POSITION: remove
or move an English row after translating and the words of the rows below slide onto the
wrong rows.

This step brings the six into the same translation. The coach's walk after it: he opens the
FAQ in Ukrainian; every question and answer shows its English beside the input; there is
nothing to add, move or remove here, because the list is English's; he writes the words and
the section turns translated. Back in English he moves a question up and removes another:
in Ukrainian every remaining answer is still under its own question. In English the row
controls no longer lose keyboard focus at the edges of a list.

One delivery PR, these deliverables:

1. A row identity for every list (SB-91): the five item schemas without an `id` gain one,
   the registry names it as the identity of all six lists, a row added in the editor gets
   an `id` at once, and the server stores no English list row without one.
2. One data migration that gives an `id` to every stored list row that lacks one, keeping
   today's positional pairing of a translation with its English row (R4).
3. One shared list editor for the six sections (SB-83): rows, the count, add, move, remove
   in English; outside English no structure controls and the English reference beside every
   word of every row, through the mechanism 0.4d3a built for the other forms; the words
   outside the rows (a list section's title and subtitle) get the reference too.
4. The row controls keep keyboard focus and name their row (SB-82).
5. The unsaved words of a form open in another language survive a refresh of the page under
   it (SB-94), or the gate says why that is not this step's (R7).
6. The two load-sensitive lifecycle tests assert a held state, not a race (SB-93, SB-98).
7. Tests for all of the above; `docs/BOUNDED-CONTEXTS.md` §2 where it names the row
   identity and the structure rule.

Not yours: the marketing site (it reads list rows through `deepPartial` shapes and keys
them by their own content; nothing there changes); product translations (0.4c, 0.4e); the
switcher and `/{code}` routes (0.4f); the offer page on the site (0.4g); the production
apply of the migration (the planner dispatches it by `docs/runbooks/db-migrate-dispatch.md`
on the owner's word, before the merge).

## Plan-gate rulings (owner and planner, 2026-11-16)

The owner gave the run's shape at the contour («step delegated capped => feature full, id ставим миграцией»): delegated mode, CAPPED, full calibre, the row ids supplied by a data migration. The plan gate carried one item to him, the split into two PRs, with the planner's recommendation to keep one, and he answered «давай оставим один ПР» (ruling 1). The rest are the planner's. Where a ruling and an artifact disagree, the ruling wins; the artifacts were not regenerated.

1. **One PR, as planned (owner).** The Scope Check's LARGE FEATURE warning (18 tasks, 65 files) was carried to the owner and the split is not taken. Rationale: the row identity and the editor are two halves of one contract, the coach starts translating only after both land (D-22), and the production dispatch happens once.
2. **G-1 granted:** `packages/ui/src/components/use-move-focus.ts` and `use-move-focus.test.tsx`, not exported from the barrel. Rationale: the focus rule is a rule of its own with a direct test.
3. **G-2 granted:** `packages/api-server/src/endpoints/cms/pages/list-row-identity.ts` and `list-row-identity.test.ts`. Rationale: one concern (a list row's identity), read by `section-translation.ts` and `admin.ts`.
4. **G-3 refused: no file under `docs/runbooks/` enters this PR.** Plan task T17 changes `docs/BOUNDED-CONTEXTS.md` only; the runbook text at `plan.md` "Runbook section text" is the planner's to record in his own docs commit. Rationale: the production dispatch is the planner's, and the earlier steps' runbook sections came from his docs commits, not from step PRs.
5. **The server guarantee (design (b)) stands as written:** `withEnglishRowIds` on the English branch of `updateSection`, after the empty-English guard and before any database access; a missing, empty or non-string `id` is minted with `randomUUID()`; two rows of one list sharing a non-empty `id` are refused with `BadRequestError("Two rows of the list share the id ${id}", { section, list, id })`, nothing written; `structuredClone` goes.
6. **The end of positional pairing (design (c)) stands as written:** `rowIdentity` is deleted, `matchRow` matches by `rowIdOf` only, and an English row without an `id` takes no words; the table of design (c) is the behaviour of a stored row without an `id`, path by path. The freeze, the consistency query and the cure of design (c) are the planner's runbook, not code.
7. **The migration is the probed file, byte for byte.** `packages/api-server/prisma/migrations/20261116120000_cms_list_row_ids/migration.sql` is a copy of `.feature-dev/1794825820/probe/migration.sql` (sha256 `50460230a95bd560f2b4d0a7712f9a918c58e148b199251a37c963a1ee7c8057`), made through the shell (`mkdir -p` and `cp` with absolute paths), with the sha256 of the copy checked against that value. The guard statement (non-text ids, ids repeated inside one list) is accepted: the dispatch runbook requires it and it changes no data. If the text of design (d) and the probe file ever differ, the probe file wins: it is the file the planner ran. After the copy the file is never edited; a defect found in it by any stage is a design-change escalation in your report, never a fix.
8. **The migration's test (design (d)) stands as written:** it reads the file by its path, splits it on its `-- ` header lines, asserts exactly four statements and runs them in order inside one `cleanupRaw.$transaction` with `$executeRawUnsafe`, under the marketing-state capture, clear and restore protocol.
9. **The shared list editor (design (e) and (f)) stands as written, the deletions included:** the six form files, `why-choose-feature-card.tsx`, `list-section-forms.test.tsx`, the two offer form tests (their cases move to the two new editor test files) and `HomePageWhyChooseData` are deleted; what a section still owns is one `LIST_SECTIONS` entry and one `SECTION_FORMS` composition. In English every list section renders as today: the same card title, labels, input sizes, columns, line counts, the count divider and the dashed add button. One difference is accepted: the gaps around the count divider follow the title forms' own `spacing={3}`. Outside English every row field takes the whole row, as design (f) says.
10. **`DynamicListItem` (design (g)) stands as written:** the props, the control column rendered only when handlers are given, `aria-disabled` with a guarded `onClick` and never the `disabled` attribute, the focus restored after every move by `useMoveFocus`. The focus test emulates the browser's focus fixup with the test-local shim of plan T1, because jsdom keeps focus across a re-insertion (design probe P1); the real keyboard behaviour is the owner's browser check.
11. **The strings: the eight rows of design (g) stand as written**, the positional control names (`Move FAQ item 2 up`) and the restored first sentence of the banner included.
12. **R7 lands in this step (design (h)), with its residuals accepted:** `keptWords`, the renderless `TranslationRefresh`, `defaultValues` for a form in another language, the editor key that stops at a list, and `handleClear` resetting to the applied seed before it sends `{}`. Accepted residuals: a refresh that lands while he types in a row remounts that row (the value is kept, the focus is not); English writing the first rows of a list whose key was absent remounts the section; the words of a row English removed leave with the row. `apps/admin/src/lib/hooks/use-pages.ts` is not changed.
13. **The lifecycle tests (design (i)) stand as written**, site by site, the site at `page-locale-lifecycle.test.tsx:312-313` included.
14. **The docs:** the sentences of design (k), located by their text (the line numbers there are a snapshot), verbatim, with one amendment. In the inserted sentence, the clause "and the migration `20261116120000_cms_list_row_ids` gave every stored row one (another language's row took the `id` of the English row at its position)" reads "and the migration `20261116120000_cms_list_row_ids` gave one to every stored English row and, to a row of another language, the `id` of the English row at its position". Rationale: a row of another language past the end of the English list keeps no `id`, so "every stored row" was false. No ADR, no CHANGELOG, no runbook (ruling 4).
15. **The owner's checklist has two corrected items** (they are already corrected in the acceptance gates below): the Why Choose item names the "Icon Name" field, which is a text field and not a picker; the unsaved-words item waits more than 30 seconds before coming back, because the page query is fresh for 30 seconds and a focus refetch fires only on stale data.
16. **Fence deviations granted in advance** (record each in your report's `deviations` all the same): the files of rulings 2 and 3; `packages/api-server/src/endpoints/cms/pages/__fixtures__/section-data.ts` and `__fixtures__/translation-rows.ts` (rows gain ids); `admin.locale.test.ts` and `admin.translation.test.ts` (rows carry ids; the new guarantee and R3 cases); `packages/contracts/src/entities/cms/pages/pages.types.ts` (`HomePageWhyChooseData` deleted); the new `list-row-ids.migration.test.ts` beside the pages endpoints; any barrel that a new export of the plan needs.
17. **The design stands for everything else**, as written.

## Facts established since the step prompt was written (the planner's own measurements, 2026-11-16 at `081866115`)

- The probed migration file, run by the planner in a throwaway Postgres 17 container (all fifteen migrations applied) over synthetic rows shaped like production's (4 journey, 3 credentials and 3 FAQ English rows without an `id`, 3 Why Choose rows with one, plus rows of another language: a full FAQ, a journey with one row past the English end, a Why Choose with its own ids, an empty credentials): `UPDATE 3` and `UPDATE 2`; a second run `UPDATE 0` twice with an identical table digest; the digest of everything except the `id` keys (other keys, row order, `isActive`, `updatedAt`) identical before and after; every row of another language carries the `id` of the English row at its position; the row past the English end has none.
- Production, read-only: `home:whyChoose` holds 3 rows with 3 distinct text ids, so the guard passes; `marketing_page_sections.data` is `jsonb`; one language (`en`), no row of another language.
- The plan's typing assumptions (`plan.md` Risks 7) compile at `081866115` under the packages' own configs: `payload.data` of `UpdatePageSectionData` is assignable to `Prisma.InputJsonObject`; `SectionWriteData[TKey]` is assignable to `Readonly<Record<string, unknown>>`; `SectionTextField<Record<string, Record<string, string>[]>>` accepts a `${string}.${number}.${string}` name. The fallbacks of Risks 7 are not needed.
- `react-hook-form` is 7.60.0 in the admin; `keepFieldsRef` is in its types (`dist/types/form.d.ts:122`). The page query's stale time is 30 seconds (`packages/query/src/providers/query-provider.tsx:20`).
- An English scaffold writes `{}` with the list key absent, not an empty list (`packages/api-server/src/endpoints/cms/pages/page-sections.ts:118-127`); the Why Choose "Icon Name" is a free-text field; in a browser focus is lost on every "Move down", not only at an edge (design "Request vs tree" 1 to 3).
- Baselines at `081866115` (the executor's research, fenced): contracts 87 files and 1452 tests, admin 45 and 431, ui 34 and 279, all green; `check-types` of contracts, ui, api-server and admin clean. The api-server suite and the admin build were not run.
- This run is CAPPED: another session of the owner shares the host.

## Superseded lines (this file wins)

- The step prompt's "STOP at the plan gate" and "End every turn" lines: nothing resumes a Codex leg. The gate is answered (this file); the flow's triage is the ruling, applied at once in one fix pass; you stay in your turn on `wait_agent` until every helper has reported, and your final message ends the run.
- R5's "The six forms keep what differs": they keep it as config; the files are deleted (ruling 9). R5's and the checklist's "icon choice": the "Icon Name" text field (ruling 15).
- R6's "After a move that puts a row at an edge": after every move (ruling 10).
- R11's "the Invariants line": also the consumer-apps sentence that says the reference covers the forms that are not lists (ruling 14).
- The "Live-verified facts" clause "the scaffold of an English section starts with an empty list": the scaffold writes `{}` and the list key is absent.
- The scope fence's grant of `apps/admin/src/lib/hooks/use-pages.ts`: not used (ruling 12).
- `plan.md`: "Gate items this plan assumes granted" names G-3 as granted, and T17 names `docs/runbooks/db-migrate-dispatch.md`: ruling 4 applies, T17 is `docs/BOUNDED-CONTEXTS.md` only. T12's "written through the shell, `cat > … <<'SQL'`": the copy of ruling 7. T17's "verbatim": with ruling 14's amendment.
- `design.md` "Request vs tree" 11 and (m) item 11 recommend granting the runbook section: refused (ruling 4). `design.md` (k)'s inserted sentence: amended (ruling 14).

## How this run proceeds

A block on one task is not a block on the leg: what does not depend on the blocked point is finished and committed first, and the report names the point.

### Stage 4 — pre-flight and implementation

- Create `feat/storefront-billing-list-translation` from `main`; take the lock as the skill says; write `tasks.md` from `plan.md` (eighteen tasks, seven waves under "Task Order"), with rulings 4, 7, 9, 14 and 15 folded into the tasks they touch.
- Create your database container (below), migrate it, and take the api-server baseline at `main` before the first change.
- Implement wave by wave, in the plan's order, with `pipeline_worker` implement agents as the skill says, ONE agent alive at a time (CAPPED). Wave 1 lands as one commit, as the plan says; then one checkpoint commit per task, each with a typed lowercase subject; type-check, lint and the affected tests before every commit; the tree committed before every spawn; file presence re-verified after every agent round.
- No UI visual check by you: the browser pass is the owner's.

### Stage 5–6 — review-flow at deep, round one of two

- Run the flow as the skill says: fresh lenses, refuters and breaker as `pipeline_worker` agents, one alive at a time, the sweep, the synthesis into `.feature-dev/1794825820/review.md`, the triage, then exactly one fix pass. Caller context for the flow: this file (the request and the rulings), `research.md`, `design.md`, and the battery commands below.
- The triage is the ruling: apply exactly the fix-now set in one pass (a typed checkpoint subject naming the change), run type-check, lint and the affected tests before the commit, and never re-review the fix diff. A finding whose fix would add a mechanism, cross the fence, change a contract or change the migration file is never fix-now: it is a carry-forward or a deferral in the report, or a design-change escalation that ends the run `blocked` with the facts.

### Stage 7–8 — Test and Docs

- Test agent: the regression tests of the fix-now set, the acceptance criteria not yet covered (`plan.md` Test Strategy and design (j); the tasks already write the planned tests, so fill gaps and do not duplicate), the design's failure cases of (h).
- Docs agent: plan task T17 lands in wave 6; this agent checks `docs/BOUNDED-CONTEXTS.md` §2 against the final code and ruling 14, and corrects drift only.
- Checkpoint commits, `test:` then `docs:` (a stage with nothing to change commits nothing).

### Stage 9 — finalize

- The battery at the FINAL HEAD, inside the fence, one heavy command at a time: `pnpm exec vitest run --project contracts --maxWorkers=2`; `--project admin`; `--project ui`; `--project platform` (it must not notice the change); `task stack:migrate TDP_DB_PORT=4714` then `task test:api TDP_DB_PORT=4714` (serial, against your container, `SHADOW_DATABASE_URL` pointing at your container's `tdp_shadow`); `pnpm check-types`, `pnpm lint`, `pnpm dep:check`, `pnpm format:check` (turbo tasks with `--concurrency=1`; the non-mutating per-package eslint before `pnpm lint`, then `git status` clean); the admin build with `NODE_OPTIONS=--max-old-space-size=2048`.
- The grep gates of the acceptance gates (below) and of plan T18.
- The mutants of design (j) and plan T18: every mutant applied to a file whose content copy was taken first, the run recorded, the file restored from the copy and verified by sha256 (never `git checkout --` / `git restore`), every change committed before the campaign starts; the migration file is restored like any other, and its sha256 after the campaign is the value of ruling 7. The results go in the report.
- Push the branch and open the PR through the `pr` skill (pipeline mode: head and base fixed, no branch question). Body per `~/.claude/skills/_shared/pr-template.md`, inside its budget, with the owner's checklist AS CHECKBOXES (below) and the one sentence about the data migration; nothing about the run, no mutants, no counts, no finding IDs; no Cyrillic (the language is "Ukrainian").
- Remove your container when the PR is open. Report, with the tree state.

## Scope fence (from the step prompt, verbatim, with the grants of rulings 2, 3 and 16 and the refusal of ruling 4)

- **Touch:** `packages/contracts/src/entities/cms/pages/pages.schema.ts` (the five item
  schemas, nothing else in it), `section-field-kinds.ts`, `pages.types.ts` and
  `pages-api.types.ts` only where a row type is named, and their tests;
  `packages/api-server/src/endpoints/cms/pages/{section-translation.ts,admin.ts,page-sections.ts}`
  with their tests and fixtures; one new directory under
  `packages/api-server/prisma/migrations/` and the test of its SQL;
  `apps/admin/src/modules/pages/**`; `apps/admin/src/lib/hooks/use-pages.ts` (R7 only);
  `packages/ui/src/components/dynamic-list-item.tsx` with its test, and
  `packages/ui/src/components/index.ts` only if an export is added; additions to
  `apps/admin/src/test/**`; `docs/BOUNDED-CONTEXTS.md` §2 (R11). A direct consumer of a
  granted change (an importing test, a barrel, a fixture, a generated section) may change
  with it, recorded as a `fence` deviation in your report.
- **Do NOT touch:** `packages/api-server/prisma/schema.prisma` and every existing migration;
  `packages/api-server/src/endpoints/cms/pages/public.ts` beyond what a changed type forces
  (a `fence` deviation if so); `apps/marketing/**`, `apps/platform/**`; every other admin
  module and route handler; `packages/{mui,shared,query,api-client,api-routes,env,auth,errors}/**`
  and the rest of `packages/ui/**` (if a primitive is missing, bring it to the gate);
  `.github/**`, lockfiles, `initiatives/**`, `CLAUDE.md`, `docker-compose.yml`,
  `taskfile.dist.yml`, any `.env*` file. No new dependency.
- **Not in this step:** SB-79 (double submit), SB-84 (bounds), SB-90 (the automatic
  refresh of other languages on an English save), SB-92 (the English image remove), SB-95,
  SB-96; product translations; every marketing read.
- **Secrets.** Never read `apps/*/.env.local`, `packages/api-server/.env` or any `.env*`;
  never print an env value; the shared stack and `prod_snap` are not yours.

## Sacred (charter)

The iOS wire contract · prod data additive-only (the migration adds an `id` key to list row
objects and changes nothing else; it reaches production by the planner's dispatch on the
owner's word) · athlete navigation stays free · dep-cruiser context rules (the admin reaches
CMS through `@repo/contracts/cms/*` and its own route handlers) · migrations through
`prisma migrate` + `db-migrate`.

## Acceptance gates (the step prompt's, with the two checklist items of ruling 15; verify yourself before the PR)

- `pnpm exec vitest run --project contracts --maxWorkers=2`, `--project admin` and
  `--project ui` green (fenced); `task test:api TDP_DB_PORT=4714` green in your own
  throwaway container after `task stack:migrate TDP_DB_PORT=4714` applied the new migration
  there; `--project platform` green — it must not notice the change.
- `pnpm check-types` (the marketing app included: it must compile untouched), `pnpm lint`
  (`--max-warnings 0` on the admin), `pnpm dep:check`, `pnpm format:check` clean; the admin
  app builds (fenced, alone).
- Grep gates: no `useFieldArray` outside the shared list editor under
  `apps/admin/src/modules/pages`; no `index:` identity in `section-translation.ts` once R3
  lands (or the gate names why it survives); no file under `apps/marketing` in the diff;
  `schema.prisma` not in the diff.
- Tests that must exist, each shown red under a mutant (name the mutants in your report,
  never in the PR body): the registry gives every list an identity and classifies it shared
  (mutant: one list's identity removed); the migration's SQL gives a fresh `id` to an
  English row without one, the English row's `id` to the row at the same position in
  another language, leaves a row that has an `id`, a row past the English length, every
  other key and `updatedAt` untouched, and changes nothing on a second run (mutants: ids
  assigned to other languages independently; `updatedAt` set); a translation's words follow
  their rows when an English row is moved and when one is removed, on the server and through
  the admin read (mutant: pairing by position); an English write stores no row without an
  `id` (mutant: the guarantee removed); in a non-default locale a list form renders no add,
  move or remove control and renders the English of every word of every row, for each of the
  six sections (mutant: the locale check removed; a row's reference path shifted by one); a
  shared field of a row is read-only outside English; in English add, move and remove work
  as before for each of the six and a new row carries an `id`; after a move to an edge the
  focus is on a control of the moved row (mutant: the `disabled` attribute back); the typed
  words survive a refresh of the page under the form, by row `id` (R7, if it lands); the two
  lifecycle tests of R8 fail under a short-lived wrong state.
- The PR contains no file under `initiatives/`, no `CLAUDE.md`, no `.feature-dev/`.
- PR body per the PR-body law, opened through the `pr` skill, with the owner's checklist AS
  CHECKBOXES, about these items (where, then what to see; adjust to what you built, add
  nothing about the run; no Cyrillic in the body — name the language "Ukrainian"). It also
  says in one plain sentence that the PR carries a data migration that must be applied to
  production before the merge:
  - [ ] FAQ in English: add a question, move it up to the top and down again with the
        keyboard, remove it; focus never jumps away from the row
  - [ ] FAQ in Ukrainian: every question and answer shows its English beside the input;
        there is no add, move or remove
  - [ ] Translate every FAQ row and the title, Update Section: the section turns translated
  - [ ] Back in English: move the last question to the top and remove another, save; in
        Ukrainian every remaining answer is still under its own question, and the section
        is marked older than its English
  - [ ] Why Choose in Ukrainian: the Icon Name of each card is read-only and shows the English value;
        the title and description show their English
  - [ ] Journey and Offer requisites: the same reading in Ukrainian, the same controls in
        English
  - [ ] Type a Ukrainian answer without saving; in another tab change the English FAQ and save; wait
        more than 30 seconds and come back: the typed answer is still there and the English change
        shows beside it
  - [ ] The marketing site is unchanged

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any committed file; synthetic fixtures only.
- No comments in code; delete comments in regions you edit. A directive a tool reads (a vitest environment docblock, an eslint directive) and the `-- ` header lines of a migration file are not comments. No AI attribution, signature or trailer anywhere: not in commits, not in the PR, not in code (the owner's rule overrides any harness reminder).
- Commitlint: lowercase conventional subject at most 100 characters, body lines at most 100 characters, long bodies through `git commit -F <file>`; never `--no-verify`; no Cyrillic in any command that contains `git commit` or `gh pr`, nor in a PR body. A test fixture with Ukrainian words lives in a file, never on a command line.
- The pre-commit hook runs check-secrets and lint-staged (eslint and prettier); the pre-push hook runs dep:check, lint and check-types over the cone, as `pnpm exec turbo` tasks. A red hook is root-cause work; run the hook's task set fenced at `--concurrency=1` first so the hook replays from cache. Touching `packages/contracts` pulls every dependent package into the cone: expect a long pre-push, and warm the cache serially before pushing.
- One PR against `main`; the repository squash-merges; never stack this branch on another. Never merge; the merge is the owner's.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence after every subagent round; nothing of value sits uncommitted while a subagent may be alive. Await every command you start; leave no background process behind.
- Databases: your own throwaway container (D-19): `docker run -d --name tdp-0-4d3b-leg -p 127.0.0.1:4714:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tdp -v "/home/maksym/projects/contrib/the-discipline-program/docker/db/init:/docker-entrypoint-initdb.d:ro" -m 512m postgres:17-alpine`, then `task --dir /home/maksym/projects/contrib/the-discipline-program stack:migrate TDP_DB_PORT=4714` and `task --dir /home/maksym/projects/contrib/the-discipline-program test:api TDP_DB_PORT=4714`; every prisma, tsx and test command sets `DATABASE_URL` and `SHADOW_DATABASE_URL` to your container explicitly (`postgres://postgres:postgres@localhost:4714/tdp_test`, `…/tdp_shadow`). The shared stack `tdp-platform-db` (5432: `tdp`, `tdp_test`, `tdp_shadow`, `prod_snap`) and every other container on the host are not yours. Remove your container (`docker rm -f tdp-0-4d3b-leg`) when the PR is open.
- The migration runs in your container only. Production is not yours in any form: no production read, no production write, no dispatch of `db-migrate.yml`, no `gh workflow run`.
- The project hook PROD-GUARD refuses `Edit` / `Write` on `prisma/migrations/`, lock files and `.github/workflows/`. This step creates exactly one new directory under `prisma/migrations/`, through the shell (ruling 7); no existing migration, no lock file and no workflow changes.
- Never start `next dev` or any server: the browser pass is the owner's, in his own tab (the admin runs on 4712; 4710–4713 are his dev ports). Never call the real Vercel Blob: every upload and delete in a test is mocked.
- Never read `apps/*/.env.local`, `packages/api-server/.env`, `packages/api-server/.env.test` or any `.env*`; never print an env value or a DSN. Never connect to a remote database.
- Temporary files: the repository's tests use the system's default temporary directory (no `TMPDIR` override). A script you type yourself (a harness, a mutation backup, a content copy) writes under `/home/maksym/projects/contrib/the-discipline-program/.feature-dev/1794825820/tmp/`.
- A command that ends `Terminated`, or with exit 137 or 143, was killed by the memory fence: run it once more unchanged; if it is killed again, finish what does not depend on it and report `blocked` with the command, how long it ran and its last lines. The fence does not move.
- `pkill -f <pattern>` matches the shell that runs it: kill by pid.
- Command form: never `cd` inside a compound command; absolute paths in every command that names files or globs; the repository is `/home/maksym/projects/contrib/the-discipline-program`.
- `initiatives/**`, `CLAUDE.md` and `.feature-dev/**` never enter a commit.
- No polling: never `sleep`-loop or `pgrep`-loop on a helper; wait on `wait_agent`.

## Resource budget (the step skill's, verbatim)

- **Hard fence:** every heavy command (`next build`, full vitest runs, the route suite, `test:coverage`) runs inside a cgroup ceiling, in the shared slice: `systemd-run --user --scope -q --slice=heavy.slice -p MemoryMax=3G -p MemorySwapMax=1G -- <cmd>`. A breach kills that command (retriable red), never the VM.
- **Shared ceiling:** `heavy.slice` is ONE slice for the fenced commands of every session on the host (`MemoryMax=10G` on this host); never drop `--slice=heavy.slice`.
- **Diet inside the fence:** `NODE_OPTIONS=--max-old-space-size=2048` on build commands, set in the CALLER's environment, which a `--scope` unit inherits (never `-p Environment=...`); vitest capped at `--maxWorkers=2` on the command line where a runner takes it (`task test:api` is serial and takes no flag); turbo fan-out capped at `--concurrency=1` for multi-package tasks (two Next apps in parallel OOM under the 3G fence); throwaway DB containers at `--memory=512m`.
- **Sequencing:** heavy steps run strictly one at a time: never a build concurrently with a test run, never two agents driving heavy commands at once.

## Concurrency

CAPPED: another session of the owner shares the host. At most ONE internal subagent alive at a time; no parallel fan-out; stages strictly sequential. Where the skill fans out (a wave's tasks, the review-flow lenses and refuters), run the agents one after another.

## Reporting

Your final message is the report the wrapper validates against its schema; its `report` field is the executor's PR-open report, for the planner and never for the PR body. It carries: the per-task account of the work (every task of the plan with its checkpoint commit, and where each of rulings 4, 7, 9, 12, 14 and 15 landed); the complete stage-agent roster (implement, review-flow lenses, refuters and breaker, fix pass, test, docs: `agent_type` and count, or INLINE where you ran a stage yourself); round one's candidate count before any cap alongside the reported count, the refuted count, and every finding with its bucket and rationale as the triage applied it; the mutant campaign's results (every mutant with its red tests, every restore hash-verified, the migration file's final sha256); the verification evidence (every number measured at the FINAL HEAD, the api-server baseline at `main` beside it); every new user-facing string in full; every deviation (`fence`, `law`, `read-retry`) with its root cause; any design-change escalation; any blocked point. Declare the branch, the HEAD, clean or dirty, that your container is gone, and that no command of yours is still running.
