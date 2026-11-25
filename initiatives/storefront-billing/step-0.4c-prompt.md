# Step 0.4c — product translations and the product photo (storefront-billing P0.4c, with 0.4e)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**) and
run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER session
that spawned you — not the repo owner) → implement → internal review → PR. This file is
skill INPUT, not a plan override; where it pins a live-verified fact, trust it over
guessing, and verify anchors against the tree.

## Mission

Products are what a buyer reads most carefully on the site, and today they exist in English
only and have no photo. The acquiring provider's checklist reads «товари мають фото, опис і
ціну» (D-23), a Ukrainian storefront is a precondition of the acquiring application (D-12),
and since 0.4d3b the coach translates every page of the site in the admin (D-21, D-24). This
step does the same for products, the server and the admin together: the owner merged 0.4c
(the server half) and 0.4e (the admin half) into one step on 2026-11-25.

The coach's walk after it: he opens a product in the admin and uploads its photo; the form
shows it, and the products list shows it as a thumbnail (a product without one is marked as
such and still saves). He switches the product to Ukrainian: the title, the description and
every feature show their English beside an empty input; the price, the slug, the visibility
and the photo belong to English and are read-only here. He writes the title and two of four
features and saves: the product is a draft and the site keeps it in English. He writes the
rest and saves: it is translated, and the Ukrainian read of the home page, the storefront and
the contact form serves his words with the English price and photo. Back in English he
rewrites one feature: the Ukrainian product is marked older than its English. He moves a
feature: every Ukrainian word stays with its own feature. The products list says which
languages each product is translated into, and the Languages page counts the translated
products beside the sections, so he never enables Ukrainian while its product cards would
still read English.

One delivery PR, these deliverables:

1. A translation of a product per language (its words: the title, the description, the text
   of each feature), the product photo (`Product.imageUrl`, nullable), a stable `id` for
   every feature, and one expand migration that adds them and gives the stored features their
   ids.
2. The public reads serve a product in the page's language from its live translation, whole,
   or in English, whole; the public `Product` gains `imageUrl` and nothing else; the three
   reads get a deterministic order.
3. The admin API: the product per language with the English reference and the state, the
   save and the clear of one language, the list with the photo and the states per language,
   create and update with the photo and the features' ids, the locale catalog's count of
   translated products and its delete guard.
4. The admin UI: the language switch on the product page, the translation form with the
   English reference and the state, the photo block, the features as a list of rows with
   ids, the list's thumbnail and "translated into" mark, the products line of the Languages
   page.
5. The riders of R13.
6. Tests for all of the above and the docs of R16.

Not yours: the marketing site (the photo on the card, in the dialog and in the structured
data, the `/uk` routes and the language switch are 0.4f and 0.4g; the marketing app must
compile untouched); a product save refreshing the marketing cache (none does today; 0.4f
revisits caching per language); the automatic refresh of a stored translation when English
changes (SB-90, for products as for sections); the price history under a subscription
(SB-16, step 3.1) and the two concurrent first prices (SB-25 RF-30); the drop of the old
features column (the next contract migration); the production apply of the migration (the
planner dispatches it by `docs/runbooks/db-migrate-dispatch.md` on the owner's word, before
the merge).

## Read before planning

- `initiatives/storefront-billing/decisions.md` D-12, D-18, D-21, D-22, D-23 and D-24 with
  all their amendments, above all the three of 2026-11-25 (the merged step, the photo,
  products under D-24).
- `initiatives/storefront-billing/deferred.md` rows SB-25 (RF-13 and RF-31), SB-49, SB-90,
  SB-92, SB-101, SB-103, SB-104.
- `initiatives/storefront-billing/design-0.4-admin-product.md` — the UI spec of the admin
  half with its 2026-11-25 rulings; the admin has no designer round (D-22).
- `initiatives/storefront-billing/step-0.4d3a-prompt.md`, `step-0.4d3b-prompt.md` and their
  implement prompts — the rulings the page editor's translation was built on; they hold for
  products unless this file says otherwise.
- `docs/adr/0045-cms-managed-localization.md` (point 6, the delete guard; point 7 names this
  step), `docs/adr/0013-vercel-blob-for-image-storage.md`, `docs/BOUNDED-CONTEXTS.md` §2 and
  §7, `docs/runbooks/db-migrate-dispatch.md` (all of it, the 0.4a and 0.4d3b sections above
  all), `docs/runbooks/local-stack.md` (section "Authoring a migration").
