# Step 0.4a — CMS locales: the locale catalog and page sections per locale, server half (storefront-billing P0.4a)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**) and
run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER session
that spawned you — not the repo owner) → implement → internal review (STOP at review-flow's
triage gate with the report; the ruling arrives as a follow-up message) → PR. This file is
skill INPUT, not a plan override; where it pins a live-verified fact, trust it over
guessing, and verify anchors against the tree.

## Mission

D-12 makes a Ukrainian version of the buyer-facing pages a precondition of Monobank's
internet-acquiring application. D-21 (ratified 2026-10-16) decides how: localization is
part of the CMS. The coach adds a language in the admin and translates every page there;
nothing a buyer reads lives in a code message file. The marketing site serves the default
locale, English, on today's unprefixed URLs and every other locale under `/{code}/…`.

This step lays the server half of that mechanism and nothing visible: a locale catalog,
page sections keyed by locale, the public read with a fallback to English, the admin write
per locale, the route handlers both apps will call, and the record of the decision. The
admin screens come in 0.4d, the public `uk` pages in 0.4f; both are designed first and
built on what you ship here. After this step the admin and the site look exactly as they
do today.

One delivery PR, five deliverables:

1. The schema and its migration: `MarketingLocale`, `MarketingPageSection.locale`, the
   unique key `(pageSlug, section, locale)`, English seeded as the default locale.
2. The contracts: `@repo/contracts/cms/locale` (new) and the locale dimension on
   `@repo/contracts/cms/pages`.
3. The api-server: `endpoints/cms/locale/{admin,public}.ts`, the pages endpoints per
   locale with the fallback rule, the fixture and the tests.
4. The route handlers: admin locales CRUD, `locale` on the admin pages routes, `?locale=`
   on the public pages route, a public locales route.
5. The documents: ADR-0045, `docs/BOUNDED-CONTEXTS.md` §2.

Not yours: any admin or marketing screen, the `seo` / `site` / `offer` sections (0.4b),
product translations and the product photo (0.4c), the production dispatch of the
migration (the planner runs the runbook), creating the `uk` locale on any database but a
test one (the coach creates it in the admin, 0.4d).

## Read before planning

- `initiatives/storefront-billing/{charter.md,decisions.md}` — the Sacred list, D-12,
  D-18 (expand before contract), D-19 (your own database container), D-21, D-22.
- `docs/planner-discipline.md` (a)–(i); `docs/BOUNDED-CONTEXTS.md` §2 (CMS), §7, §8.
- `docs/runbooks/db-migrate-dispatch.md` — the rules for the migration file and what the
  planner does with it after your PR; `docs/local-stack.md` "Authoring a migration".
- `docs/adr/0042-adopt-prisma-migrate.md`, `docs/adr/_template.md`, `docs/adr/README.md`.
- The reference migration, verbatim:
  `packages/api-server/prisma/migrations/20260928120000_storefront_billing_w0/migration.sql`
  (lock timeout first, no `BEGIN`/`COMMIT`) and
  `20261008120000_storefront_billing_w0_contract/migration.sql`.
- The CMS pages surface, verbatim: `packages/contracts/src/entities/cms/pages/*`,
  `packages/api-server/src/endpoints/cms/pages/{admin.ts,public.ts,page-sections.ts,*.test.ts,__fixtures__/*}`,
  `apps/admin/src/app/api/admin/pages/**`, `apps/marketing/src/app/api/public/pages/[pageSlug]/route.ts`.
- The CRUD reference you mirror for the locale entity: `packages/contracts/src/entities/cms/review/*`,
  `packages/api-server/src/endpoints/cms/review/{admin.ts,public.ts}`,
  `packages/api-server/src/mappers/cms/{review.mapper.ts,index.ts}`,
  `apps/admin/src/app/api/admin/reviews/**`.
