# Step 0.4d1 — the admin forms of the new sections: `seo` on every page, the four `site` sections, the `offer` page (storefront-billing P0.4d1)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**) and
run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER session
that spawned you — not the repo owner) → implement → internal review (STOP at review-flow's
triage gate with the report; the ruling arrives as a follow-up message) → PR. This file is
skill INPUT, not a plan override; where it pins a live-verified fact, trust it over
guessing, and verify anchors against the tree.

## Mission

Step 0.4b put three new kinds of content into the CMS model: a `seo` section on every
public page, a `site` pseudo-page whose four sections hold the strings every page shares
(navigation, footer, lead form, error pages) and an `offer` page (hero, requisites,
terms). The server reads and writes them, the admin's Pages list shows Site and Offer,
and the editor receives their rows — but renders nothing for them: the section editor's
`renderForm` switch has no case for the fourteen new section keys and returns `null`, so
the accordion is hidden. The coach cannot fill the offer, cannot touch a page's search
title, cannot see the site strings.

This step gives every section of every page a form, in English, on the editor as it is
today. 0.4d is split in three (D-22 amended 2026-11-02): this step is the forms; 0.4d2 is
the Languages page; 0.4d3 is the locale switch, the English reference and the section
states inside the editor. Nothing here knows about locales: the editor keeps editing the
default locale as it does now.

One delivery PR, these deliverables:

1. The forms: `SeoSectionForm` (two fields with length hints), one descriptor-driven flat
   form for the four `site` sections, the `offer` hero on the existing title + subtitle
   form, `OfferRequisitesSectionForm` and `OfferTermsSectionForm` as list editors with
   add, move and remove.
2. The registry: an exhaustive map from every section key to its form, replacing the
   `switch` with a `null` default, so a section without a form is a type error, not a
   hidden accordion.
3. The typed write at the admin call sites (SB-61): the client endpoint, the hook and the
   editor carry the discriminated body, never a bare `data` that lost its section.
4. The page labels: the Pages list and the edit header name the pages properly (FAQ,
   Public Offer, Site) instead of `capitalize(slug) + " Page"`.
5. `DynamicListItem` gains move controls; every list editor in the pages module uses them.
6. Tests for all of the above; `docs/BOUNDED-CONTEXTS.md` §2 updated in one sentence.

Not yours: the Languages page and its navigation entry (0.4d2); the locale switch, the
`?locale=` parameter, the English reference, the translated / stale marks, the progress
counts, "clear translation" (0.4d3); any file under `packages/api-server`, `apps/marketing`,
`apps/platform`; the route handlers under `apps/admin/src/app/api`; the section schemas
and `SECTION_DEFAULTS` (the contract is fixed; the forms present it); product translations
and the photo (0.4c, 0.4e); real requisites (SB-4, the coach types them once this ships).

## Read before planning

- `initiatives/storefront-billing/design-0.4-admin-pages-editor.md` — task 4 (the new
  section forms) and the Rails; the rest of the document is 0.4d3's.
- `docs/adr/0046-chrome-and-seo-as-cms-sections.md` and `docs/BOUNDED-CONTEXTS.md` §2
  (Invariants → "Section payload must match its Zod schema as a partial document",
  "Section defaults apply only when missing default-locale rows are scaffolded",
  "Every public CMS page has SEO; site chrome has no page URL"; Where it lives today →
  Consumer apps).
- `packages/contracts/src/entities/cms/pages/pages.schema.ts` lines 150–225 (the eleven
  new schemas), `pages.constants.ts` (`PAGE_SECTIONS_MAP`), `pages-api.schema.ts` lines
  116–260 (`SECTION_SCHEMAS`, `sectionVariant`, `updatePageSectionBodySchema`,
  `adminPageDetailsSchema`), `pages-api.types.ts`, `pages.types.ts`,
  `section-defaults.ts` (read, never copied).
- `apps/admin/src/modules/pages/**` — every file; the three list editors
  (`faq-section-form.tsx`, `journey-section-form.tsx`, `credentials-section-form.tsx`) and
  `why-choose-section-form.tsx` with `why-choose-feature-card.tsx` are the list pattern;
  `title-subtitle-section-form.tsx` is the hero pattern; `hero-section-form.tsx` shows a
  per-key prop (`sectionType`); `section-editor/index.tsx` is what you replace.
- `apps/admin/src/lib/api/endpoints/pages.ts`, `apps/admin/src/lib/hooks/use-pages.ts`,
  `apps/admin/src/lib/api/keys.ts` (the `pages` keys), `apps/admin/src/lib/components/form-card/`.
