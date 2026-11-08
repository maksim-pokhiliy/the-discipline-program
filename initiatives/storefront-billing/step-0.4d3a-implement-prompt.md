/feature from-plan 1794092977 Implement step 0.4d3a of storefront-billing (languages in the page editor) from the ratified artifacts to the delivery PR, under the rulings below.

You are the IMPLEMENTER of step 0.4d3a. The planner's Opus executor researched, designed and planned this step, and the planner ratified the plan at the plan gate on 2026-11-08 (the rulings below; no revision round). Nothing is implemented yet: the tree is on `main`, clean, and the ratified artifacts are on disk. Your run is `/feature from-plan`: Stage 4 pre-flight, the implementation of the plan's sixteen tasks, round one of the step's two review rounds, the tests, the documents and the PR.

## Where things are

- Branch `main` at `0befd7b5f` or later (the planner's docs commit with this file lands on `main` before you start), checked out and clean; base branch `main`. You create `feat/storefront-billing-editor-locales` from it at Stage 4 pre-flight; one PR against `main`.
- `.feature-dev/1794092977/`: `research.md`, `design.md` and `plan.md` (sixteen tasks in six waves under "Task Order"). In `design.md`: the registry and its full classification in §5.3.1, the contract shapes §5.3.2, the state §5.3.3, the write rule and the section lock §5.3.4, the English `{}` guard §5.3.5, the reads §5.3.6, the routes §5.3.7, the client §5.4.1–§5.4.12, the strings §5.4.13, the test files and mutants §8.1, the docs sentences §8.2, the SB-77 audit §8.3, the fence deviations §8.4, the tree contradictions §8.5, and the gate items P-1 to P-7 under "Decisions the planner must rule". `step-prompt-900ab967a.md` there is the step prompt as the executor read it (identical to the file on `main`). They are the ratified artifacts; where a ruling below and an artifact disagree, the ruling wins.
- The step prompt: `initiatives/storefront-billing/step-0.4d3a-prompt.md`. Read it in full: its rulings R1–R12, "Live-verified facts", the Sacred line and the acceptance gates are the request's detail; the lines this file supersedes are listed under "Superseded lines".
- The initiative: `initiatives/storefront-billing/` (`state.md`, `decisions.md` D-21, D-22, D-24 with its amendments, `deferred.md` rows SB-55, SB-63, SB-76, SB-77, SB-79, SB-80, SB-81, SB-85, SB-89, SB-90, SB-91, `design-0.4-admin-pages-editor.md`). Read-only for you: nothing under `initiatives/` enters a commit.

## The step's request (the step prompt's opening, verbatim)

## Mission

The coach can add Ukrainian on the Languages page (0.4d2, on production since 2026-11-07),
but he cannot write a single Ukrainian word: the page editor edits English only. The server
already reads and writes every page section per locale (0.4a, 0.4b); the admin does not use
it.

This step teaches the page editor its languages. 0.4d3 is split in two (D-22 amended
2026-11-08): this step is the locale in the editor with everything around it and the
translation of every section that is not a list; 0.4d3b brings the six list sections into
the same translation through one shared list editor. The coach's walk after this step: on
the Languages page the `uk` row has a "Translate" link; it opens the Pages list in
Ukrainian, each page with its progress; he opens Home, and the whole screen says he is
editing Ukrainian (and that the language is hidden from the site while it is disabled);
every section shows, before he opens it, whether it is not translated, translated, or older
than its English; he opens the hero: its words are empty with the English text beside each
field, its links and image the English ones, read-only (D-24); he writes the words, saves
(halfway is fine: the section stays a draft the site does not show), and once every word is
written the section turns translated; "Clear translation" returns a section to the English
fallback.

One delivery PR, these deliverables:

1. The words-and-the-rest registry (D-24): for every key of `SECTION_SCHEMAS`, which string
   fields are words (translated) and which are shared (taken from English), list rows
   included, exhaustive by a test.
2. The admin page read per locale carries, for every section, its state by the public
   reader's own predicate and, for a non-default locale, the English row's data and
   `updatedAt`; the Pages list read takes a locale and carries each page's translated count.
   The contract types the read by section (SB-76) and its dates as the wire carries them
   (SB-77).
3. The editor in a locale: the locale in the URL, one language switch on the Pages list and
   in the editor, the current language unmistakable, the disabled mark, the three section
   states at the accordion level, the D-24 seeding and save rule for every section, saves
   that carry the locale, "Clear translation" writing exactly `{}` (SB-55), the save lock
   across mounts (SB-80), a clean remount on a language switch (SB-81).
4. The English reference beside every field of every section form that is not a list form.
5. The "Translate" link from a non-default row of the Languages list.
6. Tests for all of the above; `docs/BOUNDED-CONTEXTS.md` §2 where it names the editor's
   locale controls, the words-and-the-rest rule and the delete guard's notion.

Not yours: the six list forms (`why-choose-section-form.tsx`, `journey-section-form.tsx`,
`credentials-section-form.tsx`, `faq-section-form.tsx`, `offer-requisites-section-form.tsx`,
`offer-terms-section-form.tsx`, with `why-choose-feature-card.tsx` and `row-controls.ts`),
the English reference inside them, the shared list editor, its structure controls shown in
English only, and the list controls' focus (0.4d3b: SB-83, SB-82); product translations (0.4c, 0.4e); the marketing site reading
locales and localizing internal links (0.4f, SB-89).

## Plan-gate rulings (owner and planner, 2026-11-08)

The owner gave the run's mode and concurrency at the contour (delegated, STOCK, full calibre). Two gate items went to him; he asked for the planner's recommendations and answered «да на оба» (rulings 1 and 2). The rest are the planner's. Where a ruling and an artifact disagree, the ruling wins; the artifacts were not regenerated.

1. **P-1, row identity: position for the five id-less lists, no client tags (owner).** The server matches a list row's words by its `id` where the registry names one and the row carries a non-empty one (`home:whyChoose.features`), by position otherwise, exactly as design §5.3.4 rule 2 says. The client tag-and-restore step is NOT built: no `ENGLISH_ROW_KEY` / `__englishRowIndex`, no `restoreEnglishRowOrder`. `buildTranslationSeed` gives every string leaf a value (the data's string, else `""`) and keeps each list's rows as the overlay delivers them (English's row set in English's order), nothing more; the non-default submit is `parseSectionWriteData(key, values)`. In design §5.4.5's table, the "Submitted `data`" cell of the four non-default states reads `parseSectionWriteData(key, values)`; its closing paragraph is replaced by: the six list sections in a non-default locale show English's rows with the locale's words or `""`; the fenced forms' Add / Move / Remove still work in the form until 0.4d3b; the server keeps English's row set, so a structure change made there is not saved, and an id-less list's words follow their position in the body. Plan task T12 takes its "Under P-1 refused" branch: M14 and the FAQ-order restore test are dropped, and a server test pins the position rule instead (an id-less list's words land on English's rows by position; an extra body row is dropped; a body with fewer rows leaves the rest unwritten, so the row is a draft), shown red under the mutant "id-less rows matched by `id` only" (their words never land). Row ids for every list are 0.4d3b's (SB-91), not yours: no section schema changes here. Rationale: the restore would guard only forms that 0.4d3b replaces, and the coach starts translating after 0.4d3b (D-22); the owner's standing rule is no temporary guard where the proper fix is scheduled.
2. **P-2, missing English rows: accepted (owner).** A non-default read scaffolds the page's missing English rows in the same `createMany` as the locale's `{}` rows, and a non-default write ensures its section's English row inside its transaction, as design §5.3.4 and §5.3.6 say: exactly the rows and defaults opening the page in English writes (`scaffoldSectionData(section, "en")`). `admin.scaffold.test.ts`'s "writes nothing to English when it scaffolds a %s page" is rewritten as plan T5 says. The Sacred line is amended accordingly (below).
3. **P-3 granted:** `packages/api-server/src/endpoints/cms/pages/section-translation.ts` and its `.test.ts` hold the pure write rule (overlay, completeness, compose). Rationale: one concern, tested without a database.
4. **P-4 pre-approved:** if the formatted `pages-api.schema.ts` crosses `max-lines`, the admin read and list schemas move to a sibling `packages/contracts/src/entities/cms/pages/admin-pages-api.schema.ts`, exported from the pages barrel; record it as a `fence` deviation.
5. **P-5 ratified:** a non-default save with no word written stores exactly `{}` (state `NOT_TRANSLATED`, not a draft). Rationale: "Clear translation" stores `{}` through the one write path, stored rows never hold blank strings, and the delete guard's notion (any `data` other than `{}`) equals "the coach wrote a word in this language".
6. **P-6:** "Clear Translation" shows on `DRAFT`, `TRANSLATED` and `ENGLISH_NEWER` sections of a non-default locale. Rationale: a draft holds the coach's words and blocks a locale delete; R7 was written before drafts existed.
7. **P-7:** a page's count on the Pages list is the number of its sections the public reader serves in that locale (`TRANSLATED` and `ENGLISH_NEWER`), the predicate of the Languages count, so the per-page counts sum to it. Rationale: one notion of "translated"; an English edit never moves a count.
8. **One PR, as planned.** The Scope Check's LARGE FEATURE warning is noted and the split is not taken. Rationale: the server rule and the client seed are two halves of one contract, and the server half alone ships nothing the coach can see.
9. **The design stands for everything else**, as written: the registry and its 141 / 19 classification (§5.3.1), the contract shapes with SB-76 and SB-77 (§5.3.2), the state beside `parseServedSectionData` with `isServedSectionRow` shared by the state and both counts (§5.3.3), the section lock on English and non-default writes and `isActive` written on both upsert branches (§5.3.4), the English `{}` guard in the service (§5.3.5), the reads built from the page's own section keys (§5.3.6), the Pages list route as a hand-written GET mirroring `apps/admin/src/app/api/admin/pages/[slug]/route.ts` (`parseQuery(localeQuerySchema, request)`, `parseResponse`), the client keys, calls and invalidation (§5.4.1), the URL, the gate, the switch, the banner and the sticky bar (§5.4.2–§5.4.3), the reference mechanism with `SectionImageField` showing no Remove outside English (§5.4.4), the key (§5.4.6), the lock (§5.4.7), the clear (§5.4.8), the "Translate" link (§5.4.9), the unreadable-row notice (§5.4.10), the views (§5.4.11), and the SB-77 audit as a report item only (§8.3).
10. **The strings:** the 27 rows of design §5.4.13 stand except two:
    - #6 (banner body, non-default) reads "Links, images and list rows always come from English." Its first sentence is dropped: in this step the list forms show no English beside their rows.
    - #20 (clear modal message) reads "The {name} words written for {section label} are removed, and the {name} site shows this section in English." The design's wording ("goes back to English") is false for a draft, which the site already shows in English.
