# Step 0.4d3a — languages in the page editor (storefront-billing P0.4d3a)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**) and
run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER session
that spawned you — not the repo owner) → implement → internal review → PR. This file is
skill INPUT, not a plan override; where it pins a live-verified fact, trust it over
guessing, and verify anchors against the tree.

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
field, its links and image the English ones, read-only (D-24); he writes the words, saves,
and the section turns translated; "Clear translation" returns a section to the English
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

## Read before planning

- `initiatives/storefront-billing/design-0.4-admin-pages-editor.md` — the brief; this step
  takes its tasks 1 (language switching), 2 (the reference, for every form that is not a
  list), 3 (empty vs translated vs stale) and 5 (save semantics), and the edge cases; the
  list half of task 2 is 0.4d3b's, task 4 shipped in 0.4d1. The brief is the spec (no
  designer round for the admin, D-22).
- `initiatives/storefront-billing/decisions.md` D-21, D-22 and D-24.
- `initiatives/storefront-billing/deferred.md` rows SB-55, SB-63, SB-76, SB-77, SB-79,
  SB-80, SB-81, SB-85, SB-89.
- `docs/adr/0045-cms-managed-localization.md`, `docs/adr/0046-chrome-and-seo-as-cms-sections.md`,
  `docs/BOUNDED-CONTEXTS.md` §2 (Invariants → the fallback line with
  `parseServedSectionData` and the delete guard's notion; Where it lives today → Consumer
  apps).
