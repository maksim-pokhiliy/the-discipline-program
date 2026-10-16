# Step 0.4b — content surfaces, server half: the `seo` section per page, the `site` pseudo-page, the `offer` page (storefront-billing P0.4b)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**) and
run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER session
that spawned you — not the repo owner) → implement → internal review (STOP at review-flow's
triage gate with the report; the ruling arrives as a follow-up message) → PR. This file is
skill INPUT, not a plan override; where it pins a live-verified fact, trust it over
guessing, and verify anchors against the tree.

## Mission

D-21 (ratified 2026-10-16) says everything a buyer reads is CMS data or an `Intl` result.
After 0.4a the page sections exist per locale with a fallback to English, but three kinds
of buyer-facing text still live in code: the page SEO titles and descriptions
(`apps/marketing/src/lib/seo/seo-page.ts`), the site chrome (navigation labels, the
footer, the lead form, the 404 and error pages) and the public offer with the seller's
requisites, which does not exist at all and which the acquiring checklist requires.

This step moves all three into the content model and ships nothing visible: a `seo`
section on every public page, a `site` pseudo-page whose sections hold the chrome, an
`offer` page with its three sections, the public and admin reads and writes for them, the
English defaults that pre-fill the new English sections so the coach translates instead
of authoring, and the retirement of the dead page-metadata write (SB-49). The admin forms
for the new sections come in 0.4d, the marketing site reads them in 0.4f and 0.4g; both
are built on what you ship here. After this step the marketing site looks exactly as it
does today; the admin's Pages list gains two rows (Site, Offer) whose editors stay empty
until 0.4d.

One delivery PR, four deliverables:

1. The contracts: the new section keys and schemas, the two page slugs, the per-page
   `seo` on every page response, the `offer` and `site` responses, the section defaults.
2. The api-server: the readers and the scaffold for the new pages and sections, the
   defaults applied to the default locale only, the fixtures and the tests, SB-49.
3. The route handlers: the two new entries of the public pages route, the revalidation of
   the whole site when the `site` page changes, the admin metadata PATCH removed.
4. The documents: ADR-0046, `docs/BOUNDED-CONTEXTS.md` §2.

Not yours: any admin or marketing screen or component, the marketing `generateMetadata`
and `PAGE_SEO` / `SEO_CONFIG` (0.4f removes them), the offer page route and the sitemap
(0.4g), product translations and the photo (0.4c), any migration (none is needed: the
schema change is `@ignore` on two columns), creating content on any database but a test
one.

## Read before planning

- `initiatives/storefront-billing/{charter.md,decisions.md}` — the Sacred list, D-12,
  D-18 (expand before contract), D-19 (your own database container), D-21, D-22 (as
  amended: the admin UI is specced by the planner), D-23.
- `initiatives/storefront-billing/deferred.md` — SB-49 (what you retire here), SB-51,
  SB-52 and SB-54 (riders of this step, below), SB-61 (a reported type weakness of the
  section write types; verify it in research and say what you found), SB-4 (the requisites are the coach's; you ship no
  real requisites and no placeholder legal text).
- `initiatives/storefront-billing/design-0.4-admin-pages-editor.md` — the planner's UI
  spec of the editor that will host the new sections; its "What changes with languages"
  paragraph is the content model you build; `design-0.4-marketing-offer.md` and
  `design-0.4-marketing-storefront-uk.md` — the public shapes the sections must feed.
- `docs/planner-discipline.md` (a)–(i); `docs/BOUNDED-CONTEXTS.md` §2 (CMS), §7, §8;
  `docs/adr/0045-cms-managed-localization.md` (0.4a), `docs/adr/_template.md`.
- The whole of `packages/contracts/src/entities/cms/pages/` as 0.4a left it, every
  consumer of `PageSlug`, `PAGE_SLUG_PATH_MAP`, `PAGE_SECTIONS_MAP`, `SECTION_SCHEMAS`,
  `marketingPagePath`, `updatePageMetadataSchema` and `UpdatePageMetadataInput` (git grep
  across `apps` and `packages`, tests included), and every reader of the page response
  schemas (`apps/marketing/src/{app,lib,modules}`, `apps/marketing/src/lib/api/endpoints/pages.ts`).