- `packages/api-server/prisma/schema.prisma` (`Product`, `Price`, `MarketingLocale`,
  `MarketingPageSection`); `packages/api-server/prisma/migrations/**` (read only;
  `20261116120000_cms_list_row_ids` with
  `src/endpoints/cms/pages/list-row-ids.migration.test.ts` is the shape of a data migration
  and the test of its SQL); `packages/api-server/prisma/seed/clear-all.ts`.
- `packages/api-server/src/db/client.ts` — the soft-delete extension: which operations it
  filters and which it does not.
- `packages/api-server/src/endpoints/cms/product/**`, `mappers/cms/product.mapper.ts`,
  `endpoints/cms/pages/{public.ts,page-sections.ts,section-translation.ts,admin.ts}`,
  `endpoints/cms/locale/{admin.ts,locale-access.ts,translation-progress.ts}`,
  `endpoints/cms/toggle-exclusive-featured.ts`, `endpoints/cms/blog/admin.ts` (how create and
  update keep one featured post), `endpoints/cms/index.ts`, `endpoints/storage/**`,
  `infrastructure/storage/**`, `src/test/**` — with every test and fixture beside them.
- `packages/contracts/src/entities/cms/product/**`, `cms/pages/pages-api.schema.ts`
  (`productsList`, `SectionTranslationState`), `cms/pages/section-field-kinds.ts`,
  `cms/locale/**`, `entities/storage/upload/**`, `src/common/image.ts`.
- `apps/admin/src/modules/products/**`; `apps/admin/src/modules/pages/**` (the language
  switch and bar, the locale gate, the section state chip, the English reference,
  `section-field-context.ts`, the shared list editor under `components/section-list/`,
  `section-image-field.tsx`, the translation form values and the refresh handling, and their
  tests); `apps/admin/src/modules/languages/**`;
  `apps/admin/src/modules/reviews/components/review-form.tsx` (an upload through
  `ImageUpload`); `apps/admin/src/lib/**` (hooks, API endpoints, `form-card`);
  `apps/admin/src/app/(dashboard)/products/**`;
  `apps/admin/src/app/api/admin/{products,upload,locales}/**`; `apps/admin/src/test/render.tsx`.
- `packages/ui/src/components/{image-upload.tsx,dynamic-list-item.tsx,tags-input.tsx}`.
- Read only, for what the public shape must keep:
  `apps/marketing/src/lib/components/ui/{product-card.tsx,product-modal.tsx,lead-form-modal.tsx}`,
  `apps/marketing/src/lib/hooks/use-product-modal.ts`,
  `apps/marketing/src/lib/seo/structured-data.ts`, `apps/marketing/src/modules/storefront/**`,
  `apps/marketing/src/modules/home/sections/storefront-programs-preview/**`.
- `packages/eslint-config/base.js` (`max-lines` 300), `next.js` (`react/no-multi-comp` with
  `ignoreStateless: false`), `.dependency-cruiser.cjs`.
- `~/.claude/skills/_shared/rules.md` (the manifesto) and `~/.claude/skills/_shared/pr-template.md`.

## Live-verified facts (read from the tree on 2026-11-25 at `15187922a`, and from production the same day)

- `Product` has `slug` (unique), `title`, `description`, `features String[]` (`"features"
TEXT[]` since `0_init`: nullable in the table, no default), `isFeatured`, `isActive`,
  `createdAt`, `updatedAt @updatedAt`, `deletedAt`, and no image column. `updatedAt` moves on
  every product write, the price update and both toggles included.
- The soft-delete extension (`db/client.ts`) adds `deletedAt: null` to `findMany`,
  `findFirst`, `findUnique`, `count`, `aggregate` and `groupBy`, and turns `delete` into an
  update that mangles the slug. It does not filter `update` or `updateMany`, and it does not
  reach relations read through `include`.
