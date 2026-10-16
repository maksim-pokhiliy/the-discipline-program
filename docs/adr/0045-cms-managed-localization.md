# 0045. Localization is CMS data: a locale catalog and page sections per locale

- **Status:** Accepted
- **Date:** 2026-10-16
- **Deciders:** Owner (direction ratified as storefront-billing D-21; the coach maintains the languages and the translations)
- **Tags:** `cms`, `localization`, `domain-model`, `invariants`

## Context

Monobank's internet-acquiring checklist asks for a Ukrainian version of the site, so a Ukrainian version of every page a buyer touches is a precondition of the coach's acquiring application (storefront-billing D-12). Until now the marketing site has been English only: six pages (`PageSlug`), each a fixed list of sections (`PAGE_SECTIONS_MAP`) whose payloads live in `MarketingPageSection.data`, one row per page and section, written in the admin and read by `apps/marketing` through `GET /api/public/pages/[pageSlug]`. The workspace has no i18n library and no message files.

The owner's direction (2026-10-16) is that localization is part of the CMS: the coach adds a language in the admin and translates every page there himself, without a developer and without a deploy. The repository already keeps every buyer-facing string of those pages in CMS sections, so the question was how to give the existing section model a language dimension, not which translation library to adopt. Production holds the six pages and their sections in English only, so whatever shape is chosen has to arrive as an additive migration in which every existing row becomes the English row.

## Decision

1. **A language is a row of the locale catalog.** `MarketingLocale` (`marketing_locales`) has `code` as its primary key (two or three lowercase ASCII letters, `^[a-z]{2,3}$` in `localeCodeSchema`, which is at once the URL segment, the `html lang` value and the `Intl` tag), `name`, `isEnabled` and `sortOrder`. The coach creates, renames, reorders, enables, disables and deletes locales through `cmsLocaleAdminApi`; the public site lists the enabled ones through `cmsLocalePublicApi.getEnabledLocales`.
2. **Every page section exists once per locale.** `MarketingPageSection.locale` references `MarketingLocale.code` (`ON DELETE RESTRICT`), defaults to `'en'`, and a section row is unique on `(pageSlug, section, locale)`. The admin read `getPageBySlug(slug, locale)` scaffolds the locale's rows with `{}` as it always did for English, and `updateSection` writes the row of the requested locale only; both default to English when the caller omits the locale.
3. **English is the default locale, by constant and by row.** `DEFAULT_LOCALE_CODE = "en"` in `@repo/contracts/cms/locale` is the source of truth; the migration `20261016120000_cms_locales` inserts the `en` row and the admin calls re-create it lazily (`ensureDefaultLocale`). The default locale cannot be disabled or deleted. The public read of the default locale never looks the row up: English is served from the constant, and the row exists for the foreign key and the catalog.
4. **The fallback rule is per section.** For the default locale a section reads as before. For another locale a section reads from its own row when that row is active, parses through its section schema and is non-empty; otherwise from the English row under the same three conditions; otherwise it is `null`. One query fetches the active rows of both locales and the pick happens per section key. A locale that does not exist or is disabled answers `NotFoundError` before any page query; the admin reads and writes any existing locale, disabled ones included.
5. **English keeps the unprefixed URLs; every other locale lives under `/{code}`.** `marketingPagePath(slug, locale)` in `@repo/contracts/cms/pages` is the one path builder for both apps (`/about` for English, `/uk/about` for Ukrainian, `/uk` for the Ukrainian home page); the admin revalidation uses it today, the marketing links from step 0.4f on.
6. **A locale with translated content cannot be deleted.** Deleting a non-default locale is refused with a `ConflictError` naming the count while any of its section rows carries content (`data` is not the empty object the scaffold writes); otherwise its empty scaffold rows and the locale go together in one transaction. The `RESTRICT` foreign key stays the backstop: a row that gains content between the count and the delete makes the transaction fail, and that failure is answered with the same `ConflictError`.
7. **The same model carries the rest of the buyer-facing copy, in later steps.** Page SEO texts as a `seo` section per page, navigation, footer, lead-form and error-page strings in a `site` pseudo-page, and the offer page as an `offer` CMS page arrive in step 0.4b; product title, description and features get a translation row per locale in step 0.4c. They are named here as the next steps of this decision and are not built by it.

Request types whose schema carries defaults (`UpdatePageSectionBody`, `UpdatePageSectionData`) are declared as `z.input`, so clients may omit the defaulted fields, while response types stay `z.infer`.

## Consequences

- **Positive:** every string a buyer reads is CMS data or the result of an `Intl` formatter, so the coach owns the translations end to end. A new language is a row, not a deploy. A half-translated page is a normal state the fallback keeps readable, and the unprefixed English URLs keep every existing link and its search ranking. The default-locale read issues the same queries as before, with one more predicate.
- **Negative:** a disabled locale answers the same 404 as an unknown one, so a hidden language can be edited in the admin but not looked at on the public site. Regional variants (`pt-BR`) are out of scope; the code is a language, not a region. The fonts of the marketing site must cover the scripts of every enabled locale (Cyrillic for Ukrainian), which step 0.4f has to settle. An English edit revalidates only the English path, while the `/{code}` pages that fall back to it would stay stale once they are cached; every marketing page renders dynamically today, so this has no effect yet, and step 0.4f must revisit it. No index leads with `locale` (the unique key and the read index both start with `pageSlug`), so the foreign-key check on a locale delete and the delete's content count scan `marketing_page_sections`; at 21 rows per locale this is accepted.
- **Neutral:** the migration drops the old `(pageSlug, section)` unique key, so admin code older than this change cannot save a section; the pages editor is frozen while the migration is dispatched ahead of the merge (`docs/runbooks/db-migrate-dispatch.md`). `DEFAULT_LOCALE = "en-US"` in `@repo/shared` is the `Intl` tag of the price formatters, not a CMS locale code, and stays. The pages test fixture captures, clears and restores the three marketing tables, and its clear re-creates the default locale, so a cleared database looks like a freshly migrated one.

## Alternatives considered

- **Code message files with an i18n library** (`next-intl`, `i18next`, `lingui`). The standard answer for a Next.js site, with mature tooling for plurals and formats. Rejected: the coach cannot edit message files, every new language or wording would be a deploy, and the CMS already holds the copy the files would duplicate.
- **Locale-suffixed section keys in the existing table** (`home:hero@uk`). It needs no new column or table. Rejected: the key catalog (`PAGE_SECTIONS_MAP`, `SECTION_SCHEMAS`, the discriminated union of the section body) would multiply per language or need parsing everywhere, a language would become a code change, and there would be no catalog to enable, disable or order languages.
- **Separate page slugs per language** (`about-uk`). It reuses the page model as it is. Rejected: the slug is the page's identity across languages; a slug per language would split one page into several unrelated pages, multiply `PageSlug`, and leave the fallback with nothing to fall back along.

## References

- `initiatives/storefront-billing/decisions.md` — D-12 (the acquiring precondition), D-21 (this decision as ratified), D-22 (the 0.4 steps that build on it).
- `packages/contracts/src/entities/cms/locale/` and `cms/pages/marketing-page-path.ts`; `packages/api-server/src/endpoints/cms/locale/`, `endpoints/cms/pages/{admin,public}.ts`; `packages/api-server/prisma/migrations/20261016120000_cms_locales/migration.sql`.
- `docs/BOUNDED-CONTEXTS.md` §2 (the CMS context with the locale catalog and its invariants).
- ADR-0005 (contracts first with Zod), ADR-0010 (the marketing pages read the CMS over HTTP loopback), ADR-0042 (migrations through `prisma migrate`).
