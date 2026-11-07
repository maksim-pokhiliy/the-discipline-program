# Step 0.4d2 — the admin Languages page (storefront-billing P0.4d2)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**) and
run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER session
that spawned you — not the repo owner) → implement → internal review (STOP at review-flow's
triage gate with the report; the ruling arrives as a follow-up message) → PR. This file is
skill INPUT, not a plan override; where it pins a live-verified fact, trust it over
guessing, and verify anchors against the tree.

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

## Read before planning

- `initiatives/storefront-billing/design-0.4-admin-languages.md` — the whole brief (it is
  the spec: the admin has no designer round, owner ruling 2026-10-16), read against the
  rulings below, which settle its open points.
- `docs/adr/0045-cms-managed-localization.md` and `docs/adr/0046-chrome-and-seo-as-cms-sections.md` (the locale
  model and the fallback), `docs/BOUNDED-CONTEXTS.md` §2 (the `MarketingLocale` rows,
  Invariants → "The default locale always exists and stays enabled…", "A locale with
  content cannot be deleted", "A non-default locale falls back to English section by
  section"; Where it lives today → Consumer apps).
- `initiatives/storefront-billing/deferred.md` rows SB-55, SB-56, SB-58, SB-63.
- `packages/api-server/src/endpoints/cms/locale/**` — `admin.ts`, `locale-access.ts`,
  `public.ts`, every test and both fixtures (`locale-catalog.ts`, `lock-race.ts`).
- `packages/api-server/src/endpoints/cms/pages/public.ts` lines 28–90
  (`extractSectionDataOrNull`, `localeChain`, `readSections`) and `page-sections.ts`.
- `packages/contracts/src/entities/cms/locale/**` and
  `packages/contracts/src/entities/cms/pages/pages-api.schema.ts` (`SECTION_SCHEMAS`).
- The reorder pattern: `packages/api-server/src/endpoints/lms/block/admin.ts` (`reorder`),
  `packages/contracts/src/entities/lms/block/block.schema.ts` (`reorderBlocksSchema`) and
  `apps/platform/src/app/api/platform/training-plans/[planId]/sessions/[sessionId]/blocks/reorder/route.ts`.
- `apps/admin/src/app/api/admin/locales/**` (the two route files).
- The admin catalog pattern: `apps/admin/src/modules/labels/**`,
  `apps/admin/src/app/(dashboard)/labels/**`, `apps/admin/src/lib/api/endpoints/labels.ts`,
  `apps/admin/src/lib/hooks/use-labels.ts`, `apps/admin/src/lib/api/keys.ts`,
  `apps/admin/src/lib/config/navigation.ts`, `apps/admin/src/lib/components/sidebar/icon-map.ts`,
  `apps/admin/src/lib/components/create-button/`; from `@repo/ui` `DataTable`,
  `ConfirmationModal`, `IndicatorChip`; from `@repo/query` `useDeleteConfirmation` — read how
  it surfaces a refused delete before you design the refusal.
- The admin test pattern: `apps/admin/src/test/**` (including `interactions.ts` from 0.4d1),
  the labels and pages tests, the root `vitest.config.ts` (project `admin`, jsdom,
  `testTimeout: 15_000`).
- `packages/eslint-config/base.js` (`max-lines` 300) and `next.js`
  (`react/no-multi-comp` with `ignoreStateless: false`).
- `~/.claude/skills/_shared/rules.md` (the manifesto) and `~/.claude/skills/_shared/pr-template.md`.

## Live-verified facts (read from the tree on 2026-11-07 at `9bc182514`)

- `MarketingLocale`: `code String @id`, `name`, `isEnabled Boolean @default(false)`,
  `sortOrder Int @default(0)`, `sections`, `createdAt`, `updatedAt`; no unique on
  `sortOrder`. `LOCALE_ORDER` sorts by `sortOrder` then `code`. `ensureDefaultLocale`
  creates `en` "English" enabled (`skipDuplicates`). `prisma/seed/clear-all.ts` deletes every
  non-default locale.
- `cmsLocaleAdminApi` (`endpoints/cms/locale/admin.ts`):
  - `getLocales` returns `Locale[]` (no count);
  - `createLocale` writes `isEnabled: false`, `sortOrder: (_max.sortOrder ?? 0) + 1` (SB-56);
  - `updateLocale` takes `name`, `isEnabled`, `sortOrder` (the contract caps `sortOrder` at
    `LOCALE_CONSTANTS.MAX_SORT_ORDER` = 999) and refuses to disable `en` with a 400;
  - `deleteLocale` refuses `en` (400), answers 404 for an unknown code, counts the rows of
    the locale whose `data` differs from `{}` and refuses with a `ConflictError` (details
    `{ code, translatedSectionCount }`) when any exists; otherwise it deletes the `{}` rows
    and the locale in one transaction, a concurrent insert surfacing as a 409 (P2003).
- The routes: `GET` / `POST /api/admin/locales` (`getLocalesResponseSchema =
z.array(localeSchema)`), `PATCH` / `DELETE /api/admin/locales/[code]` (the PATCH handler
  returns no body). These two files are the only consumers of `cmsLocaleAdminApi`,
  `getLocalesResponseSchema` and `updateLocaleRequestSchema` outside the contracts package;
  `MAX_SORT_ORDER` is read only by `locale.schema.ts`.
- The public reader serves a section from a locale's row when the row is active (filtered in
  the query), `SECTION_SCHEMAS[key].deepPartial().safeParse(data)` succeeds and the parsed
  object has at least one key; otherwise it falls back to English. A parse failure is
  reported to monitoring as a warning. The predicate lives inline in
  `extractSectionDataOrNull` (`public.ts:37`).