- `cmsProductAdminApi.update` updates or creates the active price first and the product
  second: a missing product reaches `price.create` before anything says it is missing
  (SB-25 RF-31: 400 instead of 404), and a soft-deleted product takes both writes. `create`
  and `update` write `isFeatured` without unfeaturing the others, while the toggle does
  (`toggleExclusiveFeatured`) and the blog's create and update do (`ensureExclusiveFeatured`,
  `blog/admin.ts:76,127`): the product form's "Featured Product" checkbox can leave two
  featured products (SB-103).
- `cmsProductPublicApi` (`product/public.ts`) is exported through `endpoints/cms/index.ts`
  and has no consumer but its own `public.empty.test.ts`.
- The public products: `cmsPagesPublicApi.getHomePage` (`take: 6`),
  `getStorefrontProgramsPage` and `getContactPage` (`programOptions`: slug and title) read
  `prisma.product.findMany({ where: { isActive: true } … })` with no `orderBy`. On 2026-11-25
  production served the storefront as adaptive-crossfit, personalized-programming,
  the-discipline-advanced, the-discipline-pro and the home page as the-discipline-pro,
  personalized-programming, adaptive-crossfit, the-discipline-advanced: two orders for one
  catalog (SB-104). Each reader calls `assertPublicLocale` first; the section fallback chain
  is `[locale, "en"]`.
- `productSchema` is both the admin's product and the item of the public pages'
  `productsList` (`pages-api.schema.ts`). `features` is `z.array(z.string())` with no bound on
  the count or the length; create bounds the title at 200 and the description at 5000. The
  marketing site renders `product.features` as strings (`product-card.tsx:87-89`,
  `product-modal.tsx:74-76`), never sorts products, and the home preview takes the first
  three.
- The section translation state is `SectionTranslationState` (`NOT_TRANSLATED`, `DRAFT`,
  `TRANSLATED`, `ENGLISH_NEWER`; `pages-api.schema.ts:218`), derived in `page-sections.ts` by
  comparing the English row's `updatedAt` with the locale row's.
- The Languages page shows `{translatedSectionCount} of {TRANSLATABLE_SECTION_COUNT}
translated` under a progress bar (`languages/components/translation-progress.tsx`; the total
  is a client constant counted from `SECTION_SCHEMAS`), and `cmsLocaleAdminApi.getLocales`
  fills `translatedSectionCount` from the served sections. `deleteLocale` refuses with a
  `ConflictError` whose details are `{ code, translatedSectionCount }`, deletes the empty
  scaffolds, and answers a `P2003` with "received new section rows while it was being
  deleted; try again"; the admin's `delete-refusal.ts` reads `details.translatedSectionCount`
  and says "still has content in N sections".
- Uploads: `UPLOAD_CONFIG` has `avatar` (2 MB), `blog`, `marketing` and `exercise` (5 MB)
  and no product context; `POST /api/admin/upload/image` takes any configured context and
  `DELETE` removes a file by its URL; `ImageUpload` (`@repo/ui`) is the control. The review
  form and the page editor's Personal image delete the old file the moment Remove is clicked
  (SB-92), and a replaced image keeps its old file. `blobImageUrlSchema` (`common/image.ts`)
  accepts only an uploaded Blob URL. The dependency rules let a domain context call storage
  and never the reverse.
- `clear-all.ts` (the seed) deletes the non-default languages before the products.
- The admin is served with Skew Protection: a tab keeps its old bundle across navigations,
  and its saves reach the new server after a deploy (the 0.4d3b lesson, SB-101).
- Production on 2026-11-25: 4 products, none soft-deleted, all active, 1 featured; features
  4, 4, 4 and 0 (no NULL list, no text repeated inside a product, the longest 38
  characters); 4 prices, all active; no subscription and no plan binding; one language
  (`en`); no section row of another language; 16 migrations, the last
  `20261116120000_cms_list_row_ids`.

## Rulings this step is built on (owner and planner, 2026-11-25)

- **R1 — the scope (owner: «ок, склеиваем шаги, хорошая идея»).** The server half and the
  admin half of product translations and the photo are one step and one delivery PR, with
  the riders of R13.
- **R2 — products under D-24.** A product's words are its title, its description and the
  text of each feature. Everything else is shared and edited in English only: the slug, the
  price, the visibility flags, the photo, the features' ids and the structure of the feature
  list (features are added, removed and moved in English only). In another language the
  shared part is read-only and always the current English; a product that is not translated
  opens with its words empty and the English beside each.
