# Step 0.4d3b — the list sections in translation (storefront-billing P0.4d3b)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**) and
run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER session
that spawned you — not the repo owner) → implement → internal review → PR. This file is
skill INPUT, not a plan override; where it pins a live-verified fact, trust it over
guessing, and verify anchors against the tree.

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

## Read before planning

- `initiatives/storefront-billing/decisions.md` D-21, D-22 and D-24 with all its
  amendments (the 2026-11-08 plan-gate amendment on row identity and the 2026-11-16
  confirmation that what is not a word is edited in English only).
- `initiatives/storefront-billing/deferred.md` rows SB-79, SB-82, SB-83, SB-84, SB-90,
  SB-91, SB-92, SB-93, SB-94, SB-95, SB-98.
- `initiatives/storefront-billing/design-0.4-admin-pages-editor.md` — the brief; this step
  takes the list half of its task 2 ("decide how this reads in a list editor") and the edge
  cases (a 100-character title in the reference, 1280px and 768px). The brief is the spec
  (no designer round for the admin, D-22).
- `initiatives/storefront-billing/step-0.4d3a-prompt.md` and
  `step-0.4d3a-implement-prompt.md` — the rulings the editor was built on; they stand unless
  this file says otherwise. The 0.4d3a design may still sit in `.feature-dev/1794092977/`
  (gitignored scratch; read it if it is there, above all its §5.4.7 on why a refresh resets
  a dirty form): it is context, never authority.
- `docs/BOUNDED-CONTEXTS.md` §2, `docs/adr/0045-cms-managed-localization.md`,
  `docs/runbooks/local-stack.md` (section "Authoring a migration"),
  `docs/runbooks/db-migrate-dispatch.md`.
- `packages/contracts/src/entities/cms/pages/pages.schema.ts` (the six item schemas),
  `section-field-kinds.ts` with its test (the registry, `identity`), `pages-api.schema.ts`
  (the public shapes are `deepPartial`), `section-defaults.ts` with its test.
- `packages/api-server/src/endpoints/cms/pages/section-translation.ts` (`rowIdentity`,
  `matchRow`, `overlayRows`, `isEveryWordWritten`, `composeTranslatedSection`) with its
  test, `admin.ts`, `page-sections.ts`, `public.ts` and every test and fixture beside them;
  `packages/api-server/prisma/migrations/**` (read only: the shape of the existing files).
- `apps/admin/src/modules/pages/**` — all of it: the six list forms,
  `why-choose-feature-card.tsx`, `row-controls.ts`, `shared-styles.ts`, the section editor
  (`use-section-form.ts`, `translation-form-values.ts`, `section-editor-key.ts`), the
  section field components and their context (`section-text-field.tsx`,
  `section-image-field.tsx`, `english-reference.tsx`, `field-at-path.ts`), the fixtures
  (`list-editor.fixtures.ts`, `deferred.fixtures.ts`, `page-locale.fixtures.ts`) and every
  test: `list-section-forms.test.tsx`, the two offer form tests,
  `page-save-lifecycle.test.tsx` and `page-locale-lifecycle.test.tsx` above all;
  `apps/admin/src/lib/hooks/use-pages.ts`.
- `packages/ui/src/components/dynamic-list-item.tsx` with its test.
- `packages/mui/src/theme/components/text-field.ts` (the theme makes every `TextField`
  full width by default) and `apps/admin/src/test/render.tsx` (the helper that mounts the
  real theme).
- `packages/eslint-config/base.js` (`max-lines` 300) and `next.js` (`react/no-multi-comp`
  with `ignoreStateless: false`).
- `~/.claude/skills/_shared/rules.md` (the manifesto) and `~/.claude/skills/_shared/pr-template.md`.

## Live-verified facts (read from the tree on 2026-11-16 at `1be589c78`, and from production the same day)

