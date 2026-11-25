/feature from-plan 1795605417 Implement step 0.4c of storefront-billing (product translations and the product photo, with 0.4e) from the ratified artifacts to the delivery PR, under the rulings below.

You are the IMPLEMENTER of step 0.4c. The planner's Opus executor researched, designed and planned this step, and the plan was ratified at the plan gate on 2026-11-25 (the rulings below; no revision round). Nothing is implemented yet: the tree is on `main`, clean, and the ratified artifacts are on disk. Your run is `/feature from-plan`: Stage 4 pre-flight, the implementation of the plan's sixteen tasks, round one of the step's two review rounds, the tests, the documents and the PR.

## Where things are

- Branch `main` at `3fd4a4a4d` or later (the planner's docs commit with this file lands on `main` before you start), checked out and clean; base branch `main`. You create `feat/storefront-billing-product-translations` from it at Stage 4 pre-flight; one PR against `main`.
- `.feature-dev/1795605417/`: `research.md`, `design.md` and `plan.md` (sixteen tasks under "Task Order", the Definition of Done, the Test Strategy with every mutant, the Scope Check), and `design-scratch/` with `migration.sql`, `consistency-queries.sql`, `rollback-recovery.sql`, `inverse-ddl.sql`, `seed-synthetic.sql`, the probes and the `trial-*.txt` outputs. In `design.md`: the data model and the SQL §5.2, the API §5.3, the components §5.4, the docs sentences §8.7, the fence §8.8, the gate questions §8.9. They are the ratified artifacts; where a ruling below and an artifact disagree, the ruling wins.
- The step prompt: `initiatives/storefront-billing/step-0.4c-prompt.md`. Read it in full: its rulings R1–R16, "Live-verified facts", the Sacred line and the acceptance gates are the request's detail; the lines this file supersedes are listed under "Superseded lines".
- The initiative: `initiatives/storefront-billing/` (`state.md`, `decisions.md` D-18, D-21, D-22, D-23 and D-24 with their amendments, `deferred.md` rows SB-25, SB-49, SB-90, SB-92, SB-99, SB-101, SB-103, SB-104, `design-0.4-admin-product.md`). Read-only for you: nothing under `initiatives/` enters a commit.
- Your database container `tdp-0-4c-leg` is already up on `127.0.0.1:4714` (postgres:17-alpine, 512 MB): the executor created it, and its `tdp` and `tdp_test` hold `main`'s sixteen migrations, the last `20261116120000_cms_list_row_ids`; `tdp_shadow` is the shadow database. It is yours from now on: do not recreate it; remove it when the PR is open.

## The step's request (the step prompt's opening, verbatim)

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

## Plan-gate rulings (owner and planner, 2026-11-25)

The owner gave the run's shape at the contour: «формат /step delegated stock => /feature full», one step for the server and the admin («ок, склеиваем шаги, хорошая идея»), a save per language («Сохранение отдельно на каждый язык - да»), the small deferred items ride along («Попутно мелочи из отложенного - делаем»), and feature ids left to the planner («я бы добавил id, но окончательное решение делегирую тебе, приму любое»; ruled for ids). The gate carried no item that is his: the plan keeps one PR, as he ratified. The rulings below are the planner's. Where a ruling and an artifact disagree, the ruling wins; the artifacts were not regenerated.

1. **One PR, as R1 rules (gate item D-2).** The Scope Check's LARGE FEATURE warning (16 tasks, 174 paths, 78 of them plan task T3's mechanical move) does not reopen the scope. T3 lands as its own commit, moves done with `git mv`, so the PR shows renames. Rationale: the owner merged the two halves so that the dispatch and the browser pass happen once; a split would ship a table nobody writes.
2. **The translation state is shared under a neutral name, in the locale contracts (gate item D-1, granted with a different home).** `SectionTranslationState` moves to the new `packages/contracts/src/entities/cms/locale/translation-state.ts` as `TranslationState`, with the same four members and the same string values (no wire change), and is exported by the locale barrel. Every file that names the enum today (fifteen: the pages contracts, four files under `packages/api-server/src/endpoints/cms/pages/`, nine under `apps/admin/src/modules/pages/`) and every new product file imports `TranslationState` from `@repo/contracts/cms/locale` (`../locale` inside the contracts package). There is no alias, no re-export under the old name, and the pages barrel stops exporting it (the owner's no-bridge rule). The admin chip moves to `apps/admin/src/lib/components/localized-editor/` as `TranslationStateChip` in `translation-state-chip.tsx`, renamed at its consumers. Design D4 and fence item 1 of design §8.8 are superseded by this ruling. The field-kind types (`SectionFieldKind`, `SectionFieldKindTree`) and the other moved editor pieces keep their names. Rationale: the state now describes a product's translation as much as a section's. `cms/locale` is a leaf that the product translation schemas import anyway (`localeCodeSchema`), so the move adds no dependency edge and no cycle; `cms/pages/translation-state.ts` would make the product contract depend on the pages folder, and a `Section…` name in product code would mislead its reader.
3. **The deploy window (design §5.2, R4) stands as written:** the freeze of product create and edit from the dispatch until the deploy is verified, with the toggles and the soft delete left free; the old-tab behaviour (a save carrying `features: string[]` refused with 400, `features: []` stored correctly, the photo kept when `imageUrl` is absent); the rollback and its recovery statement; the pre-dispatch check and the four consistency queries. The planner adds one rule to the runbook: query 1 is read twice inside the freeze, before the merge and once the deploy is live, and the freeze is lifted only after the second reading is empty.
4. **No file under `docs/runbooks/` enters this PR.** The runbook section ("storefront-billing 0.4c") is the planner's: he writes it from design §8.7 and the consistency queries, with ruling 3's rule, after rehearsing the migration on a copy of production, in his own docs commit before the dispatch. Plan task T16 changes `docs/BOUNDED-CONTEXTS.md` and `docs/adr/0013-vercel-blob-for-image-storage.md` only. Rationale: the dispatch happens before the merge, so its runbook must be on `main` first, and the 0.4d3b runbook section came the same way (that step's ruling 4).
5. **The migration is the probed file, byte for byte.** `packages/api-server/prisma/migrations/20261125120000_cms_product_translations/migration.sql` is a copy of `.feature-dev/1795605417/design-scratch/migration.sql` (sha256 `2e9fe267c367d5480d154f3f882405f95fd2cab394ebe9cb03974cc50c584b15`; the planner hashed it at the gate), made through the shell (`mkdir -p` and `cp` with absolute paths), with the sha256 of the copy checked against that value. After the copy the file is never edited; a defect found in it by any stage is a design-change escalation in your report, never a fix.
6. **The migration's test stands as designed** (`packages/api-server/src/endpoints/cms/product/product-translations.migration.test.ts`): the file read by its path, split on its `-- ` header lines, exactly nine statements asserted in order, each case in one interactive transaction (30 s) that drops the expand's objects (the inverse DDL), seeds synthetic rows with fixed timestamps, runs the nine statements with `$executeRawUnsafe`, observes, and rolls back through a sentinel throw; the census stays flat. The six cases and the mutants M1–M6 of the Test Strategy.
7. **No test reaches the real Blob store.** The product admin API takes `deleteImage` by injection; every api-server test passes a `vi.fn()`. The real `storageUploadAdminApi` is composed only in `apps/admin/src/lib/server/cms-product-admin-api.ts`. Every test file under `apps/admin/src` that imports that module, or a products route handler that imports it, mocks `@repo/api-server/storage` or the composition module itself. Rationale (measured by the planner): `apps/admin/.env.local` defines `BLOB_READ_WRITE_TOKEN`, which writes to the production store, and the adapter reads the token when `@repo/api-server/storage` is imported (`vercel-blob-adapter.ts:10`). A missing mock fails at import today, and nothing may depend on that staying true.
8. **The Languages page (gate item Q-2): one bar over sections and products, `(s + p) / (N + m)`, with two captions,** "{s} of {N} sections translated" and "{p} of {m} products translated". Rationale: the bar is what the coach reads first, so a bar over sections alone could read complete while the product cards are English, which is the failure R11 exists to prevent; the captions say which part is missing.
9. **The gate's other questions, as the design recommends.**
   - Q-3: feature text and count stay unbounded, as today.
   - Q-4: a soft-deleted product keeps its photo file.
   - Q-5: ADR-0013 keeps its decision-time `@vercel/blob` version line.
   - Q-6: the drop of `app_products.features` and the orphan file of a photo uploaded and never saved are the planner's carry-forwards in `deferred.md`, not this PR's.
   - Q-7: RF-13 covers the period length too.
   - Q-8: a live translation always needs its title and description.
   - Q-9: the toasts "Translation saved" and "Translation cleared".
   - Q-10: the list's Languages column shows every translation with its state chip, drafts included.
   - Q-11: the per-language Save sits beside Clear in the form's body, the English Save stays in the header.
   - Q-12: the translation save is a PATCH answering 204, then a refetch.
   - Q-13: the delete guard blocks on any translation of a product that is not deleted, drafts and hidden products included.
   - The inherited SB-99 behaviour of the refresh mechanism is an accepted residual.
10. **The order (R8) stands:** `createdAt` ascending, then `id`, on the three public reads. The owner was told on 2026-11-25 and may veto it before the merge; a veto is a fix pass, not a change of design.
11. **The strings: the list of the gate report stands** (design §5.4 and the report's section 9), with "Spotlight" as the read-only label of the featured flag. The `TranslationState` rename changes no string.
12. **Fence deviations granted in advance** (record each in your report's `deviations` all the same):
    - the files of ruling 2;
    - `packages/api-server/src/endpoints/cms/pages/__fixtures__/marketing-pages-state.ts` with its test, and `__fixtures__/disabled-locale-refusal.ts` (they delete languages, and the new `RESTRICT` key makes them clear product translations first);
    - the moves out of `apps/admin/src/modules/pages/**` with the four thin wrappers and the import and rename changes there (R12);
    - `apps/admin/src/modules/pages/locale.fixtures.ts` moved to `apps/admin/src/test/locale.fixtures.ts`;
    - `apps/admin/src/lib/config/locale-url.ts` with the split of `modules/pages/config/locale-url.test.ts`;
    - `apps/admin/src/lib/server/cms-product-admin-api.ts`;
    - `packages/api-server/src/endpoints/storage/upload.test.ts` (the product row and the missing exercise row; the storage sources stay untouched);
    - `modules/languages/languages.fixtures.ts` and `locale-api.schema.test.ts` (the counts);
    - `prisma/seed/clear-all.ts`;
    - any barrel that a new export of the plan needs.
13. **The design stands for everything else**, as written.

## Facts established since the step prompt was written (the planner's own measurements, 2026-11-25 at `3fd4a4a4d`)

- **Production, read-only.**
  - Postgres `server_version_num` 170012; `gen_random_uuid()` answers.
  - `app_products.features` is `ARRAY`, nullable, no default.
  - 4 products, none deleted, all active, 1 featured; features 4, 4, 4, 0 in `createdAt` order.
  - No NULL list, no NULL entry, no blank entry; feature texts 16 to 38 characters.
  - `featureList`, `imageUrl` and `wordsUpdatedAt` absent; `app_product_translations` absent.
  - 16 migrations, the last `20261116120000_cms_list_row_ids`; one language, `en`, enabled.
- **The executor's re-run.** It applied the probed migration to its own rows (lists of 4, 4, 4 and 0 features, a repeated text, a NULL list) inside a rolled-back transaction:
  - texts kept in order, ids distinct and uuid-shaped;
  - `updatedAt` unchanged, `wordsUpdatedAt` equal to it;
  - `imageUrl` NULL, `features` untouched;
  - the locale key `RESTRICT`, the product key `CASCADE`.
- **Precedents in the tree:**
  - `SET LOCAL lock_timeout` and a guard `DO` block: `20261116120000_cms_list_row_ids`;
  - `@ignore`: `seoTitle`, `seoDesc` in `schema.prisma`;
  - the SQL replay through `$executeRawUnsafe` in `cleanupRaw.$transaction`: `list-row-ids.migration.test.ts`;
  - the per-key advisory lock: `pg_advisory_xact_lock(hashtext(…))` in `endpoints/cms/pages/page-sections.ts:109`, with `endpoints/cms/locale/__fixtures__/lock-race.ts`.
- **The soft-delete extension** (`db/client.ts`) filters `findMany`, `findFirst`, `findFirstOrThrow`, `count`, `aggregate`, `groupBy`, `findUnique` and `findUniqueOrThrow`; relation filters inside a `where` are not filtered, so the products count filters `deletedAt: null` explicitly.
- **Signatures and modules:**
  - `CaptureContext` takes `level` and `tags` (`infrastructure/monitoring/port.ts`).
  - `storageUploadAdminApi.deleteImage(url)` throws `BadRequestError` on an empty URL (`endpoints/storage/upload.ts:39`).
  - `createPatchByParamHandler` is `packages/api-routes/src/route-helpers.ts:152`; `withAuthRateLimit` is `rate-limit/with-rate-limit.ts:66`; `withAdminAuth` is `@app/lib/server/auth`.
  - `IMAGE_MUTATION_KEY` is `apps/admin/src/lib/hooks/use-upload.ts:12`.
  - `new-list-row.ts` mints `crypto.randomUUID()`.
  - `SectionListEditor` hides the row controls outside English through `useIsEditingEnglish`.
- **Marketing caching.** Every marketing page renders dynamically today: the server client fetches with `cache: "no-store"` and reads `cookies()` (ADR-0045 line 29). That is why no product save revalidates; the planner carries the 0.4f consequence for the deleted old photo.
- This run is stock: the owner's word, no parallel session of his on the host.

## Superseded lines (this file wins)

- The step prompt's "STOP at the plan gate" and "End every turn" lines: nothing resumes a Codex leg. The gate is answered (this file); the flow's triage is the ruling, applied at once in one fix pass; you stay in your turn on `wait_agent` until every helper has reported, and your final message ends the run.
- R6's "reuse `SectionTranslationState` or give products a twin": reused, moved and renamed `TranslationState` (ruling 2).
- R12's "its tests pass with import changes only": with import and rename changes only (ruling 2).
- R16's runbook item and the fence's grant of `docs/runbooks/db-migrate-dispatch.md`: refused (ruling 4).
- The fence's "`cms/pages/pages-api.schema.ts` and `pages-api.types.ts` only where the products list is named": also the enum's removal (ruling 2).
- The standing constraint "tests mock the upload and delete endpoints and the storage port as the existing ones do": the product service's `deleteImage` is injected and faked one level above the port (ruling 7); the storage tests keep faking `StoragePort`.
- `design.md` D4 and §8.8 item 1 (`cms/pages/translation-state.ts`, `SectionStateChip`): ruling 2. §8.7's runbook text and plan T16's runbook part: ruling 4. The gate report's "After the deploy, a row means a product edited by the new code": ruling 3 (the planner's runbook).

## How this run proceeds

A block on one task is not a block on the leg: what does not depend on the blocked point is finished and committed first, and the report names the point.

Every command that reaches your container on `127.0.0.1:4714` (prisma, `task stack:migrate`, `task test:api`, the migration test, `psql`, `docker rm`) is requested with escalation up front, on the stated ground that it reaches only this machine: the default sandbox refuses every socket, loopback included (`EPERM`), and a refusal there reads like a missing stack, not like the code.

### Stage 4 — pre-flight and implementation

- Create `feat/storefront-billing-product-translations` from `main`; take the lock as the skill says; write `tasks.md` from `plan.md` (sixteen tasks under "Task Order"), with rulings 2, 4, 5, 7 and 8 folded into the tasks they touch.
- Take the api-server baseline at `main` against your container (it already holds `main`'s sixteen migrations) before the first change.
- Implement in the plan's order with `pipeline_worker` implement agents as the skill says. T3 is its own commit with `git mv` (ruling 1); then one checkpoint commit per task, each with a typed lowercase subject; type-check, lint and the affected tests before every commit; the tree committed before every spawn; file presence re-verified after every agent round.
- The `@ignore` proof of the Definition of Done runs in your container: a scratch database migrated with the new migration, `ALTER TABLE app_products DROP COLUMN features`, the readers' tests green against it, the scratch database dropped.
- No UI visual check by you: the browser pass is the owner's.

### Stage 5–6 — review-flow at deep, round one of two

- Run the flow as the skill says: fresh lenses, refuters and breaker as `pipeline_worker` agents, the sweep, the synthesis into `.feature-dev/1795605417/review.md`, the triage, then exactly one fix pass. Caller context for the flow: this file (the request and the rulings), `research.md`, `design.md`, and the battery commands below.
- The triage is the ruling: apply exactly the fix-now set in one pass (a typed checkpoint subject naming the change), run type-check, lint and the affected tests before the commit, and never re-review the fix diff. A finding whose fix would add a mechanism, cross the fence, change a contract or change the migration file is never fix-now: it is a carry-forward or a deferral in the report, or a design-change escalation that ends the run `blocked` with the facts.

### Stage 7–8 — Test and Docs

- Test agent: the regression tests of the fix-now set and the acceptance criteria not yet covered (`plan.md` Test Strategy; the tasks already write the planned tests, so fill gaps and do not duplicate).
- Docs agent: plan task T16 lands with the tasks; this agent checks `docs/BOUNDED-CONTEXTS.md` and ADR-0013 against the final code and corrects drift only. No runbook (ruling 4).
- Checkpoint commits, `test:` then `docs:` (a stage with nothing to change commits nothing).

### Stage 9 — finalize

- **The battery, at the FINAL HEAD, inside the fence, one heavy command at a time:**
  - `pnpm exec vitest run --project contracts --maxWorkers=2`, then `--project admin`, `--project ui` and `--project platform` (the last two must not notice the change);
  - `task stack:migrate TDP_DB_PORT=4714`, then `task test:api TDP_DB_PORT=4714` (serial, against your container, `SHADOW_DATABASE_URL` pointing at its `tdp_shadow`);
  - `pnpm check-types`, `pnpm lint`, `pnpm dep:check`, `pnpm format:check` (turbo tasks with `--concurrency=1`; the non-mutating per-package eslint before `pnpm lint`, then `git status` clean);
  - the admin build with `NODE_OPTIONS=--max-old-space-size=2048`.
- The grep gates of the acceptance gates (below) and of the plan's Definition of Done.
- **The mutants of the Test Strategy** (C1–C5, M1–M6, S1–S23 with S4b and S5b, A1–A9):
  - every change is committed before the campaign starts;
  - every mutant is applied to a file whose content copy was taken first, and the run is recorded;
  - the file is restored from the copy and verified by sha256 (never `git checkout --` / `git restore`);
  - the migration file is restored like any other, and its sha256 after the campaign is the value of ruling 5;
  - the results go in the report.
- Push the branch and open the PR through the `pr` skill (pipeline mode: head and base fixed, no branch question). Body per `~/.claude/skills/_shared/pr-template.md`, inside its budget, with:
  - the owner's checklist AS CHECKBOXES (below);
  - the one sentence saying the migration must be applied to production before the merge;
  - nothing about the run: no mutants, no counts, no finding IDs;
  - no Cyrillic (the language is "Ukrainian").
- Remove your container when the PR is open. Report, with the tree state.

## Scope fence (from the step prompt, verbatim, with the grants of rulings 2 and 12 and the refusal of ruling 4)

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
  - `docs/BOUNDED-CONTEXTS.md`, `docs/adr/0013-vercel-blob-for-image-storage.md` (R16; the
    runbook is refused by ruling 4).
  - The grants of rulings 2 and 12.
  - A direct consumer of a granted change (an importing test, a barrel, a fixture, a
    generated section, the dashboard's product read if a changed type forces it) may change
    with it, recorded as a `fence` deviation in your report.
- **Do NOT touch:** every existing migration; `docs/runbooks/**` (ruling 4); `apps/marketing/**` (it must compile
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

## Acceptance gates (the step prompt's, with the grep gates of rulings 2, 4, 5 and 7; verify yourself before the PR)

- `pnpm exec vitest run --project contracts --maxWorkers=2` and `--project admin` green
  (fenced); `task test:api TDP_DB_PORT=4714` green in your own throwaway container after
  `task stack:migrate TDP_DB_PORT=4714` applied the new migration there; `--project platform`
  and `--project ui` green — they must not notice the change.
- `pnpm check-types` (the marketing app included: it must compile untouched), `pnpm lint`
  (`--max-warnings 0` on the admin), `pnpm dep:check`, `pnpm format:check` clean; the admin
  app builds (fenced, alone).
- Grep gates:
  - no file under `apps/marketing`, `apps/platform`, `packages/ui` or `docs/runbooks` in the diff;
  - no `cmsProductPublicApi` left;
  - no `SectionTranslationState` and no `SectionStateChip` left anywhere in `apps/` or `packages/` (ruling 2);
  - no Blob delete called from `apps/admin/src/modules/products` (R9);
  - every test file under `apps/admin/src` that imports `cms-product-admin-api` or a products route handler mocks `@repo/api-server/storage` or the composition module (ruling 7);
  - the old features field neither read nor written by the new code (`@ignore` in `schema.prisma`; no raw SQL names `"features"` outside the migration and its test);
  - the migration file's sha256 equals ruling 5's value.
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

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any committed file; synthetic fixtures only.
- No comments in code; delete comments in regions you edit. A directive a tool reads (a vitest environment docblock, an eslint directive) and the `-- ` header lines of a migration file are not comments. No AI attribution, signature or trailer anywhere: not in commits, not in the PR, not in code (the owner's rule overrides any harness reminder).
- Commitlint: lowercase conventional subject at most 100 characters, body lines at most 100 characters, long bodies through `git commit -F <file>`; never `--no-verify`; no Cyrillic in any command that contains `git commit` or `gh pr`, nor in a PR body. A test fixture with Ukrainian words lives in a file, never on a command line.
- The pre-commit hook runs check-secrets and lint-staged (eslint and prettier); the pre-push hook runs dep:check, lint and check-types over the cone, as `pnpm exec turbo` tasks. A red hook is root-cause work; run the hook's task set fenced at `--concurrency=1` first so the hook replays from cache. Touching `packages/contracts` pulls every dependent package into the cone: expect a long pre-push, and warm the cache serially before pushing.
- One PR against `main`; the repository squash-merges; never stack this branch on another. Never merge; the merge is the owner's.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence after every subagent round; nothing of value sits uncommitted while a subagent may be alive. Await every command you start; leave no background process behind.
- Databases: your container `tdp-0-4c-leg` on `127.0.0.1:4714` (D-19; already up, see "Where things are"): `task --dir /home/maksym/projects/contrib/the-discipline-program stack:migrate TDP_DB_PORT=4714` and `task --dir /home/maksym/projects/contrib/the-discipline-program test:api TDP_DB_PORT=4714`; every prisma, tsx and test command sets `DATABASE_URL` and `SHADOW_DATABASE_URL` to your container explicitly (`postgres://postgres:postgres@localhost:4714/tdp_test`, `…/tdp_shadow`). The shared stack `tdp-platform-db` (5432: `tdp`, `tdp_test`, `tdp_shadow`, `prod_snap`) and every other container on the host are not yours. Remove your container (`docker rm -f tdp-0-4c-leg`) when the PR is open.
- The migration runs in your container only. Production is not yours in any form: no production read, no production write, no dispatch of `db-migrate.yml`, no `gh workflow run`.
- The project hook PROD-GUARD refuses `Edit` / `Write` on `prisma/migrations/`, lock files and `.github/workflows/`. This step creates exactly one new directory under `prisma/migrations/`, through the shell (ruling 5); no existing migration, no lock file and no workflow changes.
- Never start `next dev` or any server: the browser pass is the owner's, in his own tab (the admin runs on 4712; 4710–4713 are his dev ports). Never call the real Vercel Blob: every upload and delete in a test is mocked (ruling 7).
- Never read `apps/*/.env.local`, `packages/api-server/.env`, `packages/api-server/.env.test` or any `.env*`; never print an env value or a DSN. Never connect to a remote database.
- Temporary files: the repository's tests use the system's default temporary directory (no `TMPDIR` override). A script you type yourself (a harness, a mutation backup, a content copy) writes under `/home/maksym/projects/contrib/the-discipline-program/.feature-dev/1795605417/tmp/`.
- A command that ends `Terminated`, or with exit 137 or 143, was killed by the memory fence: run it once more unchanged; if it is killed again, finish what does not depend on it and report `blocked` with the command, how long it ran and its last lines. The fence does not move.
- `pkill -f <pattern>` matches the shell that runs it: kill by pid.
- Command form: never `cd` inside a compound command; absolute paths in every command that names files or globs; the repository is `/home/maksym/projects/contrib/the-discipline-program`.
- `initiatives/**`, `CLAUDE.md` and `.feature-dev/**` never enter a commit.
- No polling: never `sleep`-loop or `pgrep`-loop on a helper; wait on `wait_agent`.

## Resource budget (the step skill's, verbatim)

- **Hard fence:** every heavy command (`next build`, full vitest runs, the route suite, `test:coverage`) runs inside a cgroup ceiling, in the shared slice: `systemd-run --user --scope -q --slice=heavy.slice -p MemoryMax=3G -p MemorySwapMax=1G -- <cmd>`. A breach kills that command (retriable red), never the VM.
- **Shared ceiling:** `heavy.slice` is ONE slice for the fenced commands of every session on the host (`MemoryMax=10G` on this host); never drop `--slice=heavy.slice`.
- **Diet inside the fence:** `NODE_OPTIONS=--max-old-space-size=2048` on build commands, set in the CALLER's environment, which a `--scope` unit inherits (never `-p Environment=...`); vitest capped at `--maxWorkers=2` on the command line where a runner takes it (`task test:api` is serial and takes no flag); turbo fan-out capped at `--concurrency=1` for multi-package tasks (two Next apps in parallel OOM under the 3G fence); throwaway DB containers at `--memory=512m`.
- **Sequencing:** heavy steps run strictly one at a time: never a build concurrently with a test run, never two agents driving heavy commands at once.

## Concurrency

Stock (the owner's word for this run): the skill's own fan-out applies; the resource fence and one heavy command at a time still hold, whoever drives it.

## Reporting

Your final message is the report the wrapper validates against its schema. Its `report` field is the executor's PR-open report, for the planner and never for the PR body. It carries:

- **The work.** Every task of the plan with its checkpoint commit, and where each of rulings 1, 2, 4, 5, 7 and 8 landed.
- **The roster.** The complete stage-agent roster: implement, review-flow lenses, refuters and breaker, fix pass, test, docs. Give `agent_type` and count for each, or INLINE where you ran a stage yourself.
- **Round one.**
  - the candidate count before any cap, beside the reported count;
  - the refuted count;
  - every finding with its bucket and rationale, as the triage applied it.
- **The mutant campaign.**
  - every mutant with its red tests;
  - every restore, hash-verified;
  - the migration file's final sha256.
- **The verification evidence.** Every number measured at the FINAL HEAD, with the api-server baseline at `main` beside it; the `@ignore` proof.
- **Strings.** Every new user-facing string, in full.
- **Deviations.** Every one (`fence`, `law`, `read-retry`) with its root cause.
- **Escalations.** Any design-change escalation.
- **Blocked points.** Any.
- **The state you leave.** The branch, the HEAD, clean or dirty; that your container is gone; that no command of yours is still running.