- `SECTION_SCHEMAS` has thirty-five keys (home 6, storefront 4, about 6, blog 4, contact 3,
  faq 4, offer 4, site 4).
- The admin has no locales client endpoint, hook, query key, module, page or navigation
  entry. The Marketing group lists Products, Reviews, Blog, Pages, Contacts.
- The LMS reorder pattern: `PUT …/reorder` with `{ orderedIds }` (unique, at least one), a
  full-set check (every member present, none foreign, the count equal to the set's), the
  writes in one `$transaction`, the route through `createAuthPutByParamHandler`.
- Production on 2026-11-03: `marketing_locales` holds `en` alone; no section row outside
  `en`. The local stack's `tdp` and `tdp_test` hold `en` alone as well.

## Rulings this step is built on (planner 2026-11-07; the owner accepted the contour the same day)

- **R1 — the scope.** The Languages page and the server changes it needs, nothing in the
  page editor. The design's task 5 (the "translate" link) moves to 0.4d3 (owner, 2026-11-07):
  the editor learns `?locale=` there, and a link that silently opens English is a bridge.
- **R2 — one notion of "translated".** Move the reader's predicate (parse under
  `deepPartial`, at least one key) into one exported pure function next to the section
  helpers; `extractSectionDataOrNull` calls it and keeps its monitoring call, the count calls
  it and reports nothing. A locale's `translatedSectionCount` is the number of its active
  rows whose `section` is a key of `SECTION_SCHEMAS` and which that function accepts. The
  admin list read carries it for every locale (one read of the non-default rows, the
  predicate in TypeScript; ≤ 35 rows a locale). The denominator is the key count of
  `SECTION_SCHEMAS`, taken from the contract, never a literal; products are not counted
  until 0.4c. The delete guard keeps its own notion (`data` other than `{}`) — SB-55 stays
  split as ruled: the count here, the exact `{}` clear in 0.4d3. Rationale: two predicates for
  one word is the defect SB-55 recorded; the progress the coach reads must be the site he
  will see.