- `packages/api-server/src/db/client.ts` (the soft-delete extension and which models it
  covers — `MarketingLocale` is NOT one of them), `src/utils/prisma-error-handler.ts`,
  `src/utils/json-record.ts`, `src/test/helpers.ts`, `prisma/seed/clear-all.ts`.
- `packages/api-routes/src/{route-helpers.ts,auth-factories.ts,index.ts}` — the factories
  the route handlers use; `apps/admin/src/lib/server/auth.ts`.
- `.dependency-cruiser.cjs` — the CMS rules (`contracts-cms-no-lms-coaching-billing`,
  `marketing-only-cms-backend`); the new folder sits inside `cms/` and needs no rule.
- `packages/contracts/package.json` — the `exports` map you extend (quote it in full at the
  plan gate, before and after).

## Live-verified facts (read from the tree on 2026-10-16 — AUTHORITATIVE)

- `MarketingPage` is `id, slug @unique, title, seoTitle?, seoDesc?, sections[], createdAt, updatedAt`
  (`marketing_pages`). `MarketingPageSection` is `id, pageSlug → MarketingPage.slug (Cascade), section, data Json, isActive @default(true), updatedAt`
  with `@@unique([pageSlug, section])` and `@@index([pageSlug, isActive])`
  (`marketing_page_sections`). The Prisma client exposes the compound key as `pageSlug_section`;
  `cmsPagesAdminApi.updateSection` upserts through it.
- Six page slugs (`PageSlug`), twenty-one section keys (`PAGE_SECTIONS_MAP`), one zod schema
  per key (`SECTION_SCHEMAS`). Section payloads are parsed at read time with `.partial()`;
  an unparsable or empty payload reads as `null` (`extractSectionDataOrNull`).
- `ensurePages` / `ensurePageScaffold` create missing pages and `data: {}` sections lazily on
  the admin read; the public read creates nothing.
- The admin section PATCH (`apps/admin/src/app/api/admin/pages/[slug]/sections/route.ts`)
  revalidates the marketing path of the slug through `PAGE_SLUG_PATH_MAP` and
  `GET {marketing}/api/revalidate?secret&path`.
- The pages tests snapshot, clear and restore `marketing_pages` and `marketing_page_sections`
  (`__fixtures__/marketing-pages-state.ts`); `seedSectionsWithOverrides` creates every page
  and every section with `isActive: true`. `prisma/seed/clear-all.ts` deletes sections then
  pages.
- `@repo/shared` exports `DEFAULT_LOCALE = "en-US"`, the Intl tag `formatPrice` and
  `formatPeriod` use today. It is not the CMS locale code; both stay.
- No i18n library exists in the workspace, and none is added.
- `@repo/errors` has `BadRequestError`, `ConflictError`, `NotFoundError`, `ValidationError`.
  `handlePrismaError` maps `P2002` to `ConflictError` and `P2003` to `BadRequestError`
  ("Referenced … does not exist").
- Production holds the six pages and their sections in English only; every existing row
  becomes the English row by the column default.

## Rulings this step is built on (D-21, D-22)

- **The locale code is the row's identity.** `MarketingLocale.code` is the primary key:
  two or three lowercase ASCII letters (`en`, `uk`), validated by the contract. It is the
  URL segment, the `html lang` value and the `Intl` tag at once. Regional variants (`pt-BR`)
  are out of scope.
- **English is the default locale, by constant and by row.** `DEFAULT_LOCALE_CODE = "en"`
  in `@repo/contracts/cms/locale`. The migration inserts the row; the admin read re-creates
  it lazily (`ensureDefaultLocale`, the `ensurePages` idiom). The default locale cannot be
  disabled or deleted (`BadRequestError`); a non-default locale cannot be deleted while a
  section row carries it (`ConflictError` naming the count, the FK `Restrict` as the
  backstop).
- **One section row per page, section and locale.** `MarketingPageSection.locale` with
  `@default("en")`, a relation to `MarketingLocale` (`onDelete: Restrict`),
  `@@unique([pageSlug, section, locale])`, and `@@index([pageSlug, locale, isActive])`
  replacing `[pageSlug, isActive]`.