- `packages/api-server/src/endpoints/cms/pages/**` as 0.4a left it (`public.ts` with the
  fallback resolver, `admin.ts` with the per-locale scaffold, `page-sections.ts`,
  `__fixtures__/*`, every test), `endpoints/cms/locale/locale-access.ts`,
  `endpoints/cms/blog/public.ts` (reads the blog page's sections for its labels).
- The chrome whose strings you model: `apps/marketing/src/lib/config/navigation.ts`,
  `lib/components/layout/{footer/index.tsx,header/drawer.tsx,header/navigation.tsx}`,
  `lib/components/ui/{lead-form-modal.tsx,product-card.tsx}`, `lib/seo/{seo.ts,seo-page.ts}`,
  `app/{layout,not-found,error}.tsx`, `packages/ui/src/components/error-pages/*`,
  `packages/contracts/src/entities/cms/contact/contact.schema.ts` (the lead form's
  validation messages).
- The admin surfaces that compile against the section catalog:
  `apps/admin/src/modules/pages/components/section-editor/index.tsx` (`SECTION_LABELS` is
  `Record<SectionSchemaKey, string>`, `renderForm` returns `null` for a key without a form
  and the editor then renders nothing), `apps/admin/src/app/api/admin/pages/[slug]/{route.ts,sections/route.ts}`,
  `apps/marketing/src/app/api/{public/pages/[pageSlug]/route.ts,revalidate/route.ts}`.

## Live-verified facts (read from the tree on 2026-10-16, before 0.4a merged — re-verify the 0.4a-touched ones)

- `PageSlug` has six members; `PAGE_SLUG_PATH_MAP: Record<PageSlug, string>`;
  `PAGE_SECTIONS_MAP` has 21 keys; `SECTION_DEFINITIONS` / `SECTION_SCHEMAS` /
  `sectionVariants` / `adminSectionVariants` enumerate them; `SectionSchemaKey = keyof typeof SECTION_SCHEMAS`.
- `updatePageMetadataSchema` (`title`, `seoTitle?`, `seoDesc?`) and
  `cmsPagesAdminApi.updatePageMetadata` exist and are called only by the PATCH of
  `apps/admin/src/app/api/admin/pages/[slug]/route.ts`; no admin screen or hook calls that
  route; `MarketingPage.seoTitle` / `seoDesc` are read nowhere. `MarketingPage.title` is
  written by `ensurePages` (`capitalize(slug)`) and read by the admin list.
- `SECTION_LABELS` in the admin section editor is typed `Record<SectionSchemaKey, string>`:
  adding a key to `SECTION_SCHEMAS` without a label fails `check-types`. `renderForm`'s
  `default` returns `null`, and `SectionEditor` returns `null` when the form is `null`, so a
  section without a form is simply not shown. The admin Pages list renders
  `capitalize(page.slug) Page` per row and `getPages` calls `ensurePages(Object.values(PageSlug))`.
- The marketing public pages route (as 0.4a leaves it) is a `Record<PageSlug, { fetch, schema }>`
  indexed by the parsed slug; adding enum members forces entries.
- `apps/marketing/src/app/api/revalidate/route.ts` reads `secret` and `path` (default `/`)
  and calls `revalidatePath(path)`; the admin sections PATCH calls it through
  `triggerMarketingRevalidation(marketingPagePath(slug, locale))`.
- Code-level English in the chrome today: `MARKETING_NAVIGATION.headerLinks` (Home,
  Programs, About, Blog, FAQ, Contact; `footerLinks` empty); drawer buttons `aria-label`
  "Open menu" / "Close menu"; nav `aria-label="Marketing"`; footer `SEO_CONFIG.tagline`
  ("Your Discipline Dictates Your Success"), `SEO_CONFIG.subcopy` ("Transform your fitness
  through discipline"), "© {year} {siteName}. All rights reserved."; the lead form modal
  title "Get started", "You're getting: {product.title}", labels "Name", "Contact (phone,
  Telegram, email)", "Message (optional)", "Send" / "Sending…", success "You're all set" /
  "Thanks for your interest. We'll reach out to you shortly." / "Send another", error
  fallback "Something went wrong. Please try again."; the zod messages of
  `createLeadSubmissionSchema` ("Phone, Telegram, or other contact is required", "Program is
  required"); `ProductCard` default `actionLabel = "Learn More"` (the storefront grid
  passes none, so the storefront page shows the code default while the home preview has
  `cardActionLabel`); `NotFoundPageContent` ("404", "Page not found", "Go home");
  `ErrorPageContent` ("Error", "Something went wrong", "Try again", "Go home");
  `GlobalErrorPageContent` renders its own `<html>` without providers and cannot read CMS
  data. `PAGE_SEO` holds title, description and keywords for the six pages.
- `public.ts` readers return `null` for a section that is missing, inactive, unparsable or
  empty, per locale with the fallback chain; the public read creates nothing; the admin
  `getPageBySlug(slug, locale)` scaffolds every section of the page for that locale with
  `EMPTY_SECTION_DATA` (`{}`, `skipDuplicates`); a locale is deletable only while no row
  with content (`data <> {}`) carries it.
- `__fixtures__/section-data.ts`: `FULL_SECTION_DATA: FullSectionData` must hold every key;
  `PARTIAL_SECTION_DATA` is typed over `(typeof PAGE_SECTIONS_MAP)[PageSlug]["hero"]`, which
  stops compiling once a page without a `hero` exists.
- No seed writes marketing sections; `prisma/seed/clear-all.ts` deletes sections, pages
  and non-default locales. Production holds the coach's English content for the 21
  existing sections and nothing for the new ones.

## Rulings this step is built on (D-21, planner 2026-10-16)

- **Two new page slugs.** `PageSlug.OFFER = "offer"` (a public page at `/offer`, English
  unprefixed, `/{code}/offer` otherwise) and `PageSlug.SITE = "site"` (a pseudo-page with
  no URL whose sections hold the chrome). The path map covers public pages only
  (`PublicPageSlug = Exclude<PageSlug, PageSlug.SITE>`, a guard `isPublicPageSlug`);
  `marketingPagePath` takes a `PublicPageSlug`. Never a fake path for `site`.
- **Section order is editor order.** In `PAGE_SECTIONS_MAP` the `seo` key is the LAST
  entry of every public page (the coach edits the hero first, search text last);
  `offer: { hero, requisites, terms, seo }`; `site: { navigation, footer, leadForm, errors }`.
  New keys: `home:seo`, `storefront:seo`, `about:seo`, `blog:seo`, `contact:seo`,
  `faq:seo`, `offer:hero`, `offer:requisites`, `offer:terms`, `offer:seo`,
  `site:navigation`, `site:footer`, `site:leadForm`, `site:errors` (35 keys in all).
- **Schemas** (`pages.schema.ts`, plain `z.string()` like every section, no length caps —
  the 0.4d forms show the hints):
  - `seoSectionSchema = { title, description }` (D-21 and the editor spec: two fields; the
    `keywords` of `PAGE_SEO` are dropped, search engines ignore them).
  - `offerPageHeroSchema = titleSubtitleSchema` (no button, no background);
    `requisiteItemSchema = { label, value }`, `offerRequisitesSchema = { title, items: requisiteItem[] }`;
    `termsBlockSchema = { heading, body }`, `offerTermsSchema = { title, blocks: termsBlock[] }`.
  - `siteNavigationSchema = { home, storefront, about, blog, faq, contact, offer, openMenuLabel, closeMenuLabel, languageSwitchLabel }`
    — the link labels are keyed by the public page slug so 0.4f maps `PageSlug → label`
    without a second table; the order and the hrefs stay code.
  - `siteFooterSchema = { tagline, subcopy, rightsLabel }` (the © year and the site name
    stay code).
  - `siteLeadFormSchema = { title, productPrefix, nameLabel, contactLabel, messageLabel, submitLabel, sendingLabel, successTitle, successMessage, sendAnotherLabel, errorMessage, contactRequiredMessage }`.
  - `siteErrorsSchema = { notFoundTitle, errorTitle, retryLabel, homeLabel }` (the "404"
    glyph stays code; the global error page stays English by construction).
  - `storefrontGridSchema` gains `cardActionLabel` (the "Learn More" leak above);
    additive, every response is `deepPartial`, old rows keep parsing.
- **Responses.** Every existing page response schema gains
  `seo: seoSectionSchema.deepPartial().nullable()` (the marketing consumers parse with
  `parseResponse` and ignore keys they do not read); new `getOfferPageResponseSchema`
  (`seo`, `hero`, `requisites`, `terms`) and `getSitePageResponseSchema` (`navigation`,
  `footer`, `leadForm`, `errors`), types `OfferPageData`, `SitePageData`. Readers
  `cmsPagesPublicApi.getOfferPage(locale)` and `getSitePage(locale)` follow the 0.4a
  reader shape exactly (`assertPublicLocale` first, one `readSections` query, `pick` per
  section); the six existing readers add `seo: pick(map.seo)`.
- **English defaults, one source of truth.** New file
  `packages/contracts/src/entities/cms/pages/section-defaults.ts` exporting
  `SECTION_DEFAULTS`, typed `{ [K in DefaultedSectionKey]: z.infer<(typeof SECTION_SCHEMAS)[K]> }`
  over exactly the seven `seo` keys and the four `site` keys, holding today's English
  strings (the `PAGE_SEO` titles and descriptions, the chrome strings listed above, verbatim
  — "Learn More" is not among them, `cardActionLabel` has no default because its row
  already exists). No default for any `offer` section (the requisites are the coach's,
  placeholder legal text would be false content) and none for the 21 existing keys (their
  English lives in production already). The admin scaffold writes
  `SECTION_DEFAULTS[section] ?? EMPTY_SECTION_DATA` when it scaffolds the DEFAULT locale and
  `EMPTY_SECTION_DATA` for every other locale (`skipDuplicates` keeps every existing row);
  the public read still creates nothing, so until the coach opens a page in the admin the
  new sections read `null` and 0.4f falls back to the same `SECTION_DEFAULTS` in code.
  Why: the coach must translate English, not author it; the editor's English reference
  column (0.4d) is empty otherwise; one constant serves the scaffold and the fallback so
  the strings are never duplicated. A contracts test asserts every default parses through
  its schema with `.strict()`.
- **SB-49 retires here.** Delete `updatePageMetadataSchema`, `UpdatePageMetadataInput`,
  `cmsPagesAdminApi.updatePageMetadata`, the PATCH export of
  `apps/admin/src/app/api/admin/pages/[slug]/route.ts` (the GET stays) and their tests;
  `MarketingPage.seoTitle` and `seoDesc` get `@ignore` in `schema.prisma` (no migration; the
  drift check must stay clean; the columns drop in the next contract migration per D-18 —
  update the SB-49 row's wording only through the planner, never in `initiatives/`).
- **Revalidation of the chrome.** A `site` section changes every page, so its PATCH
  revalidates the root layout: `marketingRevalidationTarget(slug, locale)` in
  `cms/pages/marketing-page-path.ts` returns `{ path: marketingPagePath(slug, locale), type: "page" }`
  for a public page and `{ path: "/", type: "layout" }` for `site`; the admin sections
  PATCH serializes both into the revalidate URL; the marketing revalidate route parses
  `path` and `type` through a zod schema in `@repo/contracts/cms/pages`
  (`revalidateQuerySchema`: `path` a string starting with `/`, `type` `z.enum(["page","layout"]).default("page")`)
  and calls `revalidatePath(path, type)`. Today's unvalidated `path ?? "/"` goes.
- **Admin compile edits only.** `SECTION_LABELS` gains the fourteen labels ("Home SEO",
  "Storefront SEO", …, "Offer Hero", "Offer Requisites", "Offer Terms", "Offer SEO", "Site
  Navigation", "Site Footer", "Site Lead Form", "Site Error Pages"); no form, no view, no
  hook changes. The Pages list showing "Site Page" and "Offer Page" rows with empty
  editors is the accepted state until 0.4d.
- **Riders.** SB-51: `packages/api-routes/src/auth-factories.ts` validates params, query
  and body through `parseRequest` instead of `schema.parse` (a malformed param answers 400,
  never 500), with one test per factory in `packages/api-routes/src/__tests__/`
  (`pnpm --filter @repo/api-routes test`); the precedent and the reason are in the ledger
  row. SB-52: the seven `%p` placeholders in the five contract
  test files named in the ledger become `%s`. SB-54: `RESERVED_LOCALE_CODES` in
  `@repo/contracts/cms/locale` (`locale.constants.ts`: `api` plus every public path segment
  that matches the code pattern, today `faq`), refused by `localeCodeSchema` through a
  `.refine` whose message names the reserved code, so `createLocale` and its route answer
  400 on `faq`; plus a test in `cms/pages` that every first segment of the public path map
  matching `^[a-z]{2,3}$` is on the list (the list cannot import the path map: `cms/pages`
  already imports `cms/locale`). All three are small, fenced below, and come with their
  own commits.

## Deliverable 1 — contracts

`packages/contracts/src/entities/cms/pages/`: `pages.constants.ts` (the two slugs,
`PublicPageSlug`, `isPublicPageSlug`, the path map over public slugs, the fourteen keys),
`pages.schema.ts` (the new schemas and the `cardActionLabel`), `pages-api.schema.ts`
(`SECTION_DEFINITIONS` and `SECTION_SCHEMAS` extended in editor order, the `seo` field on
the six responses, the two new responses, `revalidateQuerySchema`, the metadata schema
removed), `pages-api.types.ts`, `section-defaults.ts` (new), `marketing-page-path.ts`
(`PublicPageSlug` parameter, `marketingRevalidationTarget`), the barrel line, and the
tests: `pages-api.schema.test.ts` and `.empty.test.ts` extended, a `section-defaults.test.ts`,
`marketing-page-path.test.ts` extended with the `site` target and the `offer` path.
`packages/contracts/README.md` stays (its taxonomy names entities, not sections).

## Deliverable 2 — api-server

`endpoints/cms/pages/public.ts` (two readers, `seo` on six), `admin.ts` (the defaults rule
in the scaffold; `updatePageMetadata` gone), `page-sections.ts` (unchanged unless the
defaults rule needs a helper beside `EMPTY_SECTION_DATA`), `prisma/schema.prisma`
(`@ignore` on the two columns, nothing else), `__fixtures__/section-data.ts`
(`FULL_SECTION_DATA` for 35 keys, `PARTIAL_SECTION_DATA` typed over public pages),
tests: the existing pages tests extended for `seo`, a `public.offer.test.ts` and a
`public.site.test.ts` (own-locale row, fallback to English, `null` when neither qualifies,
disabled and unknown locale → `NotFoundError` before any query), `admin.test.ts` extended
(the scaffold of `site` and `offer`; the default locale scaffold writes the defaults and
never overwrites an existing row; a non-default locale scaffold writes `{}`; `updateSection`
accepts the new keys; `storefront:grid.cardActionLabel` round-trips), and the removal of
the metadata tests. `endpoints/cms/blog/public.ts` is untouched (it reads `blog:grid` and
`blog:related` labels, both unchanged).

## Deliverable 3 — route handlers

`apps/marketing/src/app/api/public/pages/[pageSlug]/route.ts` gains the `offer` and `site`
entries (the `Record<PageSlug, …>` forces them); `apps/marketing/src/app/api/revalidate/route.ts`
parses `revalidateQuerySchema`; `apps/admin/src/app/api/admin/pages/[slug]/sections/route.ts`
revalidates through `marketingRevalidationTarget`; `apps/admin/src/app/api/admin/pages/[slug]/route.ts`
loses its PATCH. `packages/api-routes/src/auth-factories.ts` per SB-51 with its tests.

## Deliverable 4 — documents

- `docs/adr/0046-chrome-and-seo-as-cms-sections.md` (next free number — verify): the
  `site` pseudo-page, the `seo` section per page, the `offer` page, the English defaults
  that the default-locale scaffold applies and the marketing fallback reuses, the
  layout-wide revalidation, SB-49's retirement; alternatives rejected (a `SiteSettings`
  table — rejected: a second content model with its own locale handling; message files —
  rejected by D-21; seeding the defaults by migration — rejected: content is not schema,
  and the scaffold idiom already exists).
- `docs/BOUNDED-CONTEXTS.md` §2: `PageSlug` lists eight values; the `site` pseudo-page and
  the `offer` page under "Aggregates"; "Section defaults" under Invariants; the "Where it
  lives today" lines.

## Scope fence

- **Touch:** `packages/contracts/src/entities/cms/pages/**`;
  `packages/api-server/prisma/schema.prisma` (the two `@ignore` lines only);
  `packages/api-server/src/endpoints/cms/pages/**`;
  `apps/admin/src/app/api/admin/pages/**`;
  `apps/admin/src/modules/pages/components/section-editor/index.tsx` (`SECTION_LABELS` only);
  `apps/marketing/src/app/api/{public/pages/**,revalidate/**}`;
  `packages/api-routes/src/auth-factories.ts` and its tests (SB-51);
  the five contract test files of SB-52;
  `packages/contracts/src/entities/cms/locale/{locale.constants.ts,locale.schema.ts,locale.schema.test.ts}` (SB-54);
  `docs/adr/0046-*.md`; `docs/BOUNDED-CONTEXTS.md`.
- **Do NOT touch:** every other file under `apps/admin/src/{modules,lib,app}`,
  `apps/marketing/src/{modules,lib,app}` except the two route folders above
  (`PAGE_SEO`, `SEO_CONFIG`, the layout, the chrome components and `sitemap.ts` wait for
  0.4f and 0.4g), `apps/platform/**`, `packages/{ui,mui,shared,query,api-client,env}/**`,
  `endpoints/cms/{blog,contact,dashboard,locale,product,review}/**`, `endpoints/{billing,lms,iam,coaching,mobile-compat,ops,storage}/**`,
  `prisma/migrations/**` (no migration in this step), `prisma/seed/**`, `src/authz/**`,
  `src/db/**`, `.github/**`, lockfiles, `initiatives/**`, `CLAUDE.md`,
  `docker-compose.yml`, `taskfile.dist.yml`, any `.env*` file. No new dependency, no new
  api-server export subpath, no change to the locale module.
- **Not in this step:** the admin forms for the new sections and the Languages page
  (0.4d); product translations and the photo (0.4c); the marketing chrome reading the
  `site` sections, `generateMetadata` reading `seo`, the `[locale]` routing (0.4f); the
  offer page route, the footer and dialog entries, the sitemap (0.4g); real requisites
  (SB-4, the coach types them in 0.4d).
- **Secrets.** Never read `apps/*/.env.local`, `packages/api-server/.env` or any `.env*`;
  never print an env value; the shared stack and `prod_snap` are not yours.

## Sacred (charter)

The iOS wire contract · prod data additive-only (this step changes no table, no column
and no row on production; `@ignore` hides two columns from the client and nothing else) ·
athlete navigation stays free · dep-cruiser context rules (CMS contracts import no LMS,
Coaching or Billing contract; `apps/marketing` reaches CMS endpoints only; the platform
never imports CMS contracts for billing) · migrations through `prisma migrate` +
`db-migrate`, expand before contract (D-18).

## Acceptance gates (verify yourself before the PR)

- `pnpm --filter @repo/contracts test`, `pnpm --filter @repo/api-routes test` green;
  `task test:api TDP_DB_PORT=<your port>` green in your throwaway container; the `admin`,
  `platform` vitest projects green (fenced) — they must not even notice the change.
- `pnpm check-types`, `pnpm lint`, `pnpm dep:check`, `pnpm format:check` clean; the admin
  and marketing apps build (fenced, `NODE_OPTIONS=--max-old-space-size=3072`, one at a time).
- `prisma migrate diff --from-migrations … --to-schema-datamodel …` against your container
  reports no drift except the `citext` line (the `@ignore` columns stay in the database).
- Grep gates: `updatePageMetadata|UpdatePageMetadataInput|updatePageMetadataSchema` — no
  hit anywhere; `seoTitle|seoDesc` — hits only in `schema.prisma` and `prisma/migrations/`;
  `PAGE_SLUG_PATH_MAP\[` — every index is a `PublicPageSlug`; `%p` — no hit in
  `packages/contracts/src/**/*.test.ts`; `schema\.parse\(` — no hit in
  `packages/api-routes/src/auth-factories.ts`; every string of `SECTION_DEFAULTS` appears
  nowhere else under `packages/` (the marketing copies go in 0.4f).
- Every new test shown to fail under at least one mutant (name three in the PR body in one
  plain sentence: a scaffold that writes the defaults for every locale, a `site` read that
  skips the locale guard, a `seo` pick that ignores the English fallback).
- The PR contains no file under `initiatives/` and no `CLAUDE.md`.
- PR body per the PR-body law, opened through the `pr` skill, with the checklist AS
  CHECKBOXES. No browser gate (nothing visible changed on the site; the admin shows two new
  rows with empty editors). The checklist carries:
  - [ ] planner: production smoke after the merge — `/api/public/pages/site` and
        `/api/public/pages/offer` answer 200 with `null` sections, the six pages answer with
        `seo: null`, the admin Pages list shows Site and Offer
  - [ ] the offer's requisites and terms are typed by the coach in the admin (0.4d), never
        seeded

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any
  committed file; synthetic fixtures only; no real requisites anywhere.
- No comments in code; delete comments in regions you edit.
- Commitlint: lowercase subject, body lines at most 100 characters, long bodies through
  `git commit -F`; never `--no-verify`; no signatures or attribution lines anywhere; no
  Cyrillic in any command that contains `git commit` or `gh pr`.
- Branch `feat/storefront-billing-cms-content-surfaces` from `main`; one PR against
  `main`; the repository squash-merges, so never stack this branch on another.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence
  after every subagent round; nothing of value sits uncommitted while a subagent may be
  alive. When you have nothing to do but wait for a sub-agent, end your turn with a
  one-line interim report (branch, HEAD, dirty or clean, which sub-agent runs); the planner
  resumes you — that pause is never the end of the run.
- Capped run: at most ONE internal subagent alive at a time; no parallel fan-out; stages
  strictly sequential.
- Resource fence (WSL): every heavy command inside `systemd-run --user --scope -q
--slice=heavy.slice -p MemoryMax=4G -p MemorySwapMax=1G -- <cmd>`, builds with
  `NODE_OPTIONS=--max-old-space-size=3072` in the caller's environment, vitest
  `--maxWorkers=2` where a runner takes it (`task test:api` is already serial and takes no
  flag), turbo `--concurrency=2`, one heavy command at a time.
- Databases: your own throwaway container (D-19, `postgres:17-alpine`, `--memory=512m`, a
  free port, the stack's init directory mounted: `docker run -d --name <name> -p 127.0.0.1:<port>:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tdp -v "$PWD/docker/db/init:/docker-entrypoint-initdb.d:ro" -m 512m postgres:17-alpine`;
  `task stack:migrate TDP_DB_PORT=<port>` then `task test:api TDP_DB_PORT=<port>`; every
  prisma, tsx and test command sets `DATABASE_URL` and `SHADOW_DATABASE_URL` to your
  container explicitly); the shared stack (`tdp`, `tdp_test`, `tdp_shadow`, `prod_snap`)
  and every other container on the host are not yours; remove your container when the PR
  is open.
- End every turn declaring where you left the tree (branch, clean or dirty, last commit)
  and whether your container is up.

## Plan-gate report

Bring, each with your recommendation and never as an option list: the full
`PAGE_SECTIONS_MAP` after the change and the `PublicPageSlug` shape; every new schema in
TypeScript; `SECTION_DEFAULTS` in full (every string, so the planner can veto wording);
the scaffold's defaults rule as code; the two new readers; `marketingRevalidationTarget`
and the revalidate route's parse; the exact list of files SB-49 removes; the SB-51 change
with its test names; the fixture typing fix for `PARTIAL_SECTION_DATA`; the describe
blocks of the new test files; anything in this file the tree contradicts.