- **R3 — the order invariant.** The catalog's `sortOrder` values are always exactly
  `0..n-1`, English `0`. Three writers keep it, each in one transaction: create appends at
  `n` (the row count — SB-56's ruling, equal to `max + 1` under the invariant); reorder
  rewrites the non-default rows to `1..n-1`; delete moves every row after the deleted one up
  by one. `sortOrder` leaves `updateLocaleSchema` (reorder is its only writer) and
  `MAX_SORT_ORDER` goes with it if nothing else reads it. Writers of the order serialize on
  one lock so two concurrent creates cannot take the same slot; a race test proves it, in the
  style of `lock-race.ts`. No backfill: production and the local stack hold `en` alone.
  Rationale: SB-56's "row count" alone ties after a delete (en 0, uk 1, pl 2; delete uk;
  create de → 2 = pl), so the invariant has to be kept by every writer, not assumed by one.
- **R4 — the reorder write.** `PUT /api/admin/locales/reorder` with `{ orderedCodes }`: the
  non-default codes in their new order, unique, `en` absent. A body that names `en` or a
  duplicate is a 400; a set that differs from the catalog's non-default codes (a stale view:
  a language added or deleted meanwhile) is a 409; the response is the full ordered list in
  the list read's shape. The static `reorder` segment sits beside `[code]`; no locale code can
  collide with it (2–3 letters). Rationale: the LMS pattern, one write per move, no
  half-applied swap.
- **R5 — English pinned.** The default row is always first, carries a "Default" mark, and has
  no enable control, no delete and no move controls; its name is editable like any other.
  The progress shows on non-default rows only (English is the source).
- **R6 — the module mirrors labels.** `apps/admin/src/modules/languages/` with list, create
  and edit views and their app routes under `(dashboard)/languages`; client endpoint, hooks
  and query keys beside the labels ones; the navigation entry "Languages" in the Marketing
  group right after Pages, with a translate icon. The list (a `DataTable`): language name
  (linking to its edit view), code shown as its path (`/uk/`), the enable switch, the move up /
  down controls, the progress ("0 of 35 translated", a quiet bar in theme tokens, no new
  color), the delete action. Create: code and name; the code's rules inline (two or three
  lowercase letters, used in links as `/uk/`, cannot be changed later); the note that a new
  language starts hidden from the site — translate it, then enable it from the list; the
  duplicate-code (409) and reserved-code (400) answers shown on the code field. Edit: the name
  only, the code read-only. Delete: a confirmation; a refused delete names the count and
  suggests disabling the language instead. The empty state (English alone) invites adding the
  first language without drama. Desktop at 1280 px, tablet at 768 px holds.
- **R7 — new user-facing strings** (labels, helper texts, notes, confirmations, refusals,
  the empty state, aria labels) are English admin copy you own; list every one in your report
  for the planner's veto. Never in the PR body.
- **R8 — docs.** `docs/BOUNDED-CONTEXTS.md` §2: the order invariant as one Invariants line,
  the count's notion in the fallback line or beside it, and Consumer apps naming the admin
  Languages page. No ADR: the catalog's model is ADR-0045's and stands.
- **R9 — the SB-63 hazard in the PR.** The first PR that creates languages from the UI names
  it: a code rollback past 0.4a, or a preview of an older branch, serves whichever row it finds
  first once a non-default locale has rows; the rollback note hides them first
  (`UPDATE marketing_page_sections SET "isActive" = false WHERE locale <> 'en'`; a bare locale
  delete is refused by the FK and the content guard). One short Risks paragraph, plain words.

## Scope fence

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
  deviation in your report.
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

## Sacred (charter)

The iOS wire contract · prod data additive-only (this step changes no table, no column and
no row on production; the first language the coach creates is his own write through the new
page) · athlete navigation stays free · dep-cruiser context rules (the admin reaches CMS
through `@repo/contracts/cms/*` and its own route handlers; `@repo/ui` imports no contracts)
· migrations through `prisma migrate` + `db-migrate` (none here).

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
  reader and the count both call it).
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
  count, the empty state renders with English alone.
