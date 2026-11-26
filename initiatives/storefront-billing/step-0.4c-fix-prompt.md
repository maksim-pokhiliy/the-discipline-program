# Step 0.4c — the round-two fix pass (the Codex fix leg)

**PR:** #476 "feat: add product translations and shared photos", branch `feat/storefront-billing-product-translations`, base `main`, head `f88e236f5` when this file was written, its nine checks green. The independent round-two review (Opus `step-reviewer`, deep, stock, 2026-11-26; lenses ×3, refuters ×4, breaker ×1) pooled 77 candidates, reported 29, sent 16 to the refuters and had 14 confirmed, gave the verdict request-changes, and ruled the buckets; the planner applied them, with ruling 18 below. Round two numbers its findings from RF-1 again: every RF in this file is round two's. This file carries the fix-now set and nothing else. The deferrals are in `initiatives/storefront-billing/deferred.md` (SB-107 for RF-3 and RF-10, SB-109 for RF-2, SB-110 for the blog's half of RF-7, SB-111 for RF-19); the runbook carry-forwards (RF-9, RF-20) are applied on `main`; RF-8 is applied by the planner to the PR body; the drops are in the journal.

**Your duty (the step skill's Phase 5, the executor definition's round-two clause):** apply exactly the set below in ONE pass, run the battery, push to the PR branch, and report. No re-review follows: nobody reviews the fix diff, so every item carries its own regression test, kill or gate as stated. Do not widen: a finding not in this set is not yours, even if you see it. The scope fence, Sacred and rulings 1 to 13 of `initiatives/storefront-billing/step-0.4c-implement-prompt.md` (on your branch) and the rulings of `step-0.4c-implement-continue-prompt.md` (`git show origin/main:initiatives/storefront-billing/step-0.4c-implement-continue-prompt.md`) still hold, amended only by ruling 18. This file reaches `main` through the planner's docs PR; the spawn message names its byte-identical copy for this run.

Editing, formatting and committing files inside the fence is this run's ordinary work: `pnpm exec prettier --write` on the files you changed is expected before every commit. The word "mutant" below always means the mutant campaign (a temporary edit made to prove a test goes red, restored from a content copy); nothing in this file asks you to leave files unedited.

**The migration file is frozen.** `packages/api-server/prisma/migrations/20261125120000_cms_product_translations/migration.sql`, sha256 `2e9fe267c367d5480d154f3f882405f95fd2cab394ebe9cb03974cc50c584b15`: no item and no mutant of this pass touches it, and your report gives that sha256.