- The item schemas: `whyChooseFeatureItemSchema` is `{ id, title, description, iconName }`;
  `timelineItemSchema` `{ year, title, description }`, `credentialItemSchema`
  `{ title, description }`, `faqItemSchema` `{ question, answer }`, `requisiteItemSchema`
  and `termsBlockSchema` (`label` / `value`, `heading` / `body`) carry no `id`. Every field
  is a `z.string()`. The write body and the public shapes are `deepPartial()`.
- The registry: only `home:whyChoose` declares `identity: "id"` and classifies `id` as
  shared; the other five lists declare none. The type makes `identity` optional.
- The server: `rowIdentity` returns `id:<id>` for a row with a non-empty identity value and
  `index:<n>` otherwise; `matchRow`, `overlayRows` and `isEveryWordWritten` pair a locale's
  row with its English row through it. A non-default save is composed from the English row
  set, so a stored non-default list has the English rows in the English order.
- `SECTION_DEFAULTS` holds no list row (the scaffold of an English section starts with an
  empty list), and no seed writes page sections.
- The six list forms are six `useFieldArray` users rendering plain MUI `TextField`s, not the
  section field components: no reference, no read-only shared field; each renders
  `DynamicListItem` (from `@repo/ui`, used by these forms and `why-choose-feature-card.tsx`
  only) with `getRowControls`; only `why-choose-section-form.tsx` mints an id
  (`crypto.randomUUID()`) on add. All controls render in every locale.
- `DynamicListItem` disables "Move up" / "Move down" at the edges with the `disabled`
  attribute and labels the controls "Move up", "Move down", "Remove item" with no row in the
  name (SB-82).
- The editor seeds a non-default form with `buildTranslationSeed` (the registry walked over
  the composed read), keys each `SectionEditor` by locale, row id and its filled paths, and
  passes `useForm({ values })`, so a refetch that changes the read resets the form (SB-94).
- Production on 2026-11-16: one language (`en`), 22 section rows on 8 pages, 15 migrations
  (the last `20261016120000_cms_locales`). English list rows: `home:whyChoose` 3 rows, all
  with an `id`; `about:journey` 4, `about:credentials` 3, `faq:content` 3, none with an
  `id`; `offer:requisites` and `offer:terms` have no row yet. No row of another language
  exists.
- Migrations reach production through `.github/workflows/db-migrate.yml` (on a push to
  `main` that touches `prisma/migrations/**`, or dispatched by hand on a branch), apart from
  the Vercel builds; a raw SQL `UPDATE` does not move `updatedAt` (`@updatedAt` is set by
  the Prisma client; no migration creates a trigger). Production runs Postgres 17.12, the
  local stack and the leg's container image 17 (`gen_random_uuid()` is core since 13); no
  test in the tree runs a migration file's SQL today, so the migration's test is a new
  pattern you propose at the gate.