- The PR contains no file under `initiatives/`, no `CLAUDE.md`, no `.feature-dev/`.
- PR body per the PR-body law, opened through the `pr` skill, with the owner's checklist AS
  CHECKBOXES, about these items (where, then what to see; adjust to what you built, add
  nothing about the run):
  - [ ] Sidebar → Marketing → Languages; with English alone the page invites adding the first
        language; English is marked Default with no switch, no delete, no move
  - [ ] Create `uk` "Українська": the code rules are explained; the new row is disabled and
        shows 0 of 35 translated
  - [ ] Create `uk` again: the duplicate is refused on the code field; `faq` is refused as
        reserved
  - [ ] Enable `uk`, reload: it stays enabled; disable it again
  - [ ] Add a third language, move it above `uk`, reload: the order persists, English stays
        first
  - [ ] Rename a language, reload: the name persists; its code cannot be edited
  - [ ] Delete the empty third language after the confirmation
  - [ ] Delete `uk` while it holds a translated section (seeded locally for the pass): refused
        with the count and the suggestion to disable it
  - [ ] The marketing site is unchanged

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any committed
  file; synthetic fixtures only.
- No comments in code; delete comments in regions you edit.
- Commitlint: lowercase subject, body lines at most 100 characters, long bodies through
  `git commit -F`; never `--no-verify`; no signatures or attribution lines anywhere; no
  Cyrillic in any command that contains `git commit` or `gh pr` (a test fixture with
  "Українська" lives in a file, never in a command line).
- Branch `feat/storefront-billing-admin-languages` from `main`; one PR against `main`; the
  repository squash-merges, so never stack this branch on another.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence after
  every subagent round; nothing of value sits uncommitted while a subagent may be alive. When
  you have nothing to do but wait for a sub-agent, end your turn with a one-line interim report
  (branch, HEAD, dirty or clean, which sub-agent runs); the planner resumes you — that pause is
  never the end of the run.
- Resource fence (WSL): every heavy command inside `systemd-run --user --scope -q
--slice=heavy.slice -p MemoryMax=3G -p MemorySwapMax=1G -- <cmd>`, builds with
  `NODE_OPTIONS=--max-old-space-size=2048` in the caller's environment, vitest
  `--maxWorkers=2` where a runner takes it (`task test:api` is already serial and takes no
  flag), turbo `--concurrency=1`, one heavy command at a time.
- Databases: your own throwaway container (D-19): `docker run -d --name tdp-0-4d2-leg -p
127.0.0.1:4714:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e
POSTGRES_DB=tdp -v "$PWD/docker/db/init:/docker-entrypoint-initdb.d:ro" -m 512m
postgres:17-alpine`, then `task stack:migrate TDP_DB_PORT=4714` and `task test:api
TDP_DB_PORT=4714`; every prisma, tsx and test command sets `DATABASE_URL` and
  `SHADOW_DATABASE_URL` to your container explicitly; the shared stack (`tdp`, `tdp_test`,
  `tdp_shadow`, `prod_snap`) and every other container on the host are not yours; remove your
  container (`docker rm -f tdp-0-4d2-leg`) when the PR is open.
- Never start `next dev` or any server: the browser pass is the owner's, in his own tab (the
  admin runs on 4712).
- End every turn declaring where you left the tree (branch, clean or dirty, last commit) and
  whether your container is up.

## Plan-gate report

Bring, each with your recommendation and never as an option list: the shared predicate's
name, home and signature and the reader's call after the move; the list item schema and the
reorder schema in TypeScript; the lock that serializes the order writers and the race test's
shape; the four writers' transactions (create, reorder, delete, the PATCH without
`sortOrder`); the module's file layout, routes and the list's columns; how a refused delete
reaches the screen through `useDeleteConfirmation` (or what replaces it, and why); every new
string in full (labels, helper texts, the note, confirmations, refusals, the empty state) so
the planner can veto wording; the test files with their describe blocks; the
`docs/BOUNDED-CONTEXTS.md` sentences; anything in this file the tree contradicts.
