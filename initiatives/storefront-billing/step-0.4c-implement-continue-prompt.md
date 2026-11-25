/feature from-plan 1795605417 Continue step 0.4c of storefront-billing (product translations and the product photo, with 0.4e) from the committed work at `fe9473325` to the delivery PR, under `step-0.4c-implement-prompt.md` and the four rulings below.

## Why there is a second leg

The first implement leg (Codex thread `01a2132e-7cd5-7df1-bb29-e714b5021987`) committed plan tasks T1 to T8, wrote T9, and stopped `blocked` before verifying T9. The automatic approval review missed its deadline twice on the same command, at 16:47:57Z and 16:50:02Z. That command was a fenced `vitest run` of the api-server's product and page tests against the leg's container. Neither attempt started a process, and the review gave no reason, so this was a timeout, not a refusal. The leg rightly committed nothing unverified and launched nothing after it.

Its full admin project was also red twice at T8, on one page test the leg had not touched. The planner measured both points and rules them below as rulings 14 and 15. Ruling 16 corrects one grep gate of the plan, and ruling 17 removes the cause that ruling 15 found. Everything else in the handoff stands.

## Where things are

- **The handoff:** `initiatives/storefront-billing/step-0.4c-implement-prompt.md`, on the step branch since it was cut. Read it in full. It is the authority for this run, amended only by this file. It holds:

  - the request and rulings 1 to 13;
  - the facts and the superseded lines;
  - the stages and the fence;
  - Sacred, the acceptance gates and the owner's checklist;
  - the standing constraints, the resource budget, the concurrency line and the reporting rule.

  This file lives on `main` only. Read it with `git show origin/main:initiatives/storefront-billing/step-0.4c-implement-continue-prompt.md`.

- **The artifacts** are in `.feature-dev/1795605417/`:
  - `research.md`, `design.md`, `plan.md` (ratified) and `design-scratch/`;
  - the first leg's run files: `tasks.md` (T1 to T8 `COMPLETED` with their checkpoints, T9 `BLOCKED`, T10 to T16 `PENDING`), `blocked-report.md`, `final-report.json` and `implementation.md`;
  - `implement-policy.md`, the brief its workers got;
  - `task-1-report.md` to `task-9-report.md` with their logs;
  - `perf-baseline.md`, `baseline-api.log`, `deviations.json`, `new-strings.json` and `guard-denials.json`.
- **The branch:** `feat/storefront-billing-product-translations` at `fe9473325`, eight commits on `main` `7c1c1818b`, not pushed. It exists, so do not create it again. Its commits are `cc470c4f5` T1, `af4d6232a` T2, `3ae28a16c` T3 (the `git mv` move of ruling 1), `718aba7da` T4, `29d6384c5` T5, `56e5aa486` T6, `3339c5a28` T7 and `fe9473325` T8.
- **T9 is uncommitted and unformatted.** It is the plan's seven paths and nothing else, each listed with its sha256 as the planner left it:
  - added `packages/api-server/src/endpoints/cms/product/served-products.ts` `937b2aee4f30d6398386347c97375bea8ead65967c7c09618b69b6a7afa9e999`;
  - added `packages/api-server/src/endpoints/cms/pages/public.products.test.ts` `433e0f1ed3d5ea2cc1c71333bb641581321c646dcb6b2f3c7d12b3eee449ac33`;
  - changed `packages/api-server/src/endpoints/cms/pages/public.ts` `bdb729475c0f0cc4753145a269ec00b36986b6794b71eaebcf0b3aa9374a7894`;
  - changed `packages/api-server/src/endpoints/cms/index.ts` `a84564bdb4074a209523e8a99087855882f7e24e2a7d62e5a6faa899835ea13f`;
  - changed `packages/api-server/src/endpoints/cms/product/public.features.test.ts` `1af5c366cb96d38aece61a8e4d70a593f4fb78ae1995db59671dff7b9c122fd0`;
  - deleted `packages/api-server/src/endpoints/cms/product/public.ts` and `packages/api-server/src/endpoints/cms/product/public.empty.test.ts`.