- The save route answers after the write and schedules the marketing cache refresh with
  `after` from `next/server` (PR #458); its test mocks `after`.

## Rulings this step is built on (owner and planner, 2026-11-16)

- **R1 — the scope.** The six list sections in D-24's translation through one shared list
  editor, a row identity for every list with the migration that supplies it, the row
  controls' focus and names, the dirty form across a refresh, the two lifecycle tests. D-24
  and the 0.4d3a rulings stand: what is not a word is edited in English only (the owner
  confirmed it at the 0.4d3a browser gate), so a list's rows are added, removed and moved in
  English only.
- **R2 — every list row has an `id`.** The five item schemas gain `id: z.string()`; the
  registry classifies it as shared and names it as the identity of each of the six lists,
  and the registry's type requires an identity for a list. The editor gives a row its `id`
  when the row is added (the `home:whyChoose` way). The server is the one place that
  guarantees it: an English write stores no list row without a non-empty `id`; how a body
  row that arrives without one, or two rows that share one, are treated is yours to propose
  at the gate (the planner's lean: the server mints the missing one and refuses a duplicate).
- **R3 — no positional pairing after this step.** Once every stored row has an `id` the
  `index:` fallback of `rowIdentity` has no caller in good data. Propose at the gate what
  the code does with a stored row that still lacks an `id` (a row an old tab wrote between
  the production apply and the deploy): the planner's lean is that the fallback goes, the
  admin read never breaks on such a row, and the next English save gives it its `id`; no
  interim bridge stays in the tree (the owner's no-stopgap rule).
- **R4 — the migration (the owner's word: «id ставим миграцией»).** One new data-only
  migration under `packages/api-server/prisma/migrations/`; `schema.prisma` does not change.
  For each of the six (section, list field) pairs it adds an `id` to every row object that
  lacks a non-empty one: an English row gets a fresh UUID; a row of another language takes
  the `id` of the English row at the same position (today's pairing, kept), and a row past
  the end of the English list is left as it is. It changes nothing else: no other key, no
  row order, no `isActive`, no `updatedAt`, no row that already has an `id`, no section
  outside the six. It is idempotent (a second run changes nothing), has no `BEGIN` or
  `COMMIT`, and is written through the shell (the project hook refuses `Edit` and `Write`
  on that directory). It carries a test that runs its SQL against rows built for the cases
  above. You apply it to your own container only; production is the planner's.
- **R5 — one shared list editor (SB-83).** The six forms keep what differs (their fields,
  their labels, the icon choice of `home:whyChoose`) and share everything else: the rows,
  the count, add, move, remove, the reference per row. In English it behaves as today.
  Outside English: no add, no move, no remove; every word of every row shows its English
  beside it and every shared field of a row is read-only with its English value, through
  the field components and the context 0.4d3a built (one mechanism, no per-form copy); the
  words outside the rows get the same treatment. How a row with a long English text and a
  multi-line input reads at 1280px and 768px is yours to propose (the brief's task 2).
- **R6 — the row controls (SB-82).** After a move that puts a row at an edge, keyboard focus
  stays on a control of that row, for Enter and for Space; the controls say which row they
  act on. `DynamicListItem` is the shared component and has no other consumer; change it
  there.
- **R7 — a dirty form across a refresh (SB-94).** When the page under an open form
  refreshes (an English save elsewhere, a focus refetch, another tab) the words the coach
  has typed and not saved are kept, matched by row `id` in a list, while the shared values
  and the row set follow the new English. Bring the mechanism to the gate with its failure
  cases (a row English removed while he was typing in it; a word English emptied). If the
  honest finding is that this needs more than this step can carry, say so at the gate with
  the reason and the smallest safe alternative; the planner takes that to the owner.
- **R8 — the lifecycle tests (SB-93, SB-98).** In `page-save-lifecycle.test.tsx` and
  `page-locale-lifecycle.test.tsx` the assertions that follow an asynchronous refresh hold
  that refresh with a deferred, resolve it inside `act` and assert synchronously, or wait
  for the rendered state; no final-state assertion inside a `waitFor` that a short-lived
  wrong state would pass, and none outside a wait that a slow render would fail.
- **R9 — layout is proven under the real theme.** jsdom has no layout and the theme makes
  every `TextField` full width, which squeezed a banner in 0.4d3a unseen by any test. A
  test that claims a layout property renders through `apps/admin/src/test/render.tsx`.
- **R10 — new user-facing strings** (the controls' names, any hint that the list is edited
  in English, helper texts, aria labels) are English admin copy you own; list every one in
  your report for the planner's veto. Never in the PR body.
- **R11 — docs.** `docs/BOUNDED-CONTEXTS.md` §2: the Invariants line of the
  words-and-the-rest rule names the row identity (a translation's words belong to a row's
  `id`, never to its position) and that a list's structure is English's. No ADR.

## Scope fence

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

## Acceptance gates (verify yourself before the PR)

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
  - [ ] Why Choose in Ukrainian: the icon of each card is the English one and cannot be
        changed here; the title and description show their English
  - [ ] Journey and Offer requisites: the same reading in Ukrainian, the same controls in
        English
  - [ ] Type a Ukrainian answer without saving, change the English FAQ in another tab and
        save, come back: the typed answer is still there
  - [ ] The marketing site is unchanged

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any committed
  file; synthetic fixtures only.
- No comments in code; delete comments in regions you edit. A directive a tool reads (a
  vitest environment docblock, an eslint directive) is not a comment: leave it, or name its
  removal as a deviation.
- Commitlint: lowercase subject, body lines at most 100 characters, long bodies through
  `git commit -F`; never `--no-verify`; no signatures or attribution lines anywhere; no
  Cyrillic in any command that contains `git commit` or `gh pr`, nor in the PR body (a test
  fixture with "Українська" lives in a file, never in a command line).
- Branch `feat/storefront-billing-list-translation` from `main`; one PR against `main`; the
  repository squash-merges, so never stack this branch on another.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence after
  every subagent round; nothing of value sits uncommitted while a subagent may be alive.
- Resource fence (WSL): every heavy command inside `systemd-run --user --scope -q
--slice=heavy.slice -p MemoryMax=3G -p MemorySwapMax=1G -- <cmd>`, builds with
  `NODE_OPTIONS=--max-old-space-size=2048` in the caller's environment, vitest
  `--maxWorkers=2` where a runner takes it (`task test:api` is already serial and takes no
  flag), turbo `--concurrency=1`, one heavy command at a time.
- Concurrency: CAPPED. A parallel session of the owner shares this host. At most ONE
  internal subagent alive at a time; no parallel fan-out; stages strictly sequential.
- Databases: your own throwaway container (D-19): `docker run -d --name tdp-0-4d3b-leg -p
127.0.0.1:4714:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e
POSTGRES_DB=tdp -v "/home/maksym/projects/contrib/the-discipline-program/docker/db/init:/docker-entrypoint-initdb.d:ro"
-m 512m postgres:17-alpine`, then `task stack:migrate TDP_DB_PORT=4714` and `task test:api
TDP_DB_PORT=4714`; every prisma, tsx and test command sets `DATABASE_URL` and
  `SHADOW_DATABASE_URL` to your container explicitly; the shared stack (`tdp-platform-db` on
  5432: `tdp`, `tdp_test`, `tdp_shadow`, `prod_snap`) and every other container on the host
  are not yours; remove your container (`docker rm -f tdp-0-4d3b-leg`) when the PR is open.
- No real Blob call: the local admin's Blob token writes to the production store; tests
  mock the upload and delete endpoints as the existing ones do.
- Never start `next dev` or any server: the browser pass is the owner's, in his own tab (the
  admin runs on 4712; 4710–4713 are his dev ports).
- End every turn declaring where you left the tree (branch, clean or dirty, last commit) and
  whether your container is up.

## Plan-gate report

Bring, each with your recommendation and never as an option list: the item schemas and the
registry after R2, with the registry's type; the server's guarantee of an `id` on an English
write and its treatment of a missing and of a duplicated one; what replaces the `index:`
fallback and what a stored row without an `id` does to the read, the save and the state
(R3); the migration's SQL in full, how its test runs it, and what it does case by case on
the production numbers above; the shared list editor's shape in TypeScript (its props, what
a section form still owns, how `home:whyChoose` keeps its icon choice), the file changes of
the six forms and what is deleted; how a row's fields reach the reference mechanism (the
paths, the context) and how a row reads at 1280px and 768px with a long English text; the
`DynamicListItem` change (focus, names, the props) and every new string in full; the R7
mechanism with react-hook-form (`values`, the reset, dirty fields, the editor key), its
failure cases, or the reasoned finding that it is not this step's; the R8 rewrites of the
two tests; the test files with their describe blocks and the mutants; the
`docs/BOUNDED-CONTEXTS.md` sentences; whether one PR still holds or the Scope Check asks
for a split (the planner takes a split to the owner); anything in this file the tree
contradicts.