- `packages/api-server/src/endpoints/cms/pages/admin.ts`, `page-sections.ts`, `public.ts`
  lines 28–90, and every `admin*.test.ts` beside them;
  `packages/api-server/src/endpoints/cms/locale/translation-progress.ts`, `locale-access.ts`,
  `admin.ts` (the list read's count).
- `packages/contracts/src/entities/cms/pages/pages.schema.ts` (every section schema),
  `pages-api.schema.ts`, `pages-api.types.ts` (`AdminPageSection`,
  `CorrelatedAdminPageDetails`), `pages.constants.ts`, `marketing-page-path.ts`, and their
  tests; `packages/contracts/src/entities/cms/locale/**`.
- `apps/admin/src/app/api/admin/pages/**` (the list, the page GET with `localeQuerySchema`,
  the section PATCH and its revalidation through `marketingRevalidationTarget(slug, locale)`).
- `apps/admin/src/modules/pages/**` — the views, `pages-edit-form.tsx`, the section editor
  and its key, every form under `components/sections/`, the configs, the Pages list, the
  fixtures and every test, `page-save-lifecycle.test.tsx` and `image-save-gate.test.tsx`
  above all; `apps/admin/src/lib/hooks/use-pages.ts`, `use-upload.ts`
  (`IMAGE_MUTATION_KEY`), `use-locales.ts`; `apps/admin/src/lib/api/endpoints/pages.ts`,
  `keys.ts`.
- `apps/admin/src/modules/languages/**` (the row cells, the list section, its tests).
- The admin test pattern: `apps/admin/src/test/**`, the root `vitest.config.ts` (project
  `admin`, jsdom, `testTimeout: 15_000`).
- `packages/eslint-config/base.js` (`max-lines` 300) and `next.js` (`react/no-multi-comp`
  with `ignoreStateless: false`).
- `~/.claude/skills/_shared/rules.md` (the manifesto) and `~/.claude/skills/_shared/pr-template.md`.

## Live-verified facts (read from the tree on 2026-11-08 at `e7043f6e1`)

- `cmsPagesAdminApi.getPageBySlug(slug, locale = "en")` asserts the locale
  (`assertAdminLocale`: English is ensured, any other code must exist, enabled or not),
  scaffolds the page for that locale (`createMany … skipDuplicates`: English rows get the
  section defaults, every other locale gets `{}`), reads the page's rows of that locale only
  (no `isActive` filter) and returns `{ slug, locale, sections: [{ id, section, data,
updatedAt }] }` in the page's section order, each `data` parsed with
  `SECTION_SCHEMAS[key].deepPartial().parse(...)`: a stored row that fails to parse makes the
  whole read throw, while the public reader skips it.
- `cmsPagesAdminApi.getPages()` returns `{ id, slug, title, updatedAt }` per page, no locale.
- `cmsPagesAdminApi.updateSection(payload)` upserts the row of `payload.locale` (default
  `en`), refuses a section outside the page (404) and an unknown locale (P2003 → 404). The
  write body is `{ section, data: SECTION_SCHEMAS[key].deepPartial(), locale default "en" }`,
  so `{}` is a valid body today, for English too.
- The section PATCH route revalidates `marketingRevalidationTarget(slug, body.locale)`.
- `parseServedSectionData(section, data)` (`pages/page-sections.ts`) returns `served` /
  `empty` / `invalid`; the public reader and `countServedSections`
  (`locale/translation-progress.ts`, which also requires `isSectionOfPage`) both call it; the
  locales list read feeds the count active rows only.
- Every field of every section schema is a `z.string()` (titles, texts, `buttonHref`,
  `backgroundImage`, `iconName`, row `id`, …): nothing in the schemas tells a word from a
  link. Six sections hold lists: `home:whyChoose` (`features`), `about:journey` (`timeline`),
  `about:credentials` (`items`), `faq:content` (`items`), `offer:requisites` (`items`),
  `offer:terms` (`blocks`); their forms are the six `useFieldArray` users under
  `components/sections/`.
- The admin client: `api.pages.getPageBySlug(slug)` sends no locale; `adminKeys.pages.bySlug(slug)`
  has no locale; the section save body carries no `locale`, so every save writes English.
  `useUpdatePageSection` refreshes with `fetchQuery({ …pageDetailsQuery(slug), staleTime: 0 })`
  before its toast. The editor keys each `SectionEditor` by `getSectionEditorKey` (row id plus
  the sorted top-level keys) and seeds `useForm({ values: section.data })`; "Update Section"
  is disabled while the save is pending in this mount, while an image mutation runs
  (`useIsMutating({ mutationKey: IMAGE_MUTATION_KEY })`) or while the form is clean. The open
  accordion lives in `?section=`. `SECTION_FORMS` (`config/section-forms.tsx`) maps every key
  to a form element; the forms are bespoke per section, with `FlatFieldsSectionForm` /
  `flat-field-group.tsx` shared by the site sections.
- `AdminPageDetails["sections"][number]` collapses to one object because
  `adminSectionVariants` is a homogeneous array (SB-76); the admin correlates through the
  type-only aliases `AdminPageSection<TKey>` and `CorrelatedAdminPageDetails`, consumed by
  `lib/api/endpoints/pages.ts`, the editor, the edit form, the fixtures and three tests.
  `updatedAt` is `z.date()` in the contract and an ISO string on the admin client (SB-77).
- The Languages list (`modules/languages`) links a row's name to its edit view; it has no
  link into the editor.
- Production on 2026-11-07 after the 0.4d2 deploy: `marketing_locales` holds `en` alone at
  `0`, twenty-one section rows, all `en`, six page rows. The first open of a page in a new
  locale on production writes that locale's `{}` scaffold rows; they count as nothing, and a
  locale delete removes them.

## Rulings this step is built on (owner and planner, 2026-11-08)

- **R1 — the scope.** The locale in the editor and the Pages list, the section states,
  D-24's registry, seeding and save rule for every section, the English reference in every
  form that is not a list form, "Clear translation", the per-page progress, the "Translate"
  link, and the editor lifecycle debts the locale switch makes live (SB-76, SB-77, SB-80,
  SB-81). The six list forms are not touched (0.4d3b); in this step their sections already
  follow D-24's seeding and save rule through the section editor, without a reference beside
  their rows.
- **R2 — D-24, words and the rest (owner, 2026-11-08, after a side review showed that a
  section filled with English and saved counts as translated while half of it is English).**
  Every string field of every section schema, list rows included, is either a **word** (a
  visitor reads it: titles, texts, labels, button texts, requisite labels and values, terms,
  years, everything not listed below) or **shared** (never language-dependent: links, image
  URLs, icon names, row ids). The registry lives in the contracts package beside
  `SECTION_SCHEMAS`, and a test walks every schema and fails on a field that is not
  classified. In a non-default locale the shared part of a section is read-only and always
  the current English (D-24 amended the same day, owner «да, принимаю»): its shared fields
  and, for a list, its structure (the rows, their ids, their order; rows are added, removed
  and moved in English only). The server writes every non-default save from the English row:
  the English shared values and row set, the locale's own words matched by row `id` (a word
  of a row English no longer has is dropped). A section that is not translated opens with its
  words empty, the English shown beside each. "Update Section" is enabled only when every word
  whose English counterpart is non-empty is filled. A translated section opens with its own
  words and the current English shared values. In this step the six list forms keep their add,
  remove and move controls in every locale (0.4d3b removes them outside English); a structure
  change made there in a non-default locale is not saved, by the server rule above. Rationale: "translated" then means every word written in the
  language, the count the coach reads stays the reader's own predicate (one notion, SB-55's
  lesson), and no link or image is lost to the per-section fallback (D-21).