- **The container:** `tdp-0-4c-leg` is up on `127.0.0.1:4714` (postgres:17-alpine, 512 MB). Its `tdp` and `tdp_test` hold seventeen migrations, the last `20261125120000_cms_product_translations`; the planner read `_prisma_migrations` in both. It is yours: do not recreate it, and remove it when the PR is open.
- **The api-server baseline at `main`** is already measured and is not re-run: the first leg's 213 files and 2798 tests, green, in `baseline-api.log`.
- **The migration file** at `fe9473325` has ruling 5's sha256; the planner hashed it.

## Ruling 14: T9 is verified; format, check and commit it

The planner ran the blocked command, otherwise unchanged, against the tree as the first leg left it (2026-11-25):

- at `fe9473325` with the seven paths, against the container's `tdp_test` and `tdp_shadow`, inside the fence;
- 35 files and 500 tests, green, in 30.9 s.

The seven paths are the plan's T9 file list, and no `cmsProductPublicApi` is left in `apps/` or `packages/`.

What this run does with it:

- Format the seven paths. Then run the api-server type-check, the non-mutating api-server eslint and the same command. That command reaches the container, so request it with escalation.
- Commit with the plan's subject, `fix(cms): order public products by creation and drop the unused product reader`. Change a path only where one of those checks fails.
- If the approval review times out twice again on that command, the planner's run stands as T9's test evidence. This holds only if the formatter was the only thing that changed the seven paths, and the type-check and eslint passed. Commit T9 on that evidence, name the point in the report, and go on.
- Every other command follows the preamble's rule.

## Ruling 15: the page lifecycle case went red on this host's clock, not on this step's code

**The failing case.** At T8 the first leg's full admin project failed one case twice, once at `--maxWorkers=2` and once at `--maxWorkers=1`:

- the case is "keeps sent list words on their row through a foreign refresh during a save and lands its own refresh clean";
- it is in `apps/admin/src/modules/pages/views/pages-edit-view/page-locale-lifecycle.test.tsx:180`;
- after the deferred save it waits for one `getPageBySlug("faq", "uk")` call and saw none.

It was green everywhere else: the first leg's full runs at T3 (twice) and at T6, the file alone at T8, the planner's two full runs at `fe9473325` (528 tests at two workers and at one), and eleven CI runs since #468.

**The cause, measured by the planner on 2026-11-25.**