- `packages/ui/src/components/dynamic-list-item.tsx` and its test.
- The admin test pattern: `apps/admin/src/test/{setup.ts,render.tsx,mocks.ts}` and
  `apps/admin/src/modules/products/views/product-edit-view/product-edit-form.test.tsx`
  (mocks of `@app/lib/hooks`, `render` from `@app/test/render`, dynamic import after the
  mocks); the root `vitest.config.ts` (project `admin`: jsdom, the `@app` alias).
- `packages/eslint-config/base.js` (`max-lines` 300) and `next.js`
  (`react/no-multi-comp` with `ignoreStateless: false`).
- `~/.claude/skills/_shared/rules.md` (the manifesto) and `~/.claude/skills/_shared/pr-template.md`.

## Live-verified facts (read from the tree on 2026-11-02 at `d4cda738f`)

- `SECTION_SCHEMAS` has thirty-five keys (home 6, storefront 4, about 6, blog 4,
  contact 3, faq 4, offer 4, site 4); `SECTION_LABELS` in
  `section-editor/index.tsx` already names all thirty-five. `renderForm` covers
  twenty-one; the seven `*:seo`, `offer:hero`, `offer:requisites`, `offer:terms` and the
  four `site:*` keys fall to `default: return null`, and `if (!formContent) return null`
  hides the accordion.
- `SectionEditor` props: `section: AdminPageDetails["sections"][number]`,
  `onSave: (data: UpdatePageSectionData["data"]) => void`; it builds
  `useForm<SectionFormData>` with `zodResolver(SECTION_SCHEMAS[key].deepPartial())`.
  `pages-edit-form.tsx` recombines `section.section` and the form data into
  `updateSection({ slug, data: { section, data } })`; the endpoint
  (`endpoints/pages.ts:13`) and the hook (`use-pages.ts:29`) type that payload as
  `Omit<UpdatePageSectionData, "pageSlug">`, a union whose `data` collapses across
  sections — the SB-61 admin half.
- The contracts already carry the correlated shape: `updatePageSectionBodySchema` is
  `z.discriminatedUnion("section", SECTION_VARIANTS)` where each variant is
  `{ section: z.literal(key), data: SECTION_SCHEMAS[key].deepPartial(), locale: default "en" }`;
  `UpdatePageSectionBody = z.input<typeof updatePageSectionBodySchema>`;
  `adminPageDetailsSchema.sections` is a discriminated union per key with
  `data: variant.shape.data` and `updatedAt`; `SectionSchemaKey = keyof typeof SECTION_SCHEMAS`.
- The eleven new schemas: `seoSectionSchema { title, description }`;
  `offerPageHeroSchema = titleSubtitleSchema`;
  `offerRequisitesSchema { title, items: { label, value }[] }`;
  `offerTermsSchema { title, blocks: { heading, body }[] }`;
  `siteNavigationSchema` (seven labels keyed by public page slug plus `navigationLabel`,
  `openMenuLabel`, `closeMenuLabel`, `languageSwitchLabel`); `siteFooterSchema`
  (`tagline`, `subcopy`, `rightsLabel`); `siteLeadFormSchema` (twelve strings);
  `siteErrorsSchema` (six strings). Every field is `z.string()` with no bounds.
- `SECTION_DEFAULTS` holds the eleven English payloads of the `seo` and `site` sections;
  the offer's hero, requisites and terms have no defaults. The 0.4b gate "every
  multi-word string of `SECTION_DEFAULTS` appears nowhere else under `packages/` except
  `section-defaults.ts`, `packages/ui/src/components/error-pages/`, `contact.schema.ts`"
  stands, and extends to `apps/admin`: the forms show stored values and never embed a
  default.
- `DynamicListItem` props: `children`, `onRemove`, `disableRemove`, `removeAriaLabel`;
  it has a test file in `packages/ui`. The three list editors and the why-choose card
  destructure `{ fields, append, remove }` from `useFieldArray`; none uses `move`.
- The Pages list (`sections/pages-list-section/index.tsx`) renders
  `${capitalize(page.slug)} Page` and ignores `page.title`; the edit header renders
  `capitalize(page.slug)`. On production `marketing_pages.title` is `capitalize(slug)`
  ("Faq"), so the title column is no better; the production catalog on 2026-11-02 holds
  six page rows (about, blog, contact, faq, home, storefront) and twenty-one section rows
  — no `site`, no `offer`, no `seo` row yet; `getPageBySlug` scaffolds them with the
  English defaults the first time the admin opens the page (ADR-0046 §4). That first open
  is expected after this ships.