- **The fallback rule (public reads).** For the default locale a section reads as today.
  For another locale, a section reads from its own row when that row is active, parses and
  is non-empty; otherwise from the default-locale row under the same three conditions;
  otherwise `null`. A locale that does not exist or is disabled answers `NotFoundError`
  on the public read. The admin read takes any existing locale, disabled included.
- **Writes are per locale, explicitly.** `updateSection` carries `locale`; it refuses an
  unknown locale with `NotFoundError`. The admin read `getPageBySlug(slug, locale)` scaffolds
  the locale's rows with `data: {}` as it does for English today. Both default to the
  default locale when the caller omits it, so the current admin UI keeps working unchanged
  until 0.4d.
- **One path builder for both apps.** `marketingPagePath(slug, locale)` in
  `@repo/contracts/cms/pages` beside `PAGE_SLUG_PATH_MAP`: the default locale keeps the
  unprefixed path, any other locale gets `/{code}` in front (`/uk`, `/uk/about`). The admin
  revalidation uses it now; the marketing links use it in 0.4f.
- **Expand only.** No column is dropped and nothing is renamed; the old `[pageSlug, section]`
  unique index goes because the new key subsumes it. `MarketingPage.seoTitle/seoDesc` are
  untouched here (0.4b moves SEO into a section).

## Deliverable 1 — schema and migration

`packages/api-server/prisma/schema.prisma`:

```prisma
model MarketingLocale {
  code      String                 @id
  name      String
  isEnabled Boolean                @default(true)
  sortOrder Int                    @default(0)
  sections  MarketingPageSection[]
  createdAt DateTime               @default(now())
  updatedAt DateTime               @updatedAt

  @@map("marketing_locales")
}
```

`MarketingPageSection` gains `locale String @default("en")` and
`localeRef MarketingLocale @relation(fields: [locale], references: [code], onDelete: Restrict)`;
the unique and the index as ruled above. Pick the relation field name at the plan gate if
`localeRef` collides with a convention you find; `locale` stays the scalar's name because
the contracts and the URL use that word.

Migration `packages/api-server/prisma/migrations/20261016120000_cms_locales/migration.sql`,
authored from `prisma migrate diff --from-migrations prisma/migrations --to-schema-datamodel prisma/schema.prisma --shadow-database-url postgres://postgres:postgres@localhost:<port>/tdp_shadow --script`
against YOUR container, then edited by hand and only in these ways:

1. The first statement is `SET LOCAL lock_timeout = '5s';`.
2. No guard `DO` block: nothing in the existing rows can be unconvertible (every section
   row takes `'en'` by the default, no pair of rows can collide on the new key because the
   old key was stricter). Say so in the PR body in one sentence.
3. `INSERT INTO "marketing_locales" ("code", "name", "isEnabled", "sortOrder", "createdAt", "updatedAt") VALUES ('en', 'English', true, 0, now(), now());`
   placed after `CREATE TABLE "marketing_locales"` and before the foreign key is added, so
   the default value of the new column references a row that exists.
4. No `BEGIN`, no `COMMIT`, no `citext` line.

The PROD-GUARD hook refuses the Edit and Write tools on `prisma/migrations/`: create the
directory and the file through the shell (`mkdir -p` + a heredoc or `cp`). Everything else
in the file is byte for byte what `migrate diff` produced, and the PR body quotes the
sha256 of the file. Rehearse it on your container twice: on an empty database (the suite's
bootstrap) and on a database where you first created the six pages and their sections
through `cmsPagesAdminApi.getPageBySlug` from the PRE-migration code, then applied the
migration and read every page back through the post-migration code (`en` rows, same data).
A lock-timeout proof (an open transaction holding the table, the apply failing with `55P03`
in about six seconds, `migrate resolve --rolled-back` then a clean apply) is the planner's
at verification, not yours.

