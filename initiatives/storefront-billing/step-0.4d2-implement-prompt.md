/feature from-plan 1794069095 Implement step 0.4d2 of storefront-billing (the admin Languages page) from the ratified artifacts to the delivery PR, under the rulings below.

You are the IMPLEMENTER of step 0.4d2. The planner's Opus executor researched, designed and planned this step, and the planner ratified the plan at the plan gate on 2026-11-07 (the rulings below; no revision round). Nothing is implemented yet: the tree is on `main`, clean, and the ratified artifacts are on disk. Your run is `/feature from-plan`: Stage 4 pre-flight, the implementation of the plan's seventeen tasks, round one of the step's two review rounds, the tests, the documents and the PR.

## Where things are

- Branch `main` at `dd836fb88` or later (the planner's docs commit with this file lands on `main` before you start), checked out and clean; base branch `main`. You create `feat/storefront-billing-admin-languages` from it at Stage 4 pre-flight; one PR against `main`.
- `.feature-dev/1794069095/`: `research.md`, `design.md` (every gate item has its own "Gate:" subsection, indexed in §9.1; the strings in §9.2, the test files in §9.3, the docs sentences in §9.4, the tree contradictions in §9.5) and `plan.md` (seventeen tasks, five commits under "Task Order"). They are the ratified artifacts; where a ruling below and an artifact disagree, the ruling wins.
- The step prompt: `initiatives/storefront-billing/step-0.4d2-prompt.md`. Read it in full: its rulings R1–R9, "Live-verified facts", the Sacred list and the acceptance gates are the request's detail; the lines this file supersedes are listed under "Superseded lines".
- The initiative: `initiatives/storefront-billing/` (`state.md`, `decisions.md`, `deferred.md` rows SB-55, SB-56, SB-58, SB-63, SB-82, `design-0.4-admin-languages.md`). Read-only for you: nothing under `initiatives/` enters a commit.

## The step's request (the step prompt's opening, verbatim)

## Mission

Step 0.4a gave the CMS a language catalog on the server (`MarketingLocale`, English as the
default, the admin routes to list, create, update and delete a language, the public read
falling back to English section by section). Nobody can use it: the admin has no page for
it, so the coach cannot add Ukrainian, cannot see how much of the site is translated, and
cannot enable a language once its translation is done.

This step builds that page in the admin, with the server changes it needs. 0.4d is split in
three (D-22 amended 2026-11-02): 0.4d1 gave every section a form (on production since
2026-11-03); this step is the Languages page; 0.4d3 is the locale switch inside the page
editor. The coach's walk after this step: he opens Marketing → Languages, sees English as the
default, adds `uk` "Українська", sees it hidden from the site at "0 of 35 translated", and
can enable, disable, reorder, rename and delete languages from the list.

One delivery PR, these deliverables:

1. The translated-sections count on the admin list read, by the public reader's own notion
   of a served section (SB-55).
2. A dense catalog order with English pinned first: one reorder write for the whole list,
   creation appending at the end, deletion closing the gap (SB-56).
3. The admin Languages module: the list with its progress, create, rename, enable / disable
   and move in place, delete with the refusal reason, the empty state, the navigation entry.
4. Tests for all of the above; `docs/BOUNDED-CONTEXTS.md` §2 updated where it states the
   catalog's invariants and consumers.

Not yours: the "translate" link from a language row into the page editor and every locale
control inside the editor (0.4d3: the editor reads `?locale=` only there); "clear
translation" (0.4d3); product translations (0.4c); the marketing site reading the catalog,
the language switcher and the `/{code}` routes (0.4f); any change to the page editor or the
Pages list.

## Plan-gate rulings (planner, 2026-11-07)

The owner gave the run's mode and concurrency at the contour («STOCK, … погнали»: delegated, STOCK, full calibre) and accepted the contour; no product question reached him from the gate. Where a ruling and an artifact disagree, the ruling wins; the artifacts were not regenerated.

1. **One PR, as planned.** The Scope Check's LARGE FEATURE warning is noted and the split is not taken: the server half has no consumer without the page, the page cannot work without it, and one step is one delivery PR here. The seventeen tasks and the five commits of `plan.md` stand.
2. **The shared predicate** — accepted as designed: `parseServedSectionData<TKey>(section, data)` in `pages/page-sections.ts`, returning `served` / `empty` / `invalid`; `SectionData<TKey>` moves there and is exported; `extractSectionDataOrNull` calls it and keeps its monitoring call, tags and cost; `localeChain`, `readSections` and the eight readers do not change. One addition: the page-membership lookup (a row's `section` belongs to its own `pageSlug` by `PAGE_SECTIONS_MAP`, immune to prototype keys) is exported from `page-sections.ts` beside `getPageSectionsOrder`, and `countServedSections` in `locale/translation-progress.ts` imports it and holds the fold only. Rationale: `page-sections.ts` is the section helpers' home R2 named. `pages/admin.ts` and its private `isValidSectionKey` stay untouched (out of the fence; a global key set, not the per-page relation).
3. **The schemas** — accepted as designed (`adminLocaleListItemSchema`, `getLocalesResponseSchema`, `reorderLocalesSchema` with its aliases, `updateLocaleSchema` strict without `sortOrder`); `localeSortOrderSchema` and `LOCALE_CONSTANTS.MAX_SORT_ORDER` are deleted.
4. **The lock and the race tests** — accepted as designed: `lockLocaleOrder` in `locale/locale-order-lock.ts`, `pg_advisory_xact_lock(hashtext('cms-locale-order'))` as the first statement of an interactive transaction with `TX_BUDGET_DEFAULT` at READ COMMITTED (the isolation is load-bearing: never RepeatableRead or Serializable there); create, reorder and delete take it, the PATCH and `ensureDefaultLocale` do not; the two races in `locale/admin.order-race.test.ts` on the unchanged `lock-race.ts`.
5. **The four writers** — accepted as designed (create appends at the row count, reorder checks the permutation after the lock and answers 409, delete keeps its refusals and its content count on the base client and closes the gap inside the transaction, the PATCH writes no order).
6. **T-1 accepted:** the list read counts every locale, English included (a true number; the page never shows it). Rationale: R2's "for every locale", at most 35 extra rows.
7. **Q-1: `blog:related` stays counted;** N is `Object.keys(SECTION_SCHEMAS).length`. Rationale: the owner's contour ruling; a second key list drifts the day 0.4f localizes the article reader. The one-section overstatement until 0.4f is the planner's ledger row SB-85; not yours.
8. **The reorder route** — accepted as designed (`apps/admin/src/app/api/admin/locales/reorder/route.ts`, `createAuthPutHandler`, `withAdminAuth` + `withAuthRateLimit` at `RATE_LIMIT_TIER.API`); `locales/route.ts` needs no edit.
9. **The module** — accepted as designed (layout, plumbing, app routes, columns, toolbar, empty state, create and edit views), with rulings 10–16 applied.
10. **T-2 accepted:** the Path column shows `marketingPagePath(PageSlug.HOME, code)`: `/` for English, `/uk` for Ukrainian. Rationale: the real URL from the site's own builder. The create view's code helper says the same thing: "Two or three lowercase letters that start the language's links, as in /uk. It cannot be changed later."
11. **T-3 accepted:** "Use two or three lowercase letters" on `localeCodeSchema`'s min, max and regex checks (inside `cms/locale/**`).
12. **T-4 accepted:** every list mutation toasts on success, as the admin's `createToggleHook` does for every status flip and the platform's four reorder hooks do for every reorder. Wording by those patterns: the toggle "Language status updated" / "Failed to update language status" (as designed); the move "Languages reordered" / "Failed to reorder languages" (replaces "Language order updated").
13. **E-1 accepted and refined: the delete refusal words the guard's own notion and the row's real state.** `deleteRefusalOf` takes the language (its name and `isEnabled`), not the name alone, and builds the line from `details.translatedSectionCount`, never from the server message:
    - enabled, one: "{name} still has content in 1 section, so it cannot be deleted. Disable it instead to hide it from the site."
    - enabled, several: "{name} still has content in {count} sections, so it cannot be deleted. Disable it instead to hide it from the site."
    - disabled, one: "{name} still has content in 1 section, so it cannot be deleted. It stays hidden from the site while it is disabled."
    - disabled, several: "{name} still has content in {count} sections, so it cannot be deleted. It stays hidden from the site while it is disabled."
      Rationale: the guard counts inactive, unparsable and unknown-key rows too, so "translated" would contradict the row's own progress (SB-55's two predicates for one word); and a new language starts disabled, so "Disable it instead" would be false advice on the commonest refusal. `delete-refusal.test.ts` covers the four lines and `null` for every other error; the list-section test shows one refusal of each state. Every other delete failure (the race 409, a 404) shows `error.message`, as designed.
14. **E-2 accepted:** per-row accessible names "Enable {name}" (the switch), "Move {name} up", "Move {name} down", "Delete {name}"; the tooltips stay short ("Move up", "Move down", "Delete").
15. **E-3 refined: the stale-reorder message is the client's, not the server's.** `useReorderLocales`' `onError` shows, for a `ConflictError`, "The language list changed in the meantime and was reloaded. Try the move again." and invalidates the list; every other error goes to `notifyError(error, "Failed to reorder languages")`. The server's `ConflictError` message stays the design's API wording (string #34) and is never shown on the page. Rationale: the same split as ruling 13; only the client knows it refetched.
16. **The move controls keep focus (SB-82's measured defect, not repeated in new code).** The move buttons never take the native `disabled` attribute, neither at the list edges nor while a reorder runs: an unavailable button carries `aria-disabled="true"`, a guarded handler that sends nothing and the theme's disabled look (theme tokens only, no new colour); the enable switch of a row whose toggle is pending follows the same rule. Rationale: SB-82 measured on Chromium that a focused control turning `disabled` drops focus to `body`, and the design disables every move button on each click, so every keyboard move would lose its place. Tests: the edge buttons and the buttons during a pending reorder are `aria-disabled` with no `disabled` attribute and a click on them sends no request; the pending switch likewise. Mutant: the native `disabled` restored.
17. **The refused delete reaches the screen as designed:** `useDeleteConfirmation` unchanged, `useDeleteLocale` without `onError`, `ConfirmationModal`'s existing `error` prop, `deleteMutation.reset()` before `cancelDelete()`, the client branching on the error class and on `field` / `issues` / `translatedSectionCount`, never on `details.code` (the api-client spreads the server's details last, so for this refusal `details.code` is the locale code).
18. **The strings:** the 61 rows of design §9.2 stand except as rulings 10, 12, 13, 14 and 15 replace them. The labels module's casing stands ("Create", "Save changes", "Basic info", "Back to languages").
19. **The docs:** design §9.4 accepted as written, the fourth edit ("Where it lives today → API" naming `locale-order-lock.ts`, `translation-progress.ts` and `parseServedSectionData`) included; it is §2 and inside R8's grant. Where §9.4 names the page-membership lookup's home, it follows ruling 2.
20. **Fence deviations granted in advance** (record each in your report's `deviations` all the same): `apps/admin/src/lib/api/index.ts`, the one line `locales: endpoints.createLocalesAPI(client)` in `createApi`; `pages/__fixtures__/seed-with-overrides.ts` stays untouched; the test consumers of the changed locale contracts and endpoint (`locale/admin.test.ts`, `locale/admin.empty.test.ts`, `pages/admin.scaffold.test.ts`) change only as far as the changed types require. The two delete-race tests (`locale/admin.delete-race.test.ts`) stay unchanged, as the design keeps the content count on the base client. `locale/__fixtures__/locale-catalog.ts` (`CATALAN.sortOrder` 3 → 4) is inside the fence.

## Facts established since the step prompt was written

- The tree at `dd836fb88` holds the anchors the design names: `marketingPagePath` (`packages/contracts/src/entities/cms/pages/marketing-page-path.ts:15`), `PAGE_SECTIONS_MAP`, `createAuthPutHandler`, `EmptyState`, the `as SectionData<TKey>` cast at `pages/public.ts:59`, `ConfirmationModal`'s `error?: string | null` rendered as an `Alert` (`packages/ui/src/components/modal/confirmation-modal.tsx:18`, `:97`), the api-client's details spread (`packages/api-client/src/client-error-mapping.ts:87-93`, the server's details last), four existing `pg_advisory_xact_lock` call sites and no `FOR UPDATE`, `TX_BUDGET_DEFAULT` without an isolation level.
- Besides the two route files, `cmsLocaleAdminApi` and `getLocalesResponseSchema` have test consumers (`locale/admin.test.ts`, `admin.empty.test.ts`, `admin.delete-race.test.ts`, `pages/admin.scaffold.test.ts:138`); `MAX_SORT_ORDER` is also read by `locale.schema.test.ts` (F10, F11).
- The public reader also filters by `pageSlug`; the count reproduces it (F12). A raw-written non-canonical section (`home:retiredBanner`) is not counted (F22).
- Only 34 of the 35 keys are servable in a non-default locale today: `blog:related` is read by the English-only article reader (`endpoints/cms/blog/public.ts:84`) until 0.4f (F13, ruling 7).
- The LMS reorder runs its checks outside its transaction and answers 400 for every mismatch; it writes in two passes only because `Block` has a unique on (session, order). The catalog has no unique on `sortOrder`: one pass (F15).
- `@repo/ui` depends on `@repo/contracts` (`packages/ui/package.json:23`; nine ui source files import it) and no dep-cruiser rule forbids it (F17). This step changes no ui file.
- The labels module has no tests; the admin test pattern comes from products, users, pages and the pages route test (F18). `page-sections.ts` has no test file yet (F20).
- `apps/admin/src/lib/hooks/use-products.ts:41-46` shows the admin toggle pattern (`createToggleHook`, a success toast per flip); `apps/platform/src/lib/hooks/use-blocks.ts:51` the reorder pattern ("Blocks reordered"). `createToggleHook` takes `(id) => …` and cannot carry `{ code, isEnabled }`: the hand-written `useToggleLocale` stands.
- SB-82 (`deferred.md`): on Chromium 147 a focused control that turns `disabled` drops focus to `body`; ruling 16 keeps the new controls off that path. `DynamicListItem` is not touched here.
- The api-server suite needs a database even for its pure tests (its setup takes a table census): the predicate's unit test runs only under `task test:api`.
- `pnpm lint` runs `eslint --fix`: verify with the read-only `pnpm --filter <pkg> exec eslint . --max-warnings 0` first, then confirm `git status` is clean after `pnpm lint`.
- Production on 2026-11-07: `marketing_locales` holds `en` alone, no section row outside `en`; the local stack's `tdp` and `tdp_test` hold `en` alone. No backfill.
- This run is STOCK: no parallel owner session shares the host today.

## Superseded lines (this file wins)

- The step prompt's R6 "code shown as its path (`/uk/`)": the path is `marketingPagePath(PageSlug.HOME, code)`, `/uk` (ruling 10); the create helper is ruling 10's line.
- The step prompt's R6 "a refused delete names the count and suggests disabling the language instead": by ruling 13 the line suggests disabling only when the language is enabled, and says it stays hidden when it is disabled.
- The step prompt's Sacred clause "`@repo/ui` imports no contracts": false (F17) and dropped; the rest of the Sacred line stands.
- The step prompt's checklist item on the refused delete and the create item: as listed under "Acceptance gates" below.
- The step prompt's "STOP at the plan gate", "STOP at review-flow's triage gate with the report; the ruling arrives as a follow-up message" and "end your turn with a one-line interim report … the planner resumes you": nothing resumes a Codex leg. The gate is answered (this file); the flow's triage is the ruling, applied at once in one fix pass; you stay in your turn on `wait_agent` until every helper has reported, and your final message ends the run.
- The design's strings #34 (shown), the two refusal rows, the four shared aria labels and "Language order updated": rulings 15, 13, 14 and 12.

## How this run proceeds

### Stage 4 — pre-flight

- Create `feat/storefront-billing-admin-languages` from `main`; take the lock as the skill says; write `tasks.md` from `plan.md` (seventeen tasks, the five-commit table under "Task Order", rulings 2, 10, 12–16 folded into the tasks they touch).
- Create your database container (below), migrate it, and take the api-server baseline at `main` before the first change.
- Implement in the plan's order with `pipeline-worker` implement agents as the skill says; the plan's parallel groups may run as parallel agents (STOCK) provided no two agents drive heavy commands at once. Checkpoint commits per the plan's commit table, each with a typed lowercase subject; type-check, lint and the affected tests before every commit; file presence re-verified after every agent round.
- No UI visual check by you: the browser pass is the owner's.

### Stage 5–6 — review-flow at deep, round one of two

- Run the flow as the skill says: fresh lenses, refuters and breaker as `pipeline-worker` agents, the sweep, the synthesis into `.feature-dev/1794069095/review.md`, the triage, then exactly one fix pass. Caller context for the flow: this file (the request and the rulings), `research.md`, `design.md`, and the battery commands below.
- The triage is the ruling: apply exactly the fix-now set in one pass (a typed checkpoint subject naming the change), run type-check, lint and the affected tests before the commit, and never re-review the fix diff. A finding whose fix would add a mechanism, cross the fence or change a contract is never fix-now: it is a carry-forward or a deferral in the report, or a design-change escalation that ends the run `blocked` with the facts.

### Stage 7–8 — Test and Docs

- Test agent: the regression tests of the fix-now set, the plan's acceptance criteria not yet covered (`plan.md` Test Strategy; the plan's tasks already write the planned tests, so fill gaps and do not duplicate), the design's edge cases, ruling 16's tests if the implementation round left them out.
- Docs agent: plan task 15 — `docs/BOUNDED-CONTEXTS.md` §2 as design §9.4 words it (ruling 19). No ADR, no CHANGELOG.
- Two checkpoint commits, `test:` then `docs:`.

### Stage 9 — finalize

- The battery at the FINAL HEAD, inside the fence, one heavy command at a time: `pnpm exec vitest run --project contracts --maxWorkers=2`; `--project admin`; `--project platform` (it must not notice the change); `task test:api TDP_DB_PORT=4714` (serial, against your container, `SHADOW_DATABASE_URL` pointing at your container's `tdp_shadow`); `pnpm check-types`, `pnpm lint`, `pnpm dep:check`, `pnpm format:check` (turbo tasks with `--concurrency=1`; the non-mutating per-package eslint before `pnpm lint`, then `git status` clean); the admin build with `NODE_OPTIONS=--max-old-space-size=2048`.
- The grep gates of the step prompt (below).
- The mutants of the acceptance gates and ruling 16: every mutant restored from a content copy verified by sha256, never `git checkout --` / `git restore`, every change committed before the campaign starts; the results go in the report.
- Push the branch and open the PR through the `pr` skill (pipeline mode: head and base fixed, no branch question). Body per `~/.claude/skills/_shared/pr-template.md`, inside its budget, with the SB-63 Risks paragraph of R9 and the owner's checklist AS CHECKBOXES (below); nothing about the run, no mutants, no counts, no finding IDs.
- Remove your container when the PR is open. Report, with the tree state.

## Scope fence (from the step prompt, verbatim, with ruling 20's grants)

- **Touch:** `packages/contracts/src/entities/cms/locale/**` (the list item schema with the
  count, the reorder schema, `updateLocaleSchema` without `sortOrder`, their types, constants
  and tests); `packages/api-server/src/endpoints/cms/locale/**` (endpoint, tests, fixtures);
  `packages/api-server/src/endpoints/cms/pages/page-sections.ts` and `public.ts` (the shared
  predicate of R2 and nothing else) with their tests; `apps/admin/src/app/api/admin/locales/**`
  (the list read's schema, the new `reorder` route); `apps/admin/src/modules/languages/**`
  (new); `apps/admin/src/app/(dashboard)/languages/**` (new);
  `apps/admin/src/lib/api/endpoints/{locales.ts,index.ts}`,
  `apps/admin/src/lib/hooks/{use-locales.ts,index.ts}`, `apps/admin/src/lib/api/keys.ts`,
  `apps/admin/src/lib/config/navigation.ts`, `apps/admin/src/lib/components/sidebar/icon-map.ts`;
  additions to `apps/admin/src/test/**`; `docs/BOUNDED-CONTEXTS.md` §2 (R8). A direct consumer
  of a granted change (an importing test, a barrel) may change with it, recorded as a `fence`
  deviation in your report. Ruling 20: `apps/admin/src/lib/api/index.ts` (one line) and the
  named test consumers.
- **Do NOT touch:** `apps/admin/src/modules/{pages,labels,products,blog,reviews,contacts,…}`
  (every other module, the page editor included), every other admin route handler,
  `apps/marketing/**`, `apps/platform/**`, `packages/api-server/**` beyond the files above
  (no other endpoint, no `prisma/**` — no migration, no seed change), `packages/contracts/**`
  beyond `cms/locale/` (no section schema, constant or default),
  `packages/{ui,mui,shared,query,api-client,api-routes,env,auth,errors}/**` (if a primitive is
  missing, bring it to the gate), `.github/**`, lockfiles, `initiatives/**`, `CLAUDE.md`,
  `docker-compose.yml`, `taskfile.dist.yml`, any `.env*` file. No new dependency.
- **Not in this step:** the "translate" link and every locale control in the editor, "clear
  translation" (0.4d3); product translations (0.4c); the switcher, `/{code}` routes and the
  marketing reads of the catalog (0.4f); the catalog hardening of SB-58.
- **Secrets.** Never read `apps/*/.env.local`, `packages/api-server/.env` or any `.env*`;
  never print an env value; the shared stack and `prod_snap` are not yours.

## Sacred (charter, as corrected)

The iOS wire contract · prod data additive-only (this step changes no table, no column and
no row on production; the first language the coach creates is his own write through the new
page) · athlete navigation stays free · dep-cruiser context rules (the admin reaches CMS
through `@repo/contracts/cms/*` and its own route handlers) · migrations through
`prisma migrate` + `db-migrate` (none here).

## Acceptance gates (verify yourself before the PR)

- `pnpm exec vitest run --project contracts --maxWorkers=2` and `--project admin` green
  (fenced); `task test:api TDP_DB_PORT=4714` green in your own throwaway container (the
  predicate move touches every public reader); `--project platform` green — it must not notice
  the change.
- `pnpm check-types`, `pnpm lint` (`--max-warnings 0` on the admin), `pnpm dep:check`,
  `pnpm format:check` clean; the admin app builds (fenced, alone).
- Grep gates: `_max: { sortOrder` — no hit under `packages/api-server`; `sortOrder` — absent
  from `updateLocaleSchema`; the literal `35` — no hit in the count code or under
  `apps/admin/src/modules/languages`; the parse-and-non-empty test of R2 exists once (the
  reader and the count both call it); `disabled` — no native `disabled` prop on the move
  buttons or the switch under `apps/admin/src/modules/languages` (ruling 16).
- Tests that must exist, each shown red under a mutant (name the mutants in your report,
  never in the PR body): the count accepts exactly what the reader serves — an inactive row, a
  row that fails to parse, a row with no known key and a row of a section outside
  `SECTION_SCHEMAS` are not counted, a served row is (mutant: count by `data` other than
  `{}`); reorder writes `0..n-1` with English at `0`, answers 400 for `en` or a duplicate and 409
  for a stale set (mutant: the set check removed); create after a delete takes the next free
  slot and two concurrent creates take two slots (mutant: the lock removed); delete closes the
  gap; the PATCH refuses `sortOrder`; in the admin, the English row has no switch, no delete
  and no move controls, a new language shows "0 of N" with N from the contract, the create
  form shows the duplicate and reserved answers on the code field, a refused delete names the
  count in the line of the row's state (ruling 13), the empty state renders with English
  alone, the unavailable move buttons and the pending switch stay focusable and send nothing
  (mutant: native `disabled`).
- The PR contains no file under `initiatives/`, no `CLAUDE.md`, no `.feature-dev/`.
- PR body per the PR-body law, opened through the `pr` skill, with the SB-63 Risks paragraph
  (R9) and the owner's checklist AS CHECKBOXES (adjust the wording to what you built; add
  nothing about the run):
  - [ ] Sidebar → Marketing → Languages; with English alone the page invites adding the first
        language; English is marked Default with no switch, no delete, no move
  - [ ] Create `uk` "Ukrainian": the code rules are explained; the new row is disabled, its
        path reads `/uk` and it shows 0 of 35 translated
  - [ ] Create `uk` again: the duplicate is refused on the code field; `faq` is refused as
        reserved
  - [ ] Enable `uk`, reload: it stays enabled; disable it again
  - [ ] Add a third language and move it above `uk`, once with the mouse and once with the
        keyboard (the focus stays on the arrow); reload: the order persists, English stays first
  - [ ] Rename a language, reload: the name persists; its code cannot be edited
  - [ ] Delete the empty third language after the confirmation
  - [ ] Delete `uk` while it holds a translated section (seeded locally for the pass): refused
        with the count; disabled, it says the language stays hidden; enabled, it suggests
        disabling it
  - [ ] The marketing site is unchanged

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any committed file; synthetic fixtures only.
- No comments in code; delete comments in regions you edit. No AI attribution, signature or trailer anywhere: not in commits, not in the PR, not in code (the owner's rule overrides any harness reminder).
- Commitlint: lowercase conventional subject at most 100 characters, body lines at most 100 characters, long bodies through `git commit -F <file>`; never `--no-verify`; no Cyrillic in any command that contains `git commit` or `gh pr`, nor in a PR body (the checklist names the language "Ukrainian"). A test fixture with "Українська" lives in a file, never on a command line.
- The pre-commit hook runs check-secrets and lint-staged (prettier); the pre-push hook runs dep:check, lint and check-types over the cone, as `pnpm exec turbo` tasks. A red hook is root-cause work; run the hook's task set fenced at `--concurrency=1` first so the hook replays from cache. Touching `packages/contracts` pulls every dependent package into the cone: expect a long pre-push, and warm the cache serially before pushing.
- One PR against `main`; the repository squash-merges; never stack this branch on another. Never merge; the merge is the owner's.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence after every subagent round; nothing of value sits uncommitted while a subagent may be alive. A sub-agent's "done" does not mean its processes died: sweep by pid before the next stage.
- Databases: your own throwaway container (D-19): `docker run -d --name tdp-0-4d2-leg -p 127.0.0.1:4714:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tdp -v "/home/maksym/projects/contrib/the-discipline-program/docker/db/init:/docker-entrypoint-initdb.d:ro" -m 512m postgres:17-alpine`, then `task --dir /home/maksym/projects/contrib/the-discipline-program stack:migrate TDP_DB_PORT=4714` and `task --dir /home/maksym/projects/contrib/the-discipline-program test:api TDP_DB_PORT=4714`; every prisma, tsx and test command sets `DATABASE_URL` and `SHADOW_DATABASE_URL` to your container explicitly (`postgres://postgres:postgres@localhost:4714/tdp_test`, `…/tdp_shadow`). The shared stack `tdp-platform-db` (5432: `tdp`, `tdp_test`, `tdp_shadow`, `prod_snap`) and every other container on the host (`csapi-*`, `cssearch-*`, `film-dna-db`, `tradebench-dev-db`, `s3g-route3`, `tdp-dump-verify`) are not yours. Remove your container (`docker rm -f tdp-0-4d2-leg`) when the PR is open.
- Never start `next dev` or any server: the browser pass is the owner's, in his own tab (the admin runs on 4712; 4710–4713 are his dev ports).
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

STOCK: no parallel owner session shares the host. Parallel helper agents are allowed where the skill fans out (the plan's parallel groups, the review-flow lenses); heavy commands stay one at a time across all of them.

## Reporting

Your final message is the report the wrapper validates against its schema; its `report` field is the executor's PR-open report, for the planner and never for the PR body. It carries: the per-task account of the work (every task of the plan with its checkpoint commit, and where each of rulings 2, 10 and 12–16 landed); the complete stage-agent roster (implement, review-flow lenses, refuters and breaker, fix pass, test, docs: `subagent_type` and count, or INLINE where you ran a stage yourself); round one's candidate count before any cap alongside the reported count, the refuted count, and every finding with its bucket and rationale as the triage applied it; the mutant campaign's results (every mutant with its red tests, every restore hash-verified); the verification evidence (every number measured at the FINAL HEAD, the api-server baseline at `main` beside it); every new user-facing string (the full list: titles, headers, labels, helper texts, notes, chips, toasts, refusals, the empty state, tooltips, aria labels); every deviation (`fence`, `law`, `read-retry`); any design-change escalation. Declare the branch, the HEAD, clean or dirty, that your container is gone, and that no process of yours is alive.