11. **The docs:** the six sentences of design §8.2, verbatim, items 4 and 5 included (rulings 2 and 3). No ADR, no CHANGELOG.
12. **Fence deviations granted in advance** (record each in your report's `deviations` all the same): the pages barrel `packages/contracts/src/entities/cms/pages/index.ts`; `section-translation.ts` and its test (ruling 3); the sibling schema file if ruling 4 applies; additions to `apps/admin/src/test/mocks.ts`; `packages/api-server/src/endpoints/cms/pages/__fixtures__/translation-rows.ts`; the new `apps/admin/src/app/api/admin/pages/route.test.ts`; the consumer tests the plan names (`admin.locale.test.ts`, `admin.scaffold.test.ts`, `section-write.types.test.ts`, `pages-edit-form.test.tsx`, `page-save-lifecycle.test.tsx`, `image-save-gate.test.tsx`), changed only as far as the changed types and rules require; `docs/BOUNDED-CONTEXTS.md` sentences 3–5 of design §8.2.

## Facts established since the step prompt was written

- Only `home:whyChoose.features[]` rows carry an `id` (`packages/contracts/src/entities/cms/pages/pages.schema.ts:23-28`); `timeline`, `items` (credentials, FAQ, requisites) and `blocks` rows have none (ruling 1).
- `blog:hero.backgroundImage` is `z.string().optional()` and `contact:form` holds two nested objects (`fieldLabels`, `fieldPlaceholders`); the registry's group node covers them (design §5.3.1).
- The page GET is a hand-written handler that reads `?locale=` with `parseQuery(localeQuerySchema, request)` and answers through `parseResponse`; the list GET uses `createGetHandler`, which reads no query (ruling 9).
- The public reader treats a `{}` row as empty and falls through to the next locale of its chain (`parseServedSectionData` → `empty` → `null`), so an English `{}` scaffold row renders as a missing one; the marketing site does not render the `site` or `seo` sections yet (0.4f).
- `personal-section-form.tsx:89-97`: Remove calls `deleteImage.mutate(currentUrl)`. The local admin's Blob token writes the production store, so a Remove outside English would delete the English image's file in production storage; design §5.4.4 renders no Remove in shared mode. Tests mock every upload and delete; nothing in this run calls the real Blob.
- The update branch of `updateSection` never writes `isActive` today (`pages/admin.ts:147-149`); the design writes it on both branches.
- Production on 2026-11-08 (the planner's read): `marketing_locales` holds `en` alone; 21 section rows, all `en`, all active, none `{}`; six page rows (no `offer`, no `site`); English lists hold 3 `whyChoose`, 4 `journey`, 3 `credentials` and 3 FAQ rows. No backfill in this step.
- This run is STOCK: no parallel owner session shares the host today.

## Superseded lines (this file wins)

- R2's "the locale's own words matched by row `id`" and "(in a list, by row `id`)": by `id` where the registry names one and the row has one, by position otherwise (ruling 1).
- R3's "the number of its sections in state `translated`": ruling 7. R3's test sentence "an inactive row … not translated": an inactive row that the reader would otherwise serve is `DRAFT`; a row that fails to parse, an empty row and a row of another page are `NOT_TRANSLATED` (D-24 amended; design §8.5).
- R7's "On a translated or `English newer` section": ruling 6. A save with no word written also stores `{}` (ruling 5).
- The Sacred clause "the rows it creates on production are the coach's own writes and the `{}` scaffold of a locale he opens": also the page's missing English rows, created exactly as opening the page in English creates them (ruling 2).
- The acceptance gate "a non-default write is stored with the English shared values and row set whatever the body says (… a reordered list), the locale's words kept by row `id`": a reordered `whyChoose` body keeps its words by `id`; for an id-less list the words follow the body's positions (ruling 1); both are tested.
- The plan's "Planner rulings this plan assumes" line: rulings 1–7 above; T12's "Under P-1 refused" branch applies; T12's M14 and T16's M14 are dropped; T12 creates no restore function and no tag constant.
- The step prompt's "STOP at the plan gate", "STOP at review-flow's triage gate" and "end every turn" lines: nothing resumes a Codex leg. The gate is answered (this file); the flow's triage is the ruling, applied at once in one fix pass; you stay in your turn on `wait_agent` until every helper has reported, and your final message ends the run.

## How this run proceeds

### Stage 4 — pre-flight

- Create `feat/storefront-billing-editor-locales` from `main`; take the lock as the skill says; write `tasks.md` from `plan.md` (sixteen tasks, six waves under "Task Order"), with rulings 1, 5, 6, 7 and 10 folded into the tasks they touch.
- Create your database container (below), migrate it, and take the api-server baseline at `main` before the first change.
- Implement wave by wave with `pipeline-worker` implement agents as the skill says; a wave's tasks may run as parallel agents (STOCK) provided no two agents drive heavy commands at once. A checkpoint commit per task or per wave as the plan says, each with a typed lowercase subject; type-check, lint and the affected tests before every commit; the tree committed before every wave's spawn; file presence re-verified after every agent round.
- No UI visual check by you: the browser pass is the owner's.

### Stage 5–6 — review-flow at deep, round one of two

- Run the flow as the skill says: fresh lenses, refuters and breaker as `pipeline-worker` agents, the sweep, the synthesis into `.feature-dev/1794092977/review.md`, the triage, then exactly one fix pass. Caller context for the flow: this file (the request and the rulings), `research.md`, `design.md`, and the battery commands below.
- The triage is the ruling: apply exactly the fix-now set in one pass (a typed checkpoint subject naming the change), run type-check, lint and the affected tests before the commit, and never re-review the fix diff. A finding whose fix would add a mechanism, cross the fence or change a contract is never fix-now: it is a carry-forward or a deferral in the report, or a design-change escalation that ends the run `blocked` with the facts.

### Stage 7–8 — Test and Docs

- Test agent: the regression tests of the fix-now set, the acceptance criteria not yet covered (`plan.md` Test Strategy and design §8.1; the tasks already write the planned tests, so fill gaps and do not duplicate), the design's edge cases, ruling 1's position test if the implementation round left it out.
- Docs agent: plan task T15 lands in wave 4; this agent checks `docs/BOUNDED-CONTEXTS.md` §2 against the final code and ruling 11, and corrects drift only. No ADR, no CHANGELOG.
- Checkpoint commits, `test:` then `docs:` (a stage with nothing to change commits nothing).

### Stage 9 — finalize

- The battery at the FINAL HEAD, inside the fence, one heavy command at a time: `pnpm exec vitest run --project contracts --maxWorkers=2`; `--project admin`; `--project platform` (it must not notice the change); `task test:api TDP_DB_PORT=4714` (serial, against your container, `SHADOW_DATABASE_URL` pointing at your container's `tdp_shadow`); `pnpm check-types`, `pnpm lint`, `pnpm dep:check`, `pnpm format:check` (turbo tasks with `--concurrency=1`; the non-mutating per-package eslint before `pnpm lint`, then `git status` clean); the admin build with `NODE_OPTIONS=--max-old-space-size=2048`.
- The grep gates of the acceptance gates (below) and of plan T16.
- The mutants of design §8.1 and plan T16 (M1–M23 without M14, plus ruling 1's position mutant): every mutant restored from a content copy verified by sha256, never `git checkout --` / `git restore`, every change committed before the campaign starts; the results go in the report.
- Push the branch and open the PR through the `pr` skill (pipeline mode: head and base fixed, no branch question). Body per `~/.claude/skills/_shared/pr-template.md`, inside its budget, with the owner's checklist AS CHECKBOXES (below); nothing about the run, no mutants, no counts, no finding IDs; no Cyrillic (the language is "Ukrainian").
- Remove your container when the PR is open. Report, with the tree state.

## Scope fence (from the step prompt, verbatim, with ruling 12's grants)

- **Touch:** `packages/contracts/src/entities/cms/pages/pages-api.schema.ts`,
  `pages-api.types.ts`, one new registry module beside `SECTION_SCHEMAS` (R2) and their
  tests (the admin read and list shapes, the section state, SB-76, SB-77; no section schema,
  constant or default changes); `packages/api-server/src/endpoints/cms/pages/admin.ts` and
  `page-sections.ts` with their tests and fixtures,
  `packages/api-server/src/endpoints/cms/locale/translation-progress.ts` with its test (only
  if the per-page count reuses it); `apps/admin/src/app/api/admin/pages/**`;
  `apps/admin/src/modules/pages/**` except the six list forms, `why-choose-feature-card.tsx`
  and `row-controls.ts`; `apps/admin/src/modules/languages/**` (the link and its tests);
  `apps/admin/src/lib/api/endpoints/pages.ts`, `apps/admin/src/lib/hooks/{use-pages.ts,index.ts}`,
  `apps/admin/src/lib/api/keys.ts`; additions to `apps/admin/src/test/**`;
  `docs/BOUNDED-CONTEXTS.md` §2 (R12). A direct consumer of a granted change (an importing
  test, a barrel, a fixture) may change with it, recorded as a `fence` deviation in your
  report. Ruling 12: the files it names.
- **Do NOT touch:** the six list forms, `why-choose-feature-card.tsx`, `row-controls.ts`
  (0.4d3b); every other admin module and route handler; `apps/marketing/**`,
  `apps/platform/**`; `packages/api-server/**` beyond the files above (no `prisma/**`: no
  migration, no seed change); `packages/contracts/**` beyond the files above;
  `packages/{ui,mui,shared,query,api-client,api-routes,env,auth,errors}/**` (if a primitive
  is missing, bring it to the gate); `.github/**`, lockfiles, `initiatives/**`, `CLAUDE.md`,
  `docker-compose.yml`, `taskfile.dist.yml`, any `.env*` file. No new dependency.
- **Not in this step:** the reference inside the list forms, the shared list editor, the
  list controls' focus (0.4d3b); row ids for every list (0.4d3b, SB-91); SB-79's double
  submit and SB-84's bounds (OPEN); product translations (0.4c, 0.4e); the switcher, `/{code}`
  routes, internal links per locale and every marketing read (0.4f).
- **Secrets.** Never read `apps/*/.env.local`, `packages/api-server/.env` or any `.env*`;
  never print an env value; the shared stack and `prod_snap` are not yours.

## Sacred (charter, as amended by ruling 2)

The iOS wire contract · prod data additive-only (this step changes no table and no column;
the rows it creates on production are the coach's own writes, the `{}` scaffold of a locale
he opens, and the page's missing English rows created exactly as opening the page in English
creates them) · athlete navigation stays free · dep-cruiser context rules (the admin reaches
CMS through `@repo/contracts/cms/*` and its own route handlers) · migrations through
`prisma migrate` + `db-migrate` (none here).

## Acceptance gates (verify yourself before the PR)

- `pnpm exec vitest run --project contracts --maxWorkers=2` and `--project admin` green
  (fenced); `task test:api TDP_DB_PORT=4714` green in your own throwaway container;
  `--project platform` green — it must not notice the change.
- `pnpm check-types`, `pnpm lint` (`--max-warnings 0` on the admin), `pnpm dep:check`,
  `pnpm format:check` clean; the admin app builds (fenced, alone).
- Grep gates: no literal section count in the progress code or under
  `apps/admin/src/modules/pages`; `CorrelatedAdminPageDetails` and `AdminPageSection<` gone
  from `apps/admin/src`; `__englishRowIndex` and `restoreEnglishRowOrder` absent (ruling 1);
  none of the six list forms, `why-choose-feature-card.tsx` or `row-controls.ts` in the diff.
- Tests that must exist, each shown red under a mutant (name the mutants in your report,
  never in the PR body): the registry classifies every string field of every schema, list
  rows included (mutant: a field removed from the registry); the server state matches the
  reader — a row that fails to parse, an empty row and a row of another page are not
  translated, an inactive row the reader would otherwise serve is a draft, a served row is
  translated, and a served row older than its English is `English newer` (mutant: state by
  `data` other than `{}`); a row that fails to parse does not break the admin read; a `{}`
  write to English is a 400 and to `uk` clears the section (mutant: the English guard
  removed); the Pages list count per page in a locale (mutant: a literal denominator); in the
  admin, a save from the Ukrainian editor sends `locale: "uk"` and never touches the English
  cache (mutant: the locale dropped from the body or the key); a not-translated section opens
  with its shared fields from English and its words empty, a save with a word missing is
  stored as a draft (`isActive = false`, state `draft`, not counted, the public reader falls
  back to English for it) and a save with every word filled is live (mutant: the
  completeness check removed or inverted); a draft reopens with its words; a non-default
  write is stored with the English shared values and row set whatever the body says (a
  changed link or image, an extra row, a reordered list), the `whyChoose` words kept by row
  `id` and an id-less list's words by position (mutant: the server rule removed; ruling 1's
  mutant); the shared fields of a form that is not a list form are read-only in a
  non-default locale; an `English newer` section saves without an edit and its saved row
  carries the current English image; the English value shows beside a word of a form that is
  not a list form; a dirty form does not survive a language switch; the save lock holds
  across leaving and returning to the editor during a save (SB-80); "Clear Translation" sends
  exactly `{}` after its confirmation; the English row of Languages has no "Translate" link.
- The PR contains no file under `initiatives/`, no `CLAUDE.md`, no `.feature-dev/`.
- PR body per the PR-body law, opened through the `pr` skill, with the owner's checklist AS
  CHECKBOXES, about these items (where, then what to see; adjust to what you built, add
  nothing about the run; no Cyrillic in the body — name the language "Ukrainian"):
  - [ ] Languages → the `uk` row's "Translate" opens Pages in Ukrainian, each page with its
        translated count; English has no such link
  - [ ] Open Home in Ukrainian: the screen says Ukrainian everywhere and that the language is
        hidden from the site; every section is marked not translated
  - [ ] Open the Home hero: the words are empty with the English beside each, the link and
        the background image are the English ones and cannot be changed here
  - [ ] Write the title only, Update Section: the hero is saved as a draft, marked so, and
        Home's count on Pages does not move; leave the page and come back: the title is there
  - [ ] Write the remaining words, Update Section: the section turns translated, Home's count
        on Pages grows by one; reload: it persists; switch to English: the English hero is
        unchanged
  - [ ] Change the English hero title and background image and save; back in Ukrainian the
        hero is marked older than its English; Update Section without an edit clears the
        mark, and the Ukrainian hero now shows the new image
  - [ ] Clear Translation on the hero after the confirmation: it is not translated again;
        the Languages progress drops by one
  - [ ] Type in a Ukrainian field, switch the language without saving: nothing typed reaches
        the other language; no label overlaps a value
  - [ ] The marketing site is unchanged

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any committed file; synthetic fixtures only.
- No comments in code; delete comments in regions you edit. No AI attribution, signature or trailer anywhere: not in commits, not in the PR, not in code (the owner's rule overrides any harness reminder).
- Commitlint: lowercase conventional subject at most 100 characters, body lines at most 100 characters, long bodies through `git commit -F <file>`; never `--no-verify`; no Cyrillic in any command that contains `git commit` or `gh pr`, nor in a PR body. A test fixture with Ukrainian words lives in a file, never on a command line.
- The pre-commit hook runs check-secrets and lint-staged (eslint and prettier); the pre-push hook runs dep:check, lint and check-types over the cone, as `pnpm exec turbo` tasks. A red hook is root-cause work; run the hook's task set fenced at `--concurrency=1` first so the hook replays from cache. Touching `packages/contracts` pulls every dependent package into the cone: expect a long pre-push, and warm the cache serially before pushing.
- One PR against `main`; the repository squash-merges; never stack this branch on another. Never merge; the merge is the owner's.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence after every subagent round; nothing of value sits uncommitted while a subagent may be alive. A sub-agent's "done" does not mean its processes died: sweep by pid before the next stage.
- Databases: your own throwaway container (D-19): `docker run -d --name tdp-0-4d3a-leg -p 127.0.0.1:4714:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tdp -v "/home/maksym/projects/contrib/the-discipline-program/docker/db/init:/docker-entrypoint-initdb.d:ro" -m 512m postgres:17-alpine`, then `task --dir /home/maksym/projects/contrib/the-discipline-program stack:migrate TDP_DB_PORT=4714` and `task --dir /home/maksym/projects/contrib/the-discipline-program test:api TDP_DB_PORT=4714`; every prisma, tsx and test command sets `DATABASE_URL` and `SHADOW_DATABASE_URL` to your container explicitly (`postgres://postgres:postgres@localhost:4714/tdp_test`, `…/tdp_shadow`). The shared stack `tdp-platform-db` (5432: `tdp`, `tdp_test`, `tdp_shadow`, `prod_snap`) and every other container on the host (`csapi-*`, `cssearch-*`, `film-dna-db`, `tradebench-dev-db`, `s3g-route3`, `tdp-dump-verify`) are not yours. Remove your container (`docker rm -f tdp-0-4d3a-leg`) when the PR is open.
- Never start `next dev` or any server: the browser pass is the owner's, in his own tab (the admin runs on 4712; 4710–4713 are his dev ports). Never call the real Vercel Blob: every upload and delete in a test is mocked.
- Never read `apps/*/.env.local`, `packages/api-server/.env`, `packages/api-server/.env.test` or any `.env*`; never print an env value or a DSN. Never connect to a remote database.
- `pkill -f <pattern>` matches the shell that runs it: kill by pid.
- Command form: never `cd` inside a compound command; absolute paths in every command that names files or globs; the repository is `/home/maksym/projects/contrib/the-discipline-program`.
- The project hook PROD-GUARD refuses `Edit` / `Write` on `prisma/migrations/`, lock files and `.github/workflows/`; nothing in this step touches them.
- `initiatives/**`, `CLAUDE.md` and `.feature-dev/**` never enter a commit.
- No polling: never `sleep`-loop or `pgrep`-loop on a helper; wait on `wait_agent`.

## Resource budget (the step skill's, verbatim)

- **Hard fence:** every heavy command (`next build`, full vitest runs, the route suite, `test:coverage`) runs inside a cgroup ceiling, in the shared slice: `systemd-run --user --scope -q --slice=heavy.slice -p MemoryMax=3G -p MemorySwapMax=1G -- <cmd>`. A breach kills that command (retriable red), never the VM.
- **Shared ceiling:** `heavy.slice` is ONE slice for the fenced commands of every session on the host (`MemoryMax=10G` on this host); never drop `--slice=heavy.slice`.
- **Diet inside the fence:** `NODE_OPTIONS=--max-old-space-size=2048` on build commands, set in the CALLER's environment, which a `--scope` unit inherits (never `-p Environment=...`); vitest capped at `--maxWorkers=2` where a runner takes it (`task test:api` is serial and takes no flag); turbo fan-out capped at `--concurrency=1` for multi-package tasks (two Next apps in parallel OOM under the 3G fence); throwaway DB containers at `--memory=512m`.
- **Sequencing:** heavy steps run strictly one at a time: never a build concurrently with a test run, never two agents driving heavy commands at once.

## Concurrency

STOCK: no parallel owner session shares the host. Parallel helper agents are allowed where the skill fans out (a wave's tasks, the review-flow lenses); heavy commands stay one at a time across all of them.

## Reporting

Your final message is the report the wrapper validates against its schema; its `report` field is the executor's PR-open report, for the planner and never for the PR body. It carries: the per-task account of the work (every task of the plan with its checkpoint commit, and where each of rulings 1, 2, 5, 6, 7 and 10 landed); the complete stage-agent roster (implement, review-flow lenses, refuters and breaker, fix pass, test, docs: `subagent_type` and count, or INLINE where you ran a stage yourself); round one's candidate count before any cap alongside the reported count, the refuted count, and every finding with its bucket and rationale as the triage applied it; the mutant campaign's results (every mutant with its red tests, every restore hash-verified); the verification evidence (every number measured at the FINAL HEAD, the api-server baseline at `main` beside it); the SB-77 audit (design §8.3, re-checked at the final HEAD); every new user-facing string (the full list: titles, banner texts, chips, notices, captions, helper texts, buttons, modal texts, toasts, column headers, progress captions, links and aria labels); every deviation (`fence`, `law`, `read-retry`); any design-change escalation. Declare the branch, the HEAD, clean or dirty, that your container is gone, and that no process of yours is alive.