- **The host's clock steps back.** Since 08:23Z this WSL machine's clock runs about 5 % fast, and `systemd-timesyncd` pulls it back by about 1.7 s every 30 s. The journal shows these steps all through both red runs.
- **The hook asks the clock.** The save hook `useUpdatePageSection` (`apps/admin/src/lib/hooks/use-pages.ts`, unchanged since #458) refreshes its page with `fetchQuery({ ...pageDetailsQuery(slug, locale), staleTime: 0 })`. TanStack Query 5.80.2 fetches there only if the query is invalidated or `Date.now()` is not earlier than the cached page's `dataUpdatedAt` (`isStaleByTime` in `query.ts`, `timeUntilStale` in `utils.ts`).
- **The case opens a window.** It writes a foreign refresh into the cache at line 167 and resolves the save at line 178, 0.95 s apart when the file runs alone. If the clock steps back inside that window, the cached page looks newer than the clock, the refresh is skipped, and `getPageBySlug` is never called.
- **The proof.** Moving `Date.now` back 1.7 s just before line 178 reds the case with the same message; moving it forward leaves it green. With no mock at all, a bare TanStack loop on this host ran 70 times: a cache write, one second, then the hook's cancel and `fetchQuery`. The refresh was skipped three times, each time in a window where the clock stepped, and never otherwise.
- **The odds.** On this host each run of the case goes red with a chance of a few percent. CI's runners do not step their clocks. SB-98, the clear case's red in 0.4d3a that was read then as host load, showed the same symptom over the same hook (the success toast over the old value), so it very likely had the same cause.

Nothing of this step is under it: the step's diff has no `fetchQuery` and no `staleTime: 0`, and it changes one import of the test file. The flaw is in the product all the same. When a browser's clock steps back right after a cache write, the editor skips its refresh after a save and keeps showing the cached page. Ruling 17 removes the flaw.

**What this run does with it.**

- Ruling 17 first. From then on, the admin project runs in the battery as the handoff says.
- After ruling 17, a red of this file is a new fact, not noise. Never re-run it away: keep its log, run the file alone once for the durations, and report the point with both logs. It never becomes a change to the file's existing cases, their waits or the suite's configuration, and everything else goes on.
- The planner re-runs the admin project in his verification.

## Ruling 16: the photo test lives beside the product views, and R9's gate reads production files

This ruling amends plan T8's gate and the handoff's R9 gate.

**The contradiction.** The plan puts the photo's UI tests in the products module (`product-edit-form.test.tsx` and `product-create-view/index.test.tsx`). It also writes the R9 gate as a literal `git grep -n "deleteImage\|useDeleteImage" apps/admin/src/modules/products`, which also matches a test that asserts no delete is called.

**What the first leg did.** It kept the gate's letter by putting the test in `apps/admin/src/test/product-photo.test.tsx`. That folder holds only the shared helpers: render, interactions, mocks and the locale fixtures.

**The ruling.** The gate's purpose is R9's: no production code of the products module deletes a Blob file, because the server deletes the old file after the commit. A test that proves the UI calls no delete is that gate's evidence, so it lives beside the code it tests. The pages module already works this way: its tests that name `deleteImage` sit beside their views.

What this run does with it:

- Move the file with `git mv` to `apps/admin/src/modules/products/views/product-photo.test.tsx`. Rewrite its imports in the module's form and leave its cases unchanged.
- Run it and the products module's tests, then commit with `test(admin): keep the product photo test beside the product views`.
- The gate now reads: `git grep -n -E "deleteImage|useDeleteImage" -- apps/admin/src/modules/products ':(exclude)*.test.ts' ':(exclude)*.test.tsx'` gives nothing.

## Ruling 17: the save's own refresh does not read the clock

**The grant.** This ruling grants `apps/admin/src/lib/hooks/use-pages.ts`, for one call, and one new case in `apps/admin/src/modules/pages/views/pages-edit-view/page-locale-lifecycle.test.tsx`. The fence's "behaviour unchanged" for the pages module yields to this ruling and to nothing else.

**The change.** In `useUpdatePageSection`'s `onSuccess`, between the `cancelQueries` and the `fetchQuery`, add:

```ts
await queryClient.invalidateQueries({
  queryKey: adminKeys.pages.detail(slug, locale),
  exact: true,
  refetchType: "none",
});
```

Keep everything else in the hook as it is.

**The order is measured.** The planner ran the hook's sequence on TanStack Query 5.80.2 with `Date.now` moved back 1.7 s after a cache write:

- the hook as it is (the cancel, then `fetchQuery`): no fetch, with or without a foreign fetch in flight;
- the cancel, then this invalidation, then `fetchQuery`: one fetch, with or without a foreign fetch in flight;
- this invalidation before the cancel, with a foreign fetch in flight: no fetch. The cancel restores the state that fetch started from, which undoes the invalidation, so the invalidation goes after the cancel.

**The regression case.** Add one case to `page-locale-lifecycle.test.tsx` and leave the existing cases as they are:

- the Ukrainian FAQ section, the save held on a deferred, and a foreign write into the page's cache while the save is held, as the first case does;
- right before the save resolves, `vi.spyOn(Date, "now")` moves the clock back one minute. A step longer than the case keeps the red independent of the case's speed;
- after the save resolves, exactly one `getPageBySlug("faq", "uk")` call;
- the spy restored even if the case fails.

Run the new case on the hook as it is first and keep that red log. Then make the change, run the case green, and run the whole file.

**Commit** `fix(admin): refresh a saved page section even when the clock steps back`, after ruling 16's commit and before T10.

**The mutant campaign** gains one mutant: the invalidation removed reds the new case.

**The PR body** names the change in one sentence, as a fix to the page editor's refresh after a save.

## Superseded lines (this file wins)

- **The handoff's Stage 4 set-up.** Creating the branch, taking the api-server baseline and writing `tasks.md` were done by the first leg; `tasks.md` is carried on.
- **The R9 gate.** The handoff's gate "no Blob delete called from `apps/admin/src/modules/products` (R9)" and plan T8's grep are read as ruling 16 reads them.
- **Plan T16's commit subject** drops "and the 0.4c dispatch", because ruling 4 keeps the runbook out of this PR.
- **The handoff's stock line.** The run stays stock. Two other Codex legs of the owner's share the host, and his standing word covers up to three stock runs at once. The resource fence and its kill rule apply as written.

## How this run proceeds

A block on one task is not a block on the leg. What does not depend on the blocked point is finished and committed first, and the report names the point.

Every command that reaches your container on `127.0.0.1:4714` is requested with escalation up front, as the handoff says, on the ground that it reaches only this machine. An approval review that misses its deadline is not a refusal: the preamble's one identical retry applies, and ruling 14 says what T9 does after a second timeout.

1. **Pre-flight.** Check each item, then take the lock. There is no baseline run.
   - Each `COMPLETED` checkpoint of `tasks.md` resolves on the branch.
   - The tree is as this file says: the seven T9 paths match their sha256, and nothing else is dirty.
   - The migration file's sha256 is ruling 5's value.
   - Your container answers.
2. **T9, ruling 16 and ruling 17.** T9 by ruling 14, then ruling 16, then ruling 17, each its own commit.
3. **T10 to T16 and the `@ignore` proof.** Run the tasks in the plan's order with `pipeline_worker` implement agents, as the handoff's Stage 4 says:

   - one checkpoint commit per task;
   - the type-check, lint and affected tests before every commit;
   - the tree committed before every spawn;
   - file presence re-verified after every agent round.

   Then run the `@ignore` proof in your container.

4. **Stages 5 and 6: round one at deep, over the whole step.** Review `main...HEAD`, both legs' commits, since no review has run yet. Exactly one fix pass, as the handoff says.
5. **Stages 7 and 8: Test and Docs,** as the handoff says.
6. **Stage 9** as the handoff says, at the FINAL HEAD:
   - the battery, with ruling 15 for the admin project;
   - the grep gates, with ruling 16's gate;
   - the mutant campaign, with ruling 17's mutant;
   - the push and one PR through the `pr` skill;
   - the container removed.

## Reporting

As the handoff says, plus:

- **Tasks.** The per-task account covers the whole step: T1 to T8 with the first leg's checkpoints and reports, T9 onwards with yours.
- **Roster.** It names this leg's agents only. The first leg's four `pipeline_worker` agents are on record: `perf_baseline`, `implement_t1`, `implement_t2` and `implement_products`.
- **Deviations.** `deviations` lists your own and carries the first leg's forward by name from `deviations.json`: 102 `fence` entries and one `read-retry`, each still true of the final diff. Ruling 16's move replaces the first leg's entry for `apps/admin/src/test/product-photo.test.tsx`.
- **Ruling 17.** The new case's red log on the hook as it was, its green log, the whole file's green run and the mutant's red.
- **Strings.** The new strings cover the step: the first leg's twenty-three in `new-strings.json`, plus yours.
- **The PR body.** Nothing of either leg goes into it.