`prisma/seed/clear-all.ts`: `marketingLocale.deleteMany()` after `marketingPage.deleteMany()`.

## Deliverable 2 — contracts

New entity folder `packages/contracts/src/entities/cms/locale/` in the `cms/review` layout
(`locale.constants.ts`, `locale.schema.ts`, `locale.types.ts`, `locale-api.schema.ts`,
`locale-api.types.ts`, `index.ts`, a `locale.schema.test.ts`) and the export
`"./cms/locale": "./src/entities/cms/locale/index.ts"` in `packages/contracts/package.json`,
in the alphabetical position between `./cms/dashboard` and `./cms/pages`.

- `locale.constants.ts`: `DEFAULT_LOCALE_CODE = "en"`, `LOCALE_CONSTANTS` (`CODE_PATTERN = /^[a-z]{2,3}$/`,
  `MAX_NAME_LENGTH`).
- `locale.schema.ts`: `localeCodeSchema` (the pattern, `.min(2).max(3)`), `localeSchema`
  (`code`, `name`, `isEnabled`, `isDefault`, `sortOrder`, `createdAt`, `updatedAt`),
  `createLocaleSchema` (`code`, `name`), `updateLocaleSchema` (`name?`, `isEnabled?`,
  `sortOrder?`, `.strict()`), `publicLocaleSchema` (`code`, `name`).
- `locale-api.schema.ts`: `localeCodeParamsSchema` (`{ code }`), `localeQuerySchema`
  (`{ locale: localeCodeSchema.default(DEFAULT_LOCALE_CODE) }`), the admin list and page-data
  shapes if the review pattern has them.
- `cms/pages`: `getPageBySlugParamsSchema` unchanged; the public and admin reads take the
  locale through `localeQuerySchema`; `updatePageSectionBodySchema` gains
  `locale: localeCodeSchema.default(DEFAULT_LOCALE_CODE)` on every variant (keep the
  discriminated union; the `locale` field is common to all variants);
  `adminPageDetailsSchema` gains `locale`; `marketingPagePath(slug, locale)` beside
  `PAGE_SLUG_PATH_MAP` with a test. `cms/pages` importing `cms/locale` is a CMS-internal
  edge the dep-cruiser rules allow; check that the barrel import does not create a cycle.

The contract tests pin: the code pattern (accepts `en`, `uk`, `crh`; refuses `EN`, `uk-UA`,
`u`, `ukr1`, an empty string); `updateLocaleSchema` refuses an unknown key; the default
locale fills in when the query omits it; `marketingPagePath` for the home and a nested
page in both the default and a non-default locale.

## Deliverable 3 — api-server

`endpoints/cms/locale/admin.ts` — `cmsLocaleAdminApi`:

- `getLocales()`: `ensureDefaultLocale()` then every row ordered by `sortOrder asc, code asc`,
  mapped with `isDefault = code === DEFAULT_LOCALE_CODE`.
- `createLocale({ code, name })`: `isEnabled: true`, `sortOrder` = the current maximum plus
  one; a duplicate code through `handlePrismaError({ entity: "Locale", field: "code" })`.
- `updateLocale(code, data)`: `findOrThrow` first; `isEnabled: false` on the default locale
  is a `BadRequestError`; otherwise the review-style conditional spread.
- `deleteLocale(code)`: the default locale is a `BadRequestError`; a locale with section
  rows is a `ConflictError` whose message names the number of rows; then a hard delete (the
  model is not soft-deleted).

`endpoints/cms/locale/public.ts` — `cmsLocalePublicApi.getEnabledLocales()`: the enabled
rows ordered the same way, as `publicLocaleSchema` items. `mappers/cms/locale.mapper.ts`
and the barrel lines in `mappers/cms/index.ts` and `endpoints/cms/index.ts`.