- **R3 — every feature has an `id` (owner: «я бы добавил id, но окончательное решение
  делегирую тебе, приму любое»; the planner ruled for ids).** A translated word belongs to a
  feature's `id`, never to its position (the SB-91 lesson). The editor gives a feature its
  `id` when it is added; the server is the one place that guarantees it: an English write
  stores no feature without a non-empty `id`. Propose at the gate how a feature that arrives
  without one, and two that share one, are treated (the planner's lean, as in 0.4d3b: the
  server mints the missing one and refuses a duplicate).
- **R4 — where the English features live, and the deploy window.** The migration is an
  EXPAND applied to production before the merge (D-18, the runbook), so for the minutes
  between the dispatch and the deploy production runs today's code. The design must hold
  four things: (a) the public pages that today's code serves keep working in the window (no
  column it reads changes type or disappears); (b) whatever today's admin writes in the
  window is kept by the new code, or a freeze the runbook section names prevents it (the
  0.4a and 0.4d3b way: the product editor stays closed from the dispatch until the deploy is
  verified) — say which, and why; (c) an admin tab on the old bundle that saves a product
  after the deploy is refused loudly or stored correctly, never stored with its features'
  ids lost (SB-101); (d) the runbook section says what a rollback of the deploy to today's
  code shows and what to run then. No code that serves the old and the new shape side by
  side stays in the tree (the owner's no-bridge rule). The planner's lean: a new column of
  `{ id, text }` rows that the migration fills from `features` with fresh ids in the same
  order (an empty or NULL list gives an empty one); `features` becomes `@ignore` in
  `schema.prisma` and its drop joins the next contract migration (the SB-49 way; the planner
  records the carry-forward); the freeze covers product create and edit.
- **R5 — a translation.** One per product and language, holding the words. It is written by
  the server from the English product at the save (D-24's non-default save): the English
  features' ids and order, with the language's words matched by `id`. It exists only while
  at least one word is written: a save with no word written leaves no translation, and
  "Clear translation" removes it (D-24's `{}` rule in a table's form). It is live only when
  every word whose English is non-empty is written at the save, and a draft otherwise (the
  server decides in the same write, as `isActive` for a section). A word of white space only
  counts as not written. The translated title and description take the English bounds (200
  and 5000). It references the product (a soft delete leaves it in place) and the language
  (`RESTRICT`, as a section row does). The public read serves a live translation as it was
  stored, so a later English change to the features reaches the language when the coach
  saves it again, and the state below is the signal (SB-90 records the automatic
  alternative).
- **R6 — the state.** `NOT_TRANSLATED`, `DRAFT`, `TRANSLATED`, `ENGLISH_NEWER`, with the
  meaning a section's state has (reuse `SectionTranslationState` or give products a twin:
  your call at the gate). `ENGLISH_NEWER` moves only when an English word or the feature list
  changes (a text, a feature added, removed or moved); a price, flag, slug or photo change
  never moves it, so `Product.updatedAt` cannot be its clock. Saving a translated product
  unchanged confirms it.
- **R7 — the public reads.** The three readers take the page's language. In English nothing
  changes but `imageUrl`. In another (enabled) language a product with a live translation in
  it is served with that translation's title, description and features, the rest from the
  product; any other product is served in English, whole (D-21's fallback, per product). One
  query per read, not one per product. The public `Product` gains `imageUrl: string | null`
  and nothing else: `features` stays `string[]`, and the marketing app compiles untouched.
- **R8 — the order (planner ruling; the owner is told and may veto, SB-104).** The three
  public reads order products by `createdAt` ascending, then `id`: today's home order. The
  storefront page changes from an order that moves with every product save to that one. The
  admin list keeps its own order.
- **R9 — the photo (D-23 and its 2026-11-25 amendment).** `Product.imageUrl`, nullable,
  validated by `blobImageUrlSchema`, uploaded through the existing upload route under a new
  `product` context (5 MB, its own storage prefix). It is shared by every language: no
  translation stores an image. The form shows it, replaces it and removes it, and a product
  without a photo saves. The Blob file of a stored photo is deleted only after the save that
  replaces or removes it has committed, never when Remove is clicked (the SB-92 hazard: a
  Remove followed by no save would leave the product pointing at a deleted file). A failed
  delete never fails the save, and a file uploaded and never saved is litter, not damage. No
  crop and no ratio is imposed: the storefront card that decides the ratio is the
  designer's (0.4g); the preview shows the photo whole. Tests mock the storage port; no real
  Blob call anywhere.
- **R10 — the admin API (owner: «Сохранение отдельно на каждый язык - да»).** The product
  read per language carries the words, the English reference beside each, the shared values
  and the state. A translation is saved and cleared one language at a time. The list read
  carries the photo and the state per language. Create and update carry the photo and the
  features with their ids. The admin reads and writes any existing language, disabled ones
  included; an unknown one is a 404; English is not a translation (its words are written by
  the product update).
- **R11 — the language catalog (a side note the owner forwarded on 2026-11-25, ruled in by
  the planner).** (a) The Languages page's count is what the coach enables a language by, so
  it must not read complete while the product cards would still be English. The admin
  language list carries, for each language, how many of the products the site shows (active,
  not deleted) it would serve translated (a live translation, `TRANSLATED` or
  `ENGLISH_NEWER`, the reader's predicate) and how many the site shows. The Languages page
  shows it beside the sections count (the planner's lean: a second line, "N of M products
  translated", because the coach has to see which part is missing). The Pages list does not
  change. (b) A language with a translated product cannot be deleted. The refusal names
  both counts (the `ConflictError` details gain the product count; `delete-refusal.ts` says
  both). A translation the coach cannot see or clear (a soft-deleted product's) never blocks
  the delete; the planner's lean is that the delete removes those rows with the empty
  scaffolds. A translation saved while the delete runs fails it through the `RESTRICT` key,
  and the 409 asks to retry in words that no longer say "section rows" alone.
- **R12 — the admin UI (`design-0.4-admin-product.md` with its 2026-11-25 rulings).**
  - The edit page takes the page editor's language switch (`?locale=`).
  - In English it is today's form, plus the photo block and the features as a list of rows
    with ids.
  - In another language only the words are inputs, each with its English beside it. The
    shared part (price, slug, visibility, photo) is read-only, with the hint the page editor
    gives for a shared field.
  - The product's state in that language shows the way a section's state does. Save writes
    that language only. "Clear translation" works as in the page editor.
  - The create page is English only.
  - The list page gains a photo thumbnail (a placeholder that says there is no photo) and the
    languages the product is translated into, keeping today's columns.
  - Reuse the page editor's pieces: the switch, the state chip, the English reference, the
    word and shared modes of a field, the shared list editor and `DynamicListItem` for the
    features. If a piece moves out of `apps/admin/src/modules/pages` to be shared, the page
    editor's behaviour does not change and its tests pass with import changes only.
  - The tags input leaves the product form once the features are rows. The planner's lean:
    they are rows, edited like a page list section, with add, move and remove in English and
    the English beside each row in another language.
- **R13 — the riders.**
  - (a) SB-25 RF-31: updating a product that does not exist answers 404, and no write of any
    kind reaches a soft-deleted product, the price included.
  - (b) SB-25 RF-13: the price form says in words what is wrong with an empty or invalid
    amount, never zod's "Expected number, received nan".
  - (c) SB-103: product create and update keep at most one featured product, as the blog
    does.
  - (d) SB-104: R8's order.
  - (e) `cmsProductPublicApi` and its test are deleted.
  - (f) ADR-0013 names `Product.image`, a column that never existed: correct it to
    `Product.imageUrl`, and name the `product` context.
- **R14 — the migration.**
  - One new migration under `packages/api-server/prisma/migrations/`, written through the
    shell (the project hook refuses `Edit` and `Write` on that directory).
  - No `BEGIN` or `COMMIT`; the first statement is `SET LOCAL lock_timeout = '5s';` (the
    runbook's rules).
  - Additive: no value of an existing row changes except by the backfill R4 defines, and
    `updatedAt` does not move.
  - It carries a test that runs its SQL against rows built for the cases (the
    `list-row-ids.migration.test.ts` way). The backfill keeps every feature's text and order,
    gives every feature a distinct fresh `id`, turns an empty or NULL list into an empty one,
    and leaves every other column alone.
  - State at the gate what it does to the production numbers above.
  - You apply it to your own container only. Production is the planner's: rehearsed on a
    copy, dispatched on the owner's word.
- **R15 — new user-facing strings.** Labels, hints, the no-photo mark, the states, the
  products line, the refusal text and aria labels are English admin copy you own. List every
  one in your report for the planner's veto, never in the PR body.
- **R16 — docs.**
  - `docs/BOUNDED-CONTEXTS.md` §2: the `Product` marketing facet row, the DB list, and the
    invariants (a product translation's words belong to a feature `id`; the fallback is per
    product; a language with translated products is not deleted; one featured product on
    create, update and toggle). §7 and the glossary's Product line wherever they name the
    fields.
  - `docs/runbooks/db-migrate-dispatch.md`: a "storefront-billing 0.4c" section with what the
    migration does, the freeze, the consistency queries for the window, the old-tab rule and
    the rollback.
  - ADR-0013's line (R13f).
  - No new ADR: ADR-0045 point 7 named this step.

## Scope fence

- **Touch:**
  - `packages/api-server/prisma/schema.prisma`: `Product` (the photo, the features' new
    storage, `@ignore` on the old field if R4's lean lands), the translation model and the
    back-relations it needs on `Product` and `MarketingLocale`; nothing else in it.
  - One new directory under `packages/api-server/prisma/migrations/`, and the test of its
    SQL.
  - `packages/api-server/src/endpoints/cms/product/**` (`public.ts` and
    `public.empty.test.ts` deleted); `endpoints/cms/index.ts` (its product lines);
    `endpoints/cms/pages/public.ts` (the three product reads) with its tests and fixtures;
    `endpoints/cms/locale/**` (the count and the delete) with their tests;
    `endpoints/cms/toggle-exclusive-featured.ts` only if R13c needs it; `mappers/cms/**` (the
    product mapper and its barrel); `endpoints/storage/**` only if R9's cleanup needs it.
  - `packages/api-server/src/test/**` (helpers, fixtures, the census) and
    `packages/api-server/prisma/seed/clear-all.ts` (the new table cleared before the
    languages and the products).
  - `packages/contracts/src/entities/cms/product/**`; `cms/pages/pages-api.schema.ts` and
    `pages-api.types.ts` only where the products list is named; `cms/locale/**` where the
    language list item and the delete refusal are typed;
    `entities/storage/upload/upload.constants.ts` (the `product` context); their tests.
  - `apps/admin/src/modules/products/**`; `apps/admin/src/modules/languages/**` (the products
    line, the refusal text) with their tests; `apps/admin/src/modules/pages/**` only to share
    a piece the product form reuses (R12), behaviour unchanged; `apps/admin/src/lib/**` (the
    product and language hooks and API endpoints, a shared place a moved piece lands in);
    `apps/admin/src/app/api/admin/products/**` and new product route handlers beside them;
    `apps/admin/src/app/(dashboard)/products/**` (the edit page takes the language);
    additions to `apps/admin/src/test/**`.
  - `docs/BOUNDED-CONTEXTS.md`, `docs/runbooks/db-migrate-dispatch.md`,
    `docs/adr/0013-vercel-blob-for-image-storage.md` (R16).
  - A direct consumer of a granted change (an importing test, a barrel, a fixture, a
    generated section, the dashboard's product read if a changed type forces it) may change
    with it, recorded as a `fence` deviation in your report.
- **Do NOT touch:** every existing migration; `apps/marketing/**` (it must compile
  untouched; if a changed type forces an edit there, bring it to the gate),
  `apps/platform/**`, `apps/storybook/**`; every other admin module and route handler;
  `packages/{mui,shared,query,api-client,api-routes,env,auth,errors,email}/**`;
  `packages/ui/**` (reuse `ImageUpload` and `DynamicListItem` as they are; a missing
  primitive goes to the gate); `.github/**`, lockfiles, `initiatives/**`, `CLAUDE.md`,
  `docker-compose.yml`, `taskfile.dist.yml`, any `.env*` file. No new dependency.
- **Not in this step:** the marketing rendering (0.4f, 0.4g); SB-16; SB-25 RF-7, RF-9,
  RF-21, RF-29, RF-30 and the dashboard's rounding; SB-90; SB-92 (the page editor's image
  remove); SB-99, SB-100, SB-102; the drop of the old features column.
- **Secrets.** Never read `apps/*/.env.local`, `packages/api-server/.env*` or any `.env*`;
  never print an env value; the shared stack and `prod_snap` are not yours.

## Sacred (charter)

The iOS wire contract · prod data additive-only (the migration adds a table and columns and
gives the stored features their ids; no other value of an existing row changes; it reaches
production by the planner's dispatch on the owner's word) · athlete navigation stays free ·
dep-cruiser context rules (the admin reaches CMS through `@repo/contracts/cms/*` and its own
route handlers) · migrations through `prisma migrate` + `db-migrate`.

## Acceptance gates (verify yourself before the PR)

- `pnpm exec vitest run --project contracts --maxWorkers=2` and `--project admin` green
  (fenced); `task test:api TDP_DB_PORT=4714` green in your own throwaway container after
  `task stack:migrate TDP_DB_PORT=4714` applied the new migration there; `--project platform`
  and `--project ui` green — they must not notice the change.
- `pnpm check-types` (the marketing app included: it must compile untouched), `pnpm lint`
  (`--max-warnings 0` on the admin), `pnpm dep:check`, `pnpm format:check` clean; the admin
  app builds (fenced, alone).
- Grep gates: no file under `apps/marketing`, `apps/platform` or `packages/ui` in the diff;
  no `cmsProductPublicApi` left; no Blob delete called from `apps/admin/src/modules/products`
  (R9); the old features field neither read nor written by the new code (if R4's lean lands).
- Tests that must exist, each shown red under a mutant (name the mutants in your report,
  never in the PR body):
  - the migration's SQL keeps every stored feature's text and order and gives it a distinct
    `id`, turns an empty and a NULL list into empty ones, and moves no other column and no
    `updatedAt` (mutants: one `id` repeated inside a product; the order lost);
  - each of the three public reads per language: a live translation served whole with the
    English price and photo, a draft served in English, a product without a translation in
    English, a disabled or unknown language a 404 as today, English unchanged but for
    `imageUrl` (mutants: a draft served; one field of a translated product taken from
    English);
  - the three reads in `createdAt` order (mutant: the order removed);
  - a translation save pairs words with features by `id` after an English move and after an
    English removal (mutant: pairing by position), is live only when complete (mutant:
    completeness ignored), leaves no translation when no word is written, is removed by the
    clear, and never writes the shared part from the language's body;
  - `ENGLISH_NEWER` after an English word or feature-list change and not after a price,
    toggle, slug or photo change (mutant: `Product.updatedAt` as the clock);
  - an English write stores no feature without an `id` and refuses a repeated one (mutant:
    the guarantee removed);
  - the photo: a URL that is not an uploaded Blob refused; the old file deleted after a save
    that replaces or removes it and not after a failed save (mutant: the delete before the
    write);
  - the language catalog: the products count per language by the reader's predicate (mutants:
    a draft counted; an inactive product counted); the delete refused while a product the site
    shows is translated, with the count in the details; a soft-deleted product's translation
    not blocking it;
  - the riders: a missing product's update a 404; no write reaching a soft-deleted product,
    the price included; one featured product after create and after update; the amount's
    message;
  - the admin UI: in another language every word shows its English and the shared part is
    read-only; Save writes that language only; the state per state; the list shows the
    thumbnail or the no-photo mark and the translated languages; in English the features add,
    move and remove with ids; the Languages page shows the products line and the refusal
    names the products.
- The PR contains no file under `initiatives/`, no `CLAUDE.md`, no `.feature-dev/`.
- PR body per the PR-body law, opened through the `pr` skill, with the owner's checklist AS
  CHECKBOXES, about these items (where, then what to see; adjust to what you built, add
  nothing about the run; no Cyrillic in the body — name the language "Ukrainian"). It also
  says in one plain sentence that the PR carries a migration that must be applied to
  production before the merge:
  - [ ] Products list: every product shows its photo or a no-photo mark and the languages it
        is translated into; the old columns are still there
  - [ ] A product in English: upload a photo, save; replace it, save; remove it, save: the
        product saves without a photo
  - [ ] Features in English: add one, move one, remove one, edit a text, save; the product
        reads back as saved
  - [ ] The same product in Ukrainian: the title, the description and every feature show
        their English beside an empty input; price, slug, visibility and photo are read-only
  - [ ] Write the title and some features, save: a draft; write the rest, save: translated
  - [ ] Back in English, edit a feature's text and save: in Ukrainian the product is marked
        older than its English; move a feature and save: every Ukrainian word still sits
        beside its own feature
  - [ ] Clear the Ukrainian translation: the product is not translated again
  - [ ] Languages page: Ukrainian counts its translated products beside its sections;
        deleting Ukrainian is refused while a product is translated, and the reason names
        the products
  - [ ] Price form: an empty amount says what is wrong in words; ticking Featured on a
        second product and saving leaves only one featured product
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
  fixture with Cyrillic words lives in a file, never in a command line).
- Branch `feat/storefront-billing-product-translations` from `main`; one PR against `main`;
  the repository squash-merges, so never stack this branch on another.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence after
  every subagent round; nothing of value sits uncommitted while a subagent may be alive.
- Resource fence (WSL): every heavy command inside `systemd-run --user --scope -q
--slice=heavy.slice -p MemoryMax=3G -p MemorySwapMax=1G -- <cmd>`, builds with
  `NODE_OPTIONS=--max-old-space-size=2048` in the caller's environment, vitest
  `--maxWorkers=2` where a runner takes it (`task test:api` is already serial and takes no
  flag), turbo `--concurrency=1`, one heavy command at a time.
- Concurrency: stock (the owner's word for this run); the fence and one heavy command at a
  time still hold.
- Databases: your own throwaway container (D-19): `docker run -d --name tdp-0-4c-leg -p
127.0.0.1:4714:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e
POSTGRES_DB=tdp -v "/home/maksym/projects/contrib/the-discipline-program/docker/db/init:/docker-entrypoint-initdb.d:ro"
-m 512m postgres:17-alpine`, then `task stack:migrate TDP_DB_PORT=4714` and `task test:api
TDP_DB_PORT=4714`; every prisma, tsx and test command sets `DATABASE_URL` and
  `SHADOW_DATABASE_URL` to your container explicitly; the shared stack (`tdp-platform-db` on
  5432: `tdp`, `tdp_test`, `tdp_shadow`, `prod_snap`) and every other container on the host
  are not yours; remove your container (`docker rm -f tdp-0-4c-leg`) when the PR is open.
- No real Blob call: the local admin's Blob token writes to the production store; tests
  mock the upload and delete endpoints and the storage port as the existing ones do.
- Never start `next dev` or any server: the browser pass is the owner's, in his own tab (the
  admin runs on 4712; 4710–4713 are his dev ports).
- End every turn declaring where you left the tree (branch, clean or dirty, last commit) and
  whether your container is up.

## Plan-gate report

Bring, each with your recommendation and never as an option list:

- the data model in Prisma and the migration's SQL in full: where the English features live
  and how they get their ids (R4), the translation table with its keys and the shape of its
  words (R5), the photo column, the clock of `ENGLISH_NEWER` (R6); what the migration does,
  row by row, on the production numbers above, and how its test runs it;
- the deploy window: the freeze (what is frozen, from when to when), what an admin tab on the
  old bundle does after the deploy, the rollback, and the consistency queries for the
  runbook section (R4);
- the contracts: the public `Product` (only `imageUrl` added), the admin product and its read
  per language, the translation write and its validation, the list item, the language list
  item and the refusal details, the upload context;
- the server: the overlay query (one per read), the completeness rule against the English at
  the save, the `id` guarantee for English features, the state, the order, the delete guard
  and its transaction, the photo cleanup (where it runs, after which commit, what a failure
  does);
- the admin: the routes (paths, methods, schemas), the edit page with its language, what is
  reused from the page editor and whether anything moves (with the page editor's tests that
  must stay green), the features list in English and in another language, the photo
  block's states (empty, uploading, error, preview, replace, remove), the list's new columns
  at 1280px and 768px, the products line of the Languages page, every new string in full;
- the riders' changes;
- the test files with their describe blocks and the mutants;
- the docs sentences (BOUNDED-CONTEXTS, the runbook section, ADR-0013);
- whether one PR still holds or the Scope Check asks for a split (the planner takes a split to
  the owner); anything in this file the tree contradicts.