- The section PATCH route (`apps/admin/src/app/api/admin/pages/[slug]/sections/route.ts`)
  parses the body through the discriminated variant and revalidates
  `marketingRevalidationTarget(slug, body.locale)`; it needs no change.
- The admin vitest project runs under jsdom with `src/test/setup.ts` and the `@app`
  alias; it has seven test files today. The admin `lint` script runs
  `eslint . --fix --max-warnings 0`; `max-lines` is 300 (blank lines and comments
  skipped); `react/no-multi-comp` forbids a second component per file, including a
  JSX-returning module-scope function.

## Rulings this step is built on (planner 2026-11-02; the owner accepted the contour the same day)

- **R1 — an exhaustive registry, no hidden section.** `SECTION_FORMS` maps every
  `SectionSchemaKey` to its form element (`satisfies Record<SectionSchemaKey, ReactElement>`,
  elements, not module-scope components, so `react/no-multi-comp` stays quiet) and
  replaces `renderForm`; `SectionEditor` never returns `null` for a key of
  `SECTION_SCHEMAS`. Move `SECTION_LABELS` and the registry into
  `apps/admin/src/modules/pages/config/` so every file stays under the 300-line cap.
  Rationale: the `null` default is exactly what kept fourteen sections invisible; with
  the registry the next new section is a compile error.
- **R2 — the `site` forms are descriptor-driven.** One component
  `FlatFieldsSectionForm` (`cardTitle`, `groups: readonly { heading?, fields }[]`, each
  field `{ name, label, multiline? }`) renders `TextField`s through `register(name)`.
  The descriptors of the four `site` sections live in
  `apps/admin/src/modules/pages/config/site-section-fields.ts`, each typed against its
  schema (`satisfies` a record over `keyof z.infer<typeof siteXSchema>`) so a schema
  field without a descriptor, or a descriptor without a field, fails `check-types`.
  Groups: navigation → "Links" (the seven page labels) and "Controls" (the four control
  labels); footer → one group; lead form → "Form" (title, product prefix, the three field
  labels, submit, sending) and "Messages" (success title and message, send another, error,
  contact required); error pages → "Not found" and "Error". Labels are English admin copy
  you own: say what the string is used for ("Programs link", "Open menu control",
  "Success message", "Retry button"), never the default's text. Rationale: thirty-two plain
  strings in four near-identical files is the duplication the project forbids; a
  descriptor keeps the schema parity checkable by the compiler.
- **R3 — SEO form.** `SeoSectionForm`: `title` single-line, `description` multiline;
  helper text shows the live length against a recommended ceiling, "n / 60" and
  "n / 160", soft — the schema has no maximum and the form adds no validation. Card title
  "Search engine listing". Rationale: the contract is the contract; the ceiling is
  editorial guidance the coach can exceed knowingly.
- **R4 — offer hero** reuses `TitleSubtitleSectionForm` with `cardTitle="Offer Hero"`.
- **R5 — requisites and terms are list editors with reorder.**
  `OfferRequisitesSectionForm` (section title; rows of `label` + `value`; "Add requisite")
  and `OfferTermsSectionForm` (section title; blocks of `heading` + multiline `body`;
  "Add terms block") follow the FAQ pattern with `useFieldArray` and use `move` for
  reorder. `DynamicListItem` gains optional `onMoveUp` / `onMoveDown` with
  `disableMoveUp` / `disableMoveDown`; the move buttons render only when both handlers
  are given, with aria labels "Move up" / "Move down". The existing list editors (FAQ,
  journey, credentials, the why-choose cards) wire `move` the same way, so every list in
  the editor reorders alike. Rationale: the design asks for reorder on the offer lists;
  a control present on one list and absent on the next is the inconsistency the coach
  meets first, and wiring it is three lines per form.