`endpoints/cms/pages/public.ts`: one resolver implements the fallback rule for every page
reader (`getHomePage(locale)` … `getFaqPage(locale)`, `locale` defaulting to the constant).
For a non-default locale it fetches both locales' active rows in one query and picks per
section key; it never issues a query per section. An unknown or disabled locale throws
`NotFoundError` before any page query.

`endpoints/cms/pages/admin.ts`: `getPageBySlug(slug, locale)` (unknown locale →
`NotFoundError`, existence checked against the table, not against `isEnabled`), the
scaffold per locale, `updateSection` with `locale`; `ensurePages` unchanged;
`updatePageMetadata` untouched.

Fixture `__fixtures__/marketing-pages-state.ts`: capture, clear and restore the three
tables (`marketing_locales` included; clear sections → pages → locales, restore locales →
pages → sections; the self-check compares all three). `seedSectionsWithOverrides(overrides, locale?)`
creates the locale row when it is not the default one and the pages once. Every existing
test keeps passing with the default locale and no edit beyond the fixture's signature.

Tests you add (api-server, real database):

- `locale/admin.test.ts`, `locale/admin.empty.test.ts`, `locale/public.test.ts`: the CRUD,
  the three refusals (disable default, delete default, delete a locale with rows), the
  lazy default on a cold table, the ordering, `isDefault`, the enabled filter.
- `pages/public.locale.test.ts`: the fallback matrix for one page and one section key,
  each case against the same seeded English row — the `uk` row missing, present and empty
  (`{}`), present and inactive, present and unparsable, present and valid; plus a page
  whose English row is inactive and whose `uk` row is valid (reads `uk`); plus an unknown
  locale and a disabled locale (`NotFoundError`); plus a `uk` read that never touches a
  third locale's rows.
- `pages/admin.locale.test.ts`: the scaffold creates `uk` rows with `data: {}` and leaves
  the English rows alone; `updateSection` writes the `uk` row and not the English one; an
  unknown locale refuses; the canonical order holds per locale.
- `locale/locale-schema.invariants.test.ts` (the `billing-schema.invariants.test.ts` idiom):
  the unique triple refuses a duplicate and accepts the same section under another locale;
  deleting a locale with sections fails with `P2003`.

The api-server suite is serial and runs on YOUR container: `task stack:migrate TDP_DB_PORT=<port>`
then `task test:api TDP_DB_PORT=<port>`, fenced.

## Deliverable 4 — route handlers

- `apps/admin/src/app/api/admin/locales/route.ts` (GET list, POST create) and
  `apps/admin/src/app/api/admin/locales/[code]/route.ts` (PATCH update, DELETE), in the
  idiom of `apps/admin/src/app/api/admin/reviews/**` (`withAdminAuth`, `withAuthRateLimit`,
  the factories of `@repo/api-routes`; a `DELETE` by a `code` param uses the factory whose
  params schema fits — read `route-helpers.ts` and `auth-factories.ts` before choosing).
- `apps/admin/src/app/api/admin/pages/[slug]/route.ts`: GET takes `?locale=` through
  `localeQuerySchema`; PATCH (metadata) unchanged.
- `apps/admin/src/app/api/admin/pages/[slug]/sections/route.ts`: the body carries `locale`;
  the revalidation path comes from `marketingPagePath(slug, locale)`.
- `apps/marketing/src/app/api/public/pages/[pageSlug]/route.ts`: `?locale=` parsed with
  `localeQuerySchema` and passed to the reader; the response schemas are unchanged.
- `apps/marketing/src/app/api/public/locales/route.ts`: GET the enabled locales
  (`withPublicRoute`, `withRateLimit`, `RATE_LIMIT_TIER.PUBLIC`, `z.array(publicLocaleSchema)`).

Nothing under `apps/*/src/{modules,lib}` changes; the admin and marketing clients keep
calling the routes without a locale and get the default.

## Deliverable 5 — documents