- **R3 — one notion of "translated", owned by the server.** A section's state in a locale
  is computed on the server with `parseServedSectionData` and the reader's other conditions
  (the row active, its section of its page): `translated` when the reader would serve the
  locale's own row, otherwise `not translated`; `English newer` when it is translated and the
  English row's `updatedAt` is later than the locale row's. The client renders the state and
  never recomputes it. The page's translated count on the Pages list is the number of its
  sections in state `translated`, its denominator the page's section count from the
  contract, never a literal. English shows no states and no progress (it is the source). A
  stored row that fails to parse no longer breaks the admin read; how such a row is presented
  is yours to propose at the gate.
- **R4 — the English reference rides the same read.** For a non-default locale the page read
  carries each section's English `data` and `updatedAt` beside the locale's own row, in one
  request. The forms that are not list forms render the English value of every word beside
  its input, read-only (the brief's task 2: a text field, a long text area); the English
  shared fields render read-only with their English values. One mechanism serves every form (the
  editor provides the reference, the field renders it); no per-form copy of the logic.
- **R5 — the stale mark.** An `English newer` section opens with its own row and the
  current English beside each word; "Update Section" is enabled without an edit there, so the
  coach can confirm a translation that still holds, which clears the mark and, by R2's
  server rule, writes the current English links, images and list rows. Until that save the
  locale's page shows the previous ones; the stale mark is the signal (SB-90 records the
  automatic alternative, not this step's).
- **R6 — saves carry the locale; English is never written by accident.** Every read and
  write of the editor names its locale: the query key, the client call, the save body. A save
  from the Ukrainian editor writes `uk` and nothing else; switching the language while a form
  is dirty must not carry its values into the other language (the remount of SB-81). The
  current language is shown on the whole screen, not only in the switch.
- **R7 — "Clear translation".** On a translated or `English newer` section of a non-default
  locale, a confirmed action writes exactly `{}` for that section and locale; the section
  returns to `not translated` and to R2's seeding. English has no clear, and the server
  refuses a `{}` write to the default locale with a 400 (no path may blank an English
  section). With the clear writing exactly `{}`, SB-55 closes: the delete guard keeps its
  wider notion (any `data` other than `{}` blocks a delete), which is the safe side.
- **R8 — the language switch.** One control used on the Pages list and in the editor: every
  language of the catalog in its order, English first and marked default, a disabled
  language marked as hidden from the site and still editable. The locale lives in the URL
  (`?locale=`; absent means English) beside `?section=`; an unknown code in the URL shows the
  admin's not-found treatment, never English silently.
- **R9 — the "Translate" link.** Each non-default row of the Languages list links to the
  Pages list in that language. The English row has none.
- **R10 — the editor lifecycle.** SB-80: the save lock follows the mutation, not the mount
  (`mutationKey` per page and locale plus `useIsMutating`, the pattern of
  `IMAGE_MUTATION_KEY`), and a refresh that lands after the coach came back does not
  overwrite what he typed since; SB-81: a language switch or a server change remounts the
  section (its key carries the locale) so no floating label overlaps a value. SB-76: type the
  admin read by section in the contract so the type-only aliases retire. SB-77: the admin
  read's `updatedAt` is the wire's string at the client boundary, typed so, before anything
  compares it; list in your report every other admin read that carries a `Date` and how it
  reaches the client (the audit, no fix beyond this read).
- **R11 — new user-facing strings** (the switch, the language banner, the state marks, the
  reference's label, the save rule's hint, "Clear translation" and its confirmation, the
  progress, the link, helper texts, toasts, aria labels) are English admin copy you own; list
  every one in your report for the planner's veto. Never in the PR body.
- **R12 — docs.** `docs/BOUNDED-CONTEXTS.md` §2: an Invariants line for the words-and-the-rest
  rule; the Consumer apps line names the editor's locale controls and the Pages list
  progress; the fallback line's last sentence on the delete guard is rewritten for the clear
  writing exactly `{}`. No ADR: D-24 is the record and ADR-0045's model stands.

## Scope fence

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
  report.
- **Do NOT touch:** the six list forms, `why-choose-feature-card.tsx`, `row-controls.ts`
  (0.4d3b); every other admin module and route handler; `apps/marketing/**`,
  `apps/platform/**`; `packages/api-server/**` beyond the files above (no `prisma/**`: no
  migration, no seed change); `packages/contracts/**` beyond the files above;
  `packages/{ui,mui,shared,query,api-client,api-routes,env,auth,errors}/**` (if a primitive
  is missing, bring it to the gate); `.github/**`, lockfiles, `initiatives/**`, `CLAUDE.md`,
  `docker-compose.yml`, `taskfile.dist.yml`, any `.env*` file. No new dependency.
- **Not in this step:** the reference inside the list forms, the shared list editor, the
  list controls' focus (0.4d3b); SB-79's double submit and SB-84's bounds (OPEN); product
  translations (0.4c, 0.4e); the switcher, `/{code}` routes, internal links per locale and
  every marketing read (0.4f).
- **Secrets.** Never read `apps/*/.env.local`, `packages/api-server/.env` or any `.env*`;
  never print an env value; the shared stack and `prod_snap` are not yours.

## Sacred (charter)

The iOS wire contract · prod data additive-only (this step changes no table and no column;
the rows it creates on production are the coach's own writes and the `{}` scaffold of a
locale he opens) · athlete navigation stays free · dep-cruiser context rules (the admin
reaches CMS through `@repo/contracts/cms/*` and its own route handlers) · migrations through
`prisma migrate` + `db-migrate` (none here).

## Acceptance gates (verify yourself before the PR)

- `pnpm exec vitest run --project contracts --maxWorkers=2` and `--project admin` green
  (fenced); `task test:api TDP_DB_PORT=4714` green in your own throwaway container;
  `--project platform` green — it must not notice the change.
- `pnpm check-types`, `pnpm lint` (`--max-warnings 0` on the admin), `pnpm dep:check`,
  `pnpm format:check` clean; the admin app builds (fenced, alone).
- Grep gates: no literal section count in the progress code or under
  `apps/admin/src/modules/pages`; `CorrelatedAdminPageDetails` and `AdminPageSection<` gone
  from `apps/admin/src` once SB-76 lands (or the gate names why one survives); none of the
  six list forms, `why-choose-feature-card.tsx` or `row-controls.ts` in the diff.
- Tests that must exist, each shown red under a mutant (name the mutants in your report,
  never in the PR body): the registry classifies every string field of every schema, list
  rows included (mutant: a field removed from the registry); the server state matches the
  reader — an inactive row, a row that fails to parse, an empty row and a row of another page
  are not translated, a served row is, and a served row older than its English is
  `English newer` (mutant: state by `data` other than `{}`); a row that fails to parse does
  not break the admin read; a `{}` write to English is a 400 and to `uk` clears the section
  (mutant: the English guard removed); the Pages list count per page in a locale (mutant: a
  literal denominator); in the admin, a save from the Ukrainian editor sends `locale: "uk"` and
  never touches the English cache (mutant: the locale dropped from the body or the key); a
  not-translated section opens with its shared fields from English and its words empty, and
  "Update Section" stays disabled until every word with a non-empty English counterpart is
  filled (mutant: the word check removed); a non-default write is stored with the English shared values and
  row set whatever the body says (a changed link or image, an extra row, a reordered list),
  the locale's words kept by row `id` (mutant: the server rule removed); the shared fields of
  a form that is not a list form are read-only in a non-default locale; an `English newer`
  section saves without an edit and its saved row carries the current English image; the English value
  shows beside a word of a form that is not a list form; a dirty form does not survive a
  language switch; the save lock holds across leaving and returning to the editor during a
  save (SB-80); "Clear translation" sends exactly `{}` after its confirmation; the English row
  of Languages has no "Translate" link.
- The PR contains no file under `initiatives/`, no `CLAUDE.md`, no `.feature-dev/`.
- PR body per the PR-body law, opened through the `pr` skill, with the owner's checklist AS
  CHECKBOXES, about these items (where, then what to see; adjust to what you built, add
  nothing about the run; no Cyrillic in the body — name the language "Ukrainian"):
  - [ ] Languages → the `uk` row's "Translate" opens Pages in Ukrainian, each page with its
        translated count; English has no such link
  - [ ] Open Home in Ukrainian: the screen says Ukrainian everywhere and that the language is
        hidden from the site; every section is marked not translated
  - [ ] Open the Home hero: the words are empty with the English beside each, the link and
        the background image are the English ones and cannot be changed here; Update Section stays unavailable
        until every word is written
  - [ ] Write the words, Update Section: the section turns translated, Home's count on Pages
        grows by one; reload: it persists; switch to English: the English hero is unchanged
  - [ ] Change the English hero title and background image and save; back in Ukrainian the
        hero is marked older than its English; Update Section without an edit clears the
        mark, and the Ukrainian hero now shows the new image
  - [ ] Clear translation on the hero after the confirmation: it is not translated again;
        the Languages progress drops by one
  - [ ] Type in a Ukrainian field, switch the language without saving: nothing typed reaches
        the other language; no label overlaps a value
  - [ ] The marketing site is unchanged

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any committed
  file; synthetic fixtures only.
- No comments in code; delete comments in regions you edit.
- Commitlint: lowercase subject, body lines at most 100 characters, long bodies through
  `git commit -F`; never `--no-verify`; no signatures or attribution lines anywhere; no
  Cyrillic in any command that contains `git commit` or `gh pr`, nor in the PR body (a test
  fixture with "Українська" lives in a file, never in a command line).
- Branch `feat/storefront-billing-editor-locales` from `main`; one PR against `main`; the
  repository squash-merges, so never stack this branch on another.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence after
  every subagent round; nothing of value sits uncommitted while a subagent may be alive.
- Resource fence (WSL): every heavy command inside `systemd-run --user --scope -q
--slice=heavy.slice -p MemoryMax=3G -p MemorySwapMax=1G -- <cmd>`, builds with
  `NODE_OPTIONS=--max-old-space-size=2048` in the caller's environment, vitest
  `--maxWorkers=2` where a runner takes it (`task test:api` is already serial and takes no
  flag), turbo `--concurrency=1`, one heavy command at a time.
- Databases: your own throwaway container (D-19): `docker run -d --name tdp-0-4d3a-leg -p
127.0.0.1:4714:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e
POSTGRES_DB=tdp -v "/home/maksym/projects/contrib/the-discipline-program/docker/db/init:/docker-entrypoint-initdb.d:ro"
-m 512m postgres:17-alpine`, then `task stack:migrate TDP_DB_PORT=4714` and `task test:api
TDP_DB_PORT=4714`; every prisma, tsx and test command sets `DATABASE_URL` and
  `SHADOW_DATABASE_URL` to your container explicitly; the shared stack (`tdp-platform-db` on
  5432: `tdp`, `tdp_test`, `tdp_shadow`, `prod_snap`) and every other container on the host
  are not yours; remove your container (`docker rm -f tdp-0-4d3a-leg`) when the PR is open.
- Never start `next dev` or any server: the browser pass is the owner's, in his own tab (the
  admin runs on 4712; 4710–4713 are his dev ports).
- End every turn declaring where you left the tree (branch, clean or dirty, last commit) and
  whether your container is up.

## Plan-gate report

Bring, each with your recommendation and never as an option list: the registry's shape and
home, and the full classification of every string field of every section (a table the
planner can read field by field); the admin read's and the Pages list read's shapes in
TypeScript (the state, the English reference, the count, the SB-76 typing, the SB-77 date);
where the state is computed and how it reuses `parseServedSectionData`; the default-locale
`{}` guard; the client's query keys, calls and save body with the locale; the switch, the
language banner and the state marks (where they sit, what they say, how a disabled language
shows); the server's non-default write rule (the English shared values and row set, words by
row `id`); the seeding and the save rule of R2 and R5 with react-hook-form (`values`,
`isDirty`, the word check, the key), lists included; the reference mechanism and how a form
that is not a list form receives it; the SB-80 lock and its reconciliation; the "Clear
translation" flow; the "Translate" link; how an unparsable stored row is presented; the
module's file changes; every new string in full; the test files with their describe blocks;
the `docs/BOUNDED-CONTEXTS.md` sentences; the SB-77 audit list; anything in this file the
tree contradicts.