- **R6 — the typed write (SB-61, admin half).** `createPagesAPI.updateSection(slug, body: UpdatePageSectionBody)`
  and the hook's `mutationFn` take `UpdatePageSectionBody`; `Omit<UpdatePageSectionData, "pageSlug">`
  goes. `SectionEditor` is generic over the key — `section: Extract<AdminPageDetails["sections"][number], { section: TKey }>`,
  `onSave: (body: Extract<UpdatePageSectionBody, { section: TKey }>) => void` — and
  builds `{ section: section.section, data }` itself, so the correlation never crosses a
  bare `data`; `pages-edit-form.tsx` passes the body through. If a named alias helps
  (`SectionWriteBody<TKey>`), add it to `pages-api.types.ts` as a type-only export; no
  runtime schema changes. A type test proves a mismatched pair (`section: "home:seo"`
  with `data: { items: [] }`) is rejected (`// @ts-expect-error` lines in a test file the
  type check compiles). Rationale: the contracts half landed in 0.4b; the admin is the
  only place the collapse still lives.
- **R7 — page labels.** `PAGE_LABELS: Record<PageSlug, string>` in
  `apps/admin/src/modules/pages/config/page-labels.ts`: Home, Storefront, About, Blog,
  Contact, FAQ, Public Offer, Site (shared strings). The list's "Page Name" cell and the
  edit header subtitle use it; the " Page" suffix goes; `capitalize(page.slug)` leaves
  the pages module. Rationale: "Site Page" and "Faq" mislabel what the coach opens.
- **R8 — English only.** No locale control, no `?locale=`, no `locale` in the request
  body (the schema defaults it to `en`); the editor edits the default locale as today.
- **R9 — docs.** `docs/BOUNDED-CONTEXTS.md` §2, Consumer apps: the sentence "the new
  section forms arrive in 0.4d" becomes the fact (the forms are in the admin; the locale
  controls arrive in 0.4d3). No ADR: ADR-0046 already names the forms as the next step.
- **R10 — new user-facing strings** (card titles, group headings, field labels, button
  labels, helper texts, aria labels, page labels) are English admin copy; list every one
  in your report so the planner can veto wording after the fact. Never in the PR body.

## Scope fence

- **Touch:** `apps/admin/src/modules/pages/**`; `apps/admin/src/lib/api/endpoints/pages.ts`;
  `apps/admin/src/lib/hooks/use-pages.ts`; new test files under `apps/admin/src/modules/pages/`;
  `packages/ui/src/components/dynamic-list-item.tsx` and `dynamic-list-item.test.tsx`;
  `packages/contracts/src/entities/cms/pages/pages-api.types.ts` (type-only additions);
  `docs/BOUNDED-CONTEXTS.md` (the one sentence of R9).
- **Do NOT touch:** every other file under `apps/admin/src/{app,lib,modules}` (the route
  handlers, the navigation config, every other module), `apps/marketing/**`,
  `apps/platform/**`, `packages/api-server/**`, `packages/contracts/**` beyond the one
  types file (no schema, constant or default changes), `packages/{mui,shared,query,api-client,api-routes,env,auth}/**`,
  `packages/ui/**` beyond the one component and its test, `prisma/**`, `.github/**`,
  lockfiles, `initiatives/**`, `CLAUDE.md`, `docker-compose.yml`, `taskfile.dist.yml`,
  any `.env*` file. No new dependency.
- **Not in this step:** the Languages page (0.4d2); the locale switch, the reference, the
  section states, "clear translation", the progress counts (0.4d3); product translations
  and the photo (0.4c, 0.4e); the marketing site reading `site` and `seo` (0.4f) and the
  public offer page (0.4g); real requisites (SB-4).
- **Secrets.** Never read `apps/*/.env.local`, `packages/api-server/.env` or any `.env*`;
  never print an env value; the shared stack and `prod_snap` are not yours.

## Sacred (charter)

The iOS wire contract · prod data additive-only (this step changes no table, no column
and no row on production; the English defaults it lets the coach see are written by the
existing scaffold on first open, as 0.4b designed) · athlete navigation stays free ·
dep-cruiser context rules (the admin reaches CMS through `@repo/contracts/cms/*` and its
own route handlers; `@repo/ui` imports no contracts) · migrations through `prisma migrate`

- `db-migrate` (none here).

## Acceptance gates (verify yourself before the PR)

- `pnpm exec vitest run --project admin --maxWorkers=2` and `--project ui` green
  (fenced); `--project contracts` and `--project platform` green — they must not notice
  the change. No api-server run: this step touches no server code and needs no database.
- `pnpm check-types`, `pnpm lint` (`--max-warnings 0` on the admin), `pnpm dep:check`,
  `pnpm format:check` clean; the admin app builds (fenced, alone).