- `docs/adr/0045-cms-managed-localization.md`: status `Accepted`; context (D-12 and the
  owner's direction: the coach adds languages and translations himself; the repo already
  keeps every buyer-facing string in CMS sections); decision (the catalog, sections per
  locale, the default locale constant and row, the fallback rule, unprefixed English and
  `/{code}` for the rest, the `site` / `seo` / `offer` sections and product translations as
  the next steps of the same model — name them as 0.4b and 0.4c, do not build them);
  consequences (every string a buyer reads is CMS data or an `Intl` result; a new language
  is a row, not a deploy; a disabled locale is a 404; no region variants; the fonts of the
  marketing site must cover the scripts of the enabled locales — 0.4f); alternatives
  (code message files with an i18n library — rejected: the coach cannot edit them and the
  CMS already holds the copy; locale-suffixed section keys in one table — rejected: the
  key catalog would multiply per language; separate page slugs per language — rejected:
  the slug is the page's identity across languages).
- `docs/BOUNDED-CONTEXTS.md` §2: the aggregate row `MarketingLocale`, the value object
  `LocaleCode`, the invariants "one section per page, kind and locale", "the default locale
  always exists and stays enabled", "a locale with content cannot be deleted", the fallback
  rule under Invariants, and the "Where it lives today" lines.

## Scope fence

- **Touch:** `packages/api-server/prisma/{schema.prisma,migrations/20261016120000_cms_locales/migration.sql,seed/clear-all.ts}`;
  `packages/api-server/src/endpoints/cms/{index.ts,locale/**,pages/**}`;
  `packages/api-server/src/mappers/cms/{index.ts,locale.mapper.ts}`;
  `packages/contracts/{package.json,src/entities/cms/locale/**,src/entities/cms/pages/**}`;
  `apps/admin/src/app/api/admin/{locales/**,pages/**}`;
  `apps/marketing/src/app/api/public/{locales/**,pages/**}`;
  `docs/adr/0045-cms-managed-localization.md`; `docs/BOUNDED-CONTEXTS.md`.
- **Do NOT touch:** every file under `apps/admin/src/{modules,lib,app/(dashboard)}`,
  `apps/marketing/src/{modules,lib,app}` except the two route folders above,
  `apps/platform/**`, `packages/{ui,mui,shared,query,api-client,env}/**`,
  `endpoints/cms/{blog,contact,dashboard,product,review}/**`, `endpoints/{billing,lms,iam,coaching,mobile-compat,ops,storage}/**`,
  `src/authz/**`, `src/db/**`, `.github/**`, lockfiles, `initiatives/**`, `CLAUDE.md`,
  `docker-compose.yml`, `taskfile.dist.yml`, any `.env*` file. No new dependency, no new
  api-server export subpath, no change to `MarketingPage` or to `PAGE_SECTIONS_MAP`.
- **Not in this step:** the `seo`, `site` and `offer` sections (0.4b); product
  translations and the photo (0.4c); the admin Languages page and the locale tabs (0.4d);
  the `[locale]` routing, the switcher and the fonts (0.4f); prices per locale and the
  sitemap (0.4g); creating `uk` anywhere but a test database.
- **Secrets.** Never read `apps/*/.env.local`, `packages/api-server/.env` or any `.env*`;
  never print an env value; the shared stack and `prod_snap` are not yours.

## Sacred (charter)

The iOS wire contract · prod data additive-only (this migration adds a table, a column
with a default, an index and a key; it drops the superseded unique index and nothing
else) · athlete navigation stays free · dep-cruiser context rules (CMS contracts import no
LMS, Coaching or Billing contract; `apps/marketing` reaches CMS endpoints only) · migrations
through `prisma migrate` + `db-migrate`, expand before contract (D-18).

## Acceptance gates (verify yourself before the PR)

- `pnpm --filter @repo/contracts test` green; `task test:api TDP_DB_PORT=<your port>` green
  in your throwaway container; the `admin` and `platform` vitest projects green
  (`pnpm exec vitest run --project admin`, fenced) — they must not even notice the change.
- `pnpm check-types`, `pnpm lint`, `pnpm dep:check`, `pnpm format:check` clean; the admin
  and marketing apps build (fenced, `NODE_OPTIONS=--max-old-space-size=3072`, one at a time).
- The migration: `prisma migrate diff --from-migrations … --to-schema-datamodel …` against
  your container after the apply reports no drift except the `citext` line; the file's
  first statement is the lock timeout; the file holds no `BEGIN`/`COMMIT`; the two
  rehearsals above pass.
- Grep gates: `pageSlug_section\b` — no hit anywhere (the compound key is now
  `pageSlug_section_locale`); the string literal `"en"` — hits only in `locale.constants.ts`,
  the migration and tests (every other site imports `DEFAULT_LOCALE_CODE`); `@ignore` — no
  hit in `schema.prisma`; `next-intl|i18next|lingui` — no hit in any `package.json`.
- Every new test shown to fail under at least one mutant of the code it pins (name three in
  the PR body: a fallback that returns the empty `uk` row, a delete that removes `en`, an
  upsert that ignores `locale`).
- The PR contains no file under `initiatives/` and no `CLAUDE.md`.
- PR body per the PR-body law, opened through the `pr` skill, with the checklist AS
  CHECKBOXES. There is no browser gate in this step (nothing visible changed); the
  checklist carries what execution has and has not proven:
  - [ ] planner: lock-timeout proof and a rehearsal on a clone of the production snapshot
  - [ ] planner: the migration dispatched to production from this branch before the merge
        (`docs/runbooks/db-migrate-dispatch.md`), with the admin pages editor frozen for the
        window — the old admin code's section upsert names the superseded key
  - [ ] planner: dev Neon migrated by hand after the merge
  - [ ] the `uk` locale is created by the coach in the admin (0.4d), never by a seed

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any
  committed file; synthetic fixtures only.
- No comments in code; delete comments in regions you edit.
- Commitlint: lowercase subject, body lines at most 100 characters, long bodies through
  `git commit -F`; never `--no-verify`; no signatures or attribution lines anywhere; no
  Cyrillic in any command that contains `git commit` or `gh pr`.
- Branch `feat/storefront-billing-cms-locales` from `main`; one PR against `main`; the
  repository squash-merges, so never stack this branch on another.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence
  after every subagent round; nothing of value sits uncommitted while a subagent may be
  alive.
- Capped run: at most ONE internal subagent alive at a time; no parallel fan-out; stages
  strictly sequential.
- Resource fence (WSL): every heavy command inside `systemd-run --user --scope -q
--slice=heavy.slice -p MemoryMax=4G -p MemorySwapMax=1G -- <cmd>`, builds with
  `NODE_OPTIONS=--max-old-space-size=3072` in the caller's environment, vitest
  `--maxWorkers=2`, turbo `--concurrency=2`, one heavy command at a time.
- Databases: your own throwaway container (D-19, `postgres:17-alpine`, `--memory=512m`, a
  free port, the stack's init directory mounted: `docker run -d --name <name> -p 127.0.0.1:<port>:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tdp -v "$PWD/docker/db/init:/docker-entrypoint-initdb.d:ro" -m 512m postgres:17-alpine`;
  `task stack:migrate TDP_DB_PORT=<port>` then `task test:api TDP_DB_PORT=<port>`); the
  shared stack (`tdp`, `tdp_test`, `tdp_shadow`, `prod_snap`) and every other container on
  the host are not yours; remove your container when the PR is open.
- End every turn declaring where you left the tree (branch, clean or dirty, last commit).

## Plan-gate report

Bring, each with your recommendation and never as an option list: the `schema.prisma`
delta in full and the migration SQL in full; the resolver of the fallback rule in
TypeScript (signature, the one query, the pick); the contract file list and the
`package.json` `exports` map before and after; the admin locales route handlers' factory
choices; how `?locale=` enters the public pages route; the fixture's new shape and the
restore order; the three test files' describe blocks; anything in this file the tree
contradicts.