**The reviewers' probes** are on disk under `.feature-dev/1795605417/r2/evidence/` (gitignored; the reviewers' code files carry a `.txt` suffix there). Refuter B's specs in `refB/scripts/specs/` are the exact edits it ran, each with its logs in `refB/logs/`: `b1kb.py` (item 1's kill) and `b1m.py` (its mutant); `b3fix.py` (item 2's pin) and `b3conf.py` (its mutant); `b2k.py` (item 3's kill) with `b2ma.py` and `b2mb.py` (its two mutants); `b4fix2.py` (item 7's site 2) and `b4b.py` (its mutant); `b5fix.py` (item 8). The breaker's case for item 5 is `breaker/harness/api/breaker-english.test.ts.txt:211` ("E9"). They are sources to read, written by other agents against `f88e236f5`: nothing is copied into the tree unread, and no file of that directory enters a commit.

## Ruling 18 — RF-7 covers all three featured writes of the product service

Round two kept the products toggle's twin of RF-7 out of the fix "because that code is not in the diff". It is in the diff: `toggleFeatured`'s `unfeatureOthers` in `packages/api-server/src/endpoints/cms/product/admin.ts:156-162` sits on lines this PR added (the factory rewrite, hunk `@@ -106,47 +151,22 @@`), in the file item 5 edits, and R13(a) says no write of any kind reaches a soft-deleted product. So item 5 fixes the three writes: create (`:66-69`), update (`:100-103`) and the toggle (`:159-162`). The shared helper `packages/api-server/src/endpoints/cms/toggle-exclusive-featured.ts` does not change (the callbacks carry the `where`), and the blog's writes in `packages/api-server/src/endpoints/cms/blog/admin.ts` are outside the fence and not yours (SB-110).

## The fix-now set

1. **RF-1 — the only test of the save's "lock, then read" order cannot see it regress.** `packages/api-server/src/endpoints/cms/product/translation-admin.race.test.ts:39-64` ("a save parked behind an English update composes from the committed English") asserts only the read-back at `:60-63`, and `readProductDetails` lines the stored words up with the current English. A save that reads the English before it takes the lock (`translation-admin.ts:23-25` reordered) stores the stale features as live, and the case stays green. Fix, in the test only: after the read-back, read the stored row through `cleanupRaw` (`cleanupRaw.productTranslation.findFirstOrThrow({ where: { productId: product.id } })`) and assert that its `featureList` equals `[SECOND_TRANSLATION, { id: THIRD_FEATURE.id, text: "" }]` and its `isActive` is `false` (`b1kb.py`). Mutant to show red: in `persistTranslation`, the `findOrThrow` read moved above `await lockProduct(tx, productId)` (`b1m.py`).

2. **RF-4 — two cases compare two live clock stamps taken milliseconds apart.** `packages/api-server/src/endpoints/cms/product/product-details.test.ts:188-200` ("reads TRANSLATED again after an unchanged save") and `translation-admin.test.ts:170-182` ("turns ENGLISH_NEWER into TRANSLATED on an unchanged save") make English newer with a live stamp and confirm with a save whose row `updatedAt` is another live stamp. A backward clock step between the two (this host steps back about 1.7 s every 30 s) reads ENGLISH_NEWER after the confirming save: refuter B saw it 5 times in 8 844 iterations, each within 40 ms after a step. Fix, tests only: after the ENGLISH_NEWER expectation and before the confirming save, set the product's `wordsUpdatedAt` to `new Date("2000-01-03T00:00:00.000Z")` through `cleanupRaw.product.update` (`b3fix.py`). That is later than the seeded translation's 2000-01-02 stamp, so the state is still ENGLISH_NEWER, and far earlier than any live stamp. Mutant to show red in both cases after the pin: the save keeps the stored row's `updatedAt` on an update (`b3conf.py`).

3. **RF-5 — the English update's lock-order case asserts only a title.** `translation-admin.race.test.ts:66-83` ("an English update takes the same product lock before reading or writing") asserts the title at `:82`. The update takes the lock at `admin.ts:95` before its read at `:97`, and moving the lock below the read, or below the write, leaves the case green. Fix, in the test only (`b2k.py`): the writer, holding the lock, sets the product's `imageUrl` to a second synthetic Blob URL under `products/`; the update sends a third one with the title; the case asserts that `deleteImage` was called exactly once, with the writer's URL. Mutants to show red: the update's read moved above its lock (`b2ma.py`: `deleteImage` gets the seeded photo), and the lock moved below the write (`b2mb.py`: the lock waiter never appears and the wait times out).

4. **RF-6 — a mapper imports from the endpoints.** `packages/api-server/src/mappers/cms/product.mapper.ts:19` imports `productTranslationState` from `endpoints/cms/product/product-translation` and calls it at `:79`, inside `mapToAdminProductListItem` (`:74-81`, typed by `ProductWithTranslations` at `:65`). It is the only import from a mapper into the endpoints (there is none on `main`), against ADR-0017 ("mappers convert between layers, and business logic lives directly in endpoint files") and against its siblings: `product-details.ts:37` and `pages/admin.ts:102` compute the state in the endpoint. Fix: `getAll` in `packages/api-server/src/endpoints/cms/product/admin.ts:31-49` builds each list item itself, `mapToAdminProduct` for the product plus `translations` with `locale`, `name` and `state: productTranslationState(row, product.wordsUpdatedAt)`. `mapToAdminProductListItem` and `ProductWithTranslations` leave the mapper (`getAll` is their only consumer). No behaviour changes, and the existing list tests stay as they are and stay green. Gate: `grep -rn "endpoints/" /home/maksym/projects/contrib/the-discipline-program/packages/api-server/src/mappers` returns nothing. The commit body says the list's state is now computed in the endpoint, as the product details do (ADR-0017).

5. **RF-7 with ruling 18 — the featured writes reach soft-deleted products.** `packages/api-server/src/endpoints/cms/product/admin.ts:66-69` (create), `:100-103` (update) and `:159-162` (the toggle) unfeature with `tx.product.updateMany({ where: { isFeatured: true … } })` and no `deletedAt: null`. The soft-delete extension does not filter `updateMany`, so a featured save sets a soft-deleted featured product's `isFeatured` to `false` and rewrites its `updatedAt`, against R13(a) and its gate. Fix: `deletedAt: null` in the three `where` clauses, nothing else. Regression tests in `admin.featured.test.ts`, in the shape of the breaker's E9: a soft-deleted product that is featured (its `deletedAt` and `isFeatured` set through `cleanupRaw`) keeps `isFeatured: true` and its `updatedAt` through a featured create of another product, through a featured update of another product, and through toggling another product to featured. That is one case per write, or one `it.each` over the three; the existing cases stay. Mutants to show red: `deletedAt: null` removed from each of the three clauses in turn (three mutants).

6. **RF-11 — the product fieldsets lock without dimming.** `apps/admin/src/modules/products/components/product-form.tsx:61-65` (around `ProductFeaturesCard`) and `apps/admin/src/modules/products/views/product-edit-view/product-translation-form.tsx:76-81` reset the fieldset with `sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}`. They leave out the page editor's `"&:disabled": { opacity: theme.palette.action.disabledOpacity }` (`apps/admin/src/modules/pages/components/section-editor/section-editor-form.tsx:35-41`), so during a save the controls are inert but look live. Fix: `fieldsetStyles` moves, unchanged, from `section-editor-form.tsx` to a new `apps/admin/src/lib/components/localized-editor/fieldset-styles.ts`, exported there. `section-editor-form.tsx` imports it and changes nothing else (R12's sharing grant), and both product fieldsets use `sx={fieldsetStyles}`. No new test (a presentation change the owner's browser pass sees), and no existing test changes.

7. **RF-12 — three spies watch `prisma` while the code runs on `tx`.** Inside a transaction the code calls `tx.product`, which is not `prisma.product`, so these spies record nothing:

   - site 1, `packages/api-server/src/endpoints/cms/product/admin.features.test.ts:45` (`create`, asserted at `:50`);
   - site 2, `translation-admin.test.ts:60` (`reads`, asserted at `:65`);
   - site 3, `translation-admin.test.ts:149` (`writes`, asserted at `:161`).

   Sites 1 and 3 have a real guard beside the spy: the `$transaction` spy and the row count at site 1, the whole-row `toEqual(before)` at site 3. Delete their vacuous spies and the assertions on them. Site 2 is its case's only guard: spy on `prisma.$transaction` instead and expect no call (`b4fix2.py`, with a variable name that says what it watches). Mutant to show red at site 2: the English refusal moved after a read inside the transaction (`b4b.py`).

8. **RF-13 — the public features case can be crowded out of the home list.** `packages/api-server/src/endpoints/cms/product/public.features.test.ts:11-20` looks for its product in the home list, which serves six products in `createdAt` order, oldest first. The case creates its product now, so six older shown products in the test database push it out, and the case goes red at `:17`. Fix, one statement right after the create (`b5fix.py`): `cleanupRaw.product.update({ where: { id: product.id }, data: { createdAt: new Date("1900-01-01T00:00:00.000Z") } })`. `endpoints/cms/pages/public.products.test.ts` dates its own rows the same way. No mutant: refuter B showed the case green with six older rows.

9. **RF-14 — ADR-0013 deletes a retired consequence instead of striking it through.** In `docs/adr/0013-vercel-blob-for-image-storage.md`, this PR deleted the "Collision risk in filenames" consequence, rewrote the "No retry, no timeout, no error mapping" bullet and added a Neutral bullet about upload keys. That goes against `docs/adr/README.md:36` ("do not edit history"), against `:45` ("An accepted ADR is never deleted") and against the ADR's own precedent at `:40`, which keeps a retired consequence struck through ("~~Direct vendor coupling.~~ Closed in commit `6f9ca98` …"). Fix, in that file only:

   - restore the consequence as "**~~Collision risk in filenames.~~** Closed in commit `647373e15`: upload keys combine the configured storage prefix, `crypto.randomUUID()` and the sanitized original filename.";
   - drop the Neutral bullet that says the same;
   - give the retry and timeout bullet the same form: the decision-time "no timeout" struck through, with a note that the timeout landed in commit `9f991a73d` (a 30-second abort signal on uploads, deletions and the health-check request), and the part that is still true, no application-level retry or error mapping, kept as it is.

   The R13(f) edits of `4e09c4fe0` (`:22`, `:24`, `:26`) stay.

10. **RF-15 — an optional prop shaped by tests.** `apps/admin/src/modules/products/views/product-edit-view/product-edit-form.tsx:31` declares `locale?: EditorLocale`, with the default `DEFAULT_EDITOR_LOCALE` at `:36`. The only production caller (`product-edit-content.tsx:27`) always passes it, every other component that takes an `EditorLocale` requires it, and fourteen test call sites omit it (eleven in `product-edit-form.test.tsx`, three in `views/product-photo.test.tsx`). Fix: the prop is required and the default goes. The test call sites pass `ENGLISH_LOCALE` from `@app/test/locale.fixtures` (field for field the same value as `DEFAULT_EDITOR_LOCALE`), or go through one products render helper with that default, as `apps/admin/src/modules/pages/pages.fixtures.tsx:146-149` does. No behaviour changes.

11. **RF-16 — a CMS fixture outside `__fixtures__/`.** `packages/api-server/src/endpoints/cms/product/admin-test.fixtures.ts` is the one CMS fixture outside a `__fixtures__/` folder, and its `OLD_WORDS_AT` (`:20`) duplicates `OLD_WORDS_DATE` at `__fixtures__/translations.ts:20` (both `2000-01-01T00:00:00.000Z`). Fix: `git mv` it to `packages/api-server/src/endpoints/cms/product/__fixtures__/admin-products.ts`. Update its own relative imports and its five importers: `admin.featured.test.ts`, `admin.features.test.ts`, `admin.photo.test.ts`, `admin.words-clock.test.ts` and `public.features.test.ts`. One 2000-01-01 instant remains: `OLD_WORDS_AT` goes, and its users import `OLD_WORDS_DATE` from `./__fixtures__/translations`. No re-export under the old path or the old name. Gate: `admin-test.fixtures` and `OLD_WORDS_AT` have no hit under `packages/`.

12. **RF-17 — two hand-rolled deferred helpers in one module.** `apps/admin/src/modules/products/products.fixtures.ts:66-82` has `makeProductDeferred` (constraint `void | AdminProductDetails`, no `reject`), and `apps/admin/src/modules/products/views/product-photo.test.tsx:66-84` has `deferredUpload`. Fix: `makeProductDeferred`'s constraint widens to `void | AdminProductDetails | { url: string }`, still a closed union and no open `<T>` (manifesto 2.3), and it gains `reject: (error: Error) => void`. `product-photo.test.tsx` uses it in place of `deferredUpload`, which is deleted. Its other user, `product-locale.test.tsx`, stays as it is.

13. **RF-18 — three misleading names in the contracts test.** In `packages/contracts/src/entities/cms/product/product.schema.test.ts`:
    - `:183` gives `PRODUCT_RESPONSE` the id `PRICE_ID`: add a `PRODUCT_ID` constant (a valid cuid distinct from `PRICE_ID`) and use it there.
    - `:274` "leaves absent features and the photo out of an update" uses `toEqual`, which cannot see a key present with `undefined`: use `toStrictEqual`.
    - `:282` "requires a nullable public photo and keeps feature strings" never asserts the features: assert in that case that `productSchema.parse(response).features` equals `[FEATURE.text]`, as the case at `:231` does.

## The battery after the pass (every heavy command inside the fence, one at a time)

Run it as the handoff's Stage 9 ran it, at the final HEAD:

- `pnpm exec vitest run --project contracts --maxWorkers=2`, then `admin`, `ui` and `platform` the same way;
- `task --dir /home/maksym/projects/contrib/the-discipline-program stack:migrate TDP_DB_PORT=4714`, then `task --dir /home/maksym/projects/contrib/the-discipline-program test:api TDP_DB_PORT=4714`, against your container;
- `pnpm exec turbo run check-types --concurrency=1` with `NODE_OPTIONS=--max-old-space-size=2048` in the caller (the default heap aborts the admin type check inside the fence);
- the per-package eslint with `--max-warnings 0` on admin, contracts and api-server, then `pnpm exec turbo run lint --concurrency=1`, with the tree clean after it;
- `pnpm dep:check` and `pnpm format:check`;
- `pnpm --filter admin build` with `NODE_OPTIONS=--max-old-space-size=2048`;
- the pre-push cone: `pnpm exec turbo run lint check-types '--filter=...[origin/main]' --concurrency=1`.

Request every command that reaches your container on `127.0.0.1:4714`, and every `docker` command, with escalation up front, on the ground that it reaches only this machine. The handoff's grep gates still pass: no diff path under `apps/marketing`, `apps/platform`, `packages/ui` or `docs/runbooks`; ruling 7's mocks; the migration's sha256. So do the gates of items 4 and 11.

The mutant campaign runs after every change of the pass is committed:

- the mutants: item 1 (one), item 2 (one, red in both cases), item 3 (two), item 5 (three) and item 7 (one), each shown red under the mutant named there and green after restore;
- every file restored from a content copy verified by sha256, never `git checkout --` or `git restore`;
- content copies under `/home/maksym/projects/contrib/the-discipline-program/.feature-dev/1795605417/fix/`.

A mutant that survives is reported as a survivor with its facts; production code is never bent to kill one. The results go in the report, never in the PR body. Lint budget: `max-lines` 300 (off in test files) and `react/no-multi-comp` are on; decompose instead of suppressing.

## Commits and the push

Conventional commits on the step branch, one per concern:

- `test(cms): …` for items 1, 2, 3, 7 and 8 (one commit, or one per item);
- `refactor(cms): …` for items 4 and 11;
- `fix(cms): …` for item 5 with its tests;
- `fix(admin): …` for item 6;
- `docs(adr): …` for item 9;
- `refactor(admin): …` for items 10 and 12;
- `test(contracts): …` for item 13.

Lowercase subject at most 100 characters, body lines at most 100 characters, long bodies through `git commit -F <file>`, no trailer of any kind. Push the branch to the PR. Never open a second PR, never rebase or squash the existing commits, never force-push, never edit the PR body and never comment on the PR (the planner applied RF-8 to the body and adjusts it after the pass if your fixes change what it says). The run's account goes into your report.

## Standing constraints, resource budget, concurrency

The handoff's sections "Standing constraints", "Resource budget" and "Concurrency" hold word for word, read this way for a fix leg:

- your container is `tdp-0-4c-fix` on `127.0.0.1:4714`, already up and migrated by the planner (read the handoff's `tdp-0-4c-leg` lines with that name), and you remove it (`docker rm -f tdp-0-4c-fix`) after the battery;
- the PR exists, so you open none;
- production is not yours in any form: no read, no write, no dispatch of `db-migrate.yml`, no `gh workflow run`;
- no server is started and no real Blob call is made; no `.env*` file is read and no DSN is printed.

This pass is yours alone: spawn no agent, and run heavy commands strictly one at a time. A command killed by the fence (`Terminated`, exit 137 or 143) is run once more unchanged, then reported with its last lines. A block on one item is not a block on the leg: finish and commit what does not depend on the blocked point first, and name the point in the report.

## Reporting

Your final message is the report the wrapper validates against its schema; its `report` field is the fix-pass report for the planner. It carries:

- the per-item account for RF-1, RF-4, RF-5, RF-6, RF-7 with ruling 18, RF-11, RF-12, RF-13, RF-14, RF-15, RF-16, RF-17 and RF-18: what changed, the files, and the regression test, kill or gate added and what it pins, or why there is none;
- the mutant results, each with its red tests and the restore hash check, and the migration file's sha256 at the end;
- the battery results, with the counts per project and the lint, check-types, dep:check, format and build outcomes;
- the CI state of the PR after the push (`gh pr checks 476`);
- the new user-facing strings (none are expected; list any);
- every deviation (`fence`, `law`, `read-retry`) with its quoted evidence;
- `round_one` null, since a fix leg runs no review round;
- the roster as INLINE entries;
- the tree state where you left it (the step branch, clean, the pushed head), that your container is gone, and that no process of yours is alive.