- Grep gates: `return null` — no hit in `section-editor/index.tsx`;
  `Omit<UpdatePageSectionData` — no hit under `apps/admin`; `capitalize(page.slug)` — no
  hit under `apps/admin/src/modules/pages`; every multi-word string of `SECTION_DEFAULTS`
  — no hit under `apps/admin`; `renderForm` — no hit under `apps/admin`.
- Tests that must exist and be shown red under a mutant each (name the mutants in your
  report, never in the PR body): the registry covers every `SectionSchemaKey` at runtime
  (`Object.keys(SECTION_FORMS)` equals `Object.keys(SECTION_SCHEMAS)` as sets) and
  `SectionEditor` renders at least one input for every key given a `{}` row (mutant: a key
  removed from the registry); `OfferRequisitesSectionForm` add / move / remove and the
  body `onSave` receives, `{ section: "offer:requisites", data: { title, items } }`
  (mutant: `move` wired backwards); the same for `OfferTermsSectionForm`; `SeoSectionForm`
  counters follow the typed lengths; for each of the four `site` sections the rendered
  field count equals the schema's key count (mutant: a descriptor dropped — also a type
  error); the SB-61 type test; `DynamicListItem` renders no move buttons without the
  handlers and disabled ones at the ends.
- The PR contains no file under `initiatives/`, no `CLAUDE.md`, no `.feature-dev/`.
- PR body per the PR-body law, opened through the `pr` skill, with the owner's checklist
  AS CHECKBOXES, about these items (where, then what to see; adjust to what you built,
  add nothing about the run):
  - [ ] Pages list: Home, Storefront, About, Blog, Contact, FAQ, Public Offer, Site
        (shared strings) — no "Page" suffix, no "Faq"
  - [ ] Site (shared strings): four accordions with English values pre-filled; change
        the footer tagline, Update Section, reload — the change persists
  - [ ] Public Offer → Offer Requisites: starts empty; add two rows, move the second up,
        remove one, save, reload — the order persists
  - [ ] Public Offer → Offer Terms: add a block with a heading and a multi-paragraph
        body, save, reload
  - [ ] Home → Home SEO: default title and description with "n / 60" and "n / 160"
        counters; typing past the hint shows no error; save works
  - [ ] Home → Home Hero saves as before; FAQ → FAQ Content items reorder with the new
        arrows and the order persists
  - [ ] The marketing site is unchanged (the chrome still reads its code strings until 0.4f)

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any
  committed file; synthetic fixtures only; no real requisites anywhere.
- No comments in code; delete comments in regions you edit.
- Commitlint: lowercase subject, body lines at most 100 characters, long bodies through
  `git commit -F`; never `--no-verify`; no signatures or attribution lines anywhere; no
  Cyrillic in any command that contains `git commit` or `gh pr`.
- Branch `feat/storefront-billing-admin-section-forms` from `main`; one PR against
  `main`; the repository squash-merges, so never stack this branch on another.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence
  after every subagent round; nothing of value sits uncommitted while a subagent may be
  alive. When you have nothing to do but wait for a sub-agent, end your turn with a
  one-line interim report (branch, HEAD, dirty or clean, which sub-agent runs); the planner
  resumes you — that pause is never the end of the run.
- Capped run: at most ONE internal subagent alive at a time; no parallel fan-out; stages
  strictly sequential.
- Resource fence (WSL): every heavy command inside `systemd-run --user --scope -q
--slice=heavy.slice -p MemoryMax=3G -p MemorySwapMax=1G -- <cmd>`, builds with
  `NODE_OPTIONS=--max-old-space-size=2048` in the caller's environment, vitest
  `--maxWorkers=2`, turbo `--concurrency=1`, one heavy command at a time.
- No database and no dev server: this step runs no api-server suite and starts no
  container; never start `next dev` (port 3002 belongs to another project on this host;
  the browser pass is the owner's, in his own tab).
- End every turn declaring where you left the tree (branch, clean or dirty, last commit).

## Plan-gate report

Bring, each with your recommendation and never as an option list: the registry's type and
the file layout of `apps/admin/src/modules/pages/config/`; the `FieldDescriptor` and
group types and the four `site` descriptor tables in full (every label and group heading,
so the planner can veto wording); the `SeoSectionForm` helper texts; the `DynamicListItem`
prop additions with the updated test names; the generic signature of `SectionEditor` and
the final types of `updateSection` and `useUpdatePageSection`; `PAGE_LABELS` in full; the
test files with their describe blocks; the one-sentence change to `docs/BOUNDED-CONTEXTS.md`;
anything in this file the tree contradicts.
