# Step 0.4d3a — the browser-gate fix pass (the Codex fix leg)

**PR:** #458 "feat(cms): add languages to the page editor", branch `feat/storefront-billing-editor-locales`, base `main`, head `6f6f5ad06` when this file was written. The owner's browser pass (2026-11-16) found two things to fix before the merge; the planner diagnosed both at their source and ruled the shape below. This file carries that set and nothing else.

**Your duty:** apply exactly the two items below in ONE pass, run the battery, push to the PR branch, and report. No re-review follows, so each item carries its own regression test as stated. Do not widen: anything else you notice goes into the report, not into the diff. The scope fence and the rulings of `initiatives/storefront-billing/step-0.4d3a-implement-prompt.md`, the amendment of `step-0.4d3a-implement-continue-prompt.md` and the constraints of `step-0.4d3a-fix-prompt.md` still hold (read each with `git show origin/main:initiatives/storefront-billing/<file>` after `git fetch origin`; never copy one into the tree). This file adds one grant to that fence: item 2's route file and its test, which the step had not touched.

## The set

### 1. The language banner is squeezed into a narrow column from `md` up

**Measured.** `apps/admin/src/modules/pages/components/language-bar/index.tsx` lays the banner and the switch in a row from `md` (`direction={{ xs: "column", md: "row" }}`); the banner takes `flex: 1` (`language-banner/index.tsx`), and the switch is a `TextField` with `minWidth: "12rem"` (`language-switch/index.tsx`). The app theme sets `fullWidth: true` on every `TextField` (`packages/mui/src/theme/components/text-field.ts:7`), so the switch claims the whole row and the banner collapses to its minimum content width. Below `md` the bar is a column and reads well. The bar renders on the Pages list (`sections/pages-list-section/index.tsx`) and in the editor (`views/pages-edit-view/pages-edit-form.tsx`); both show the defect.

**Ruled.** The bar is a column at every width, in the order narrow screens show today: the banner on its own row across the bar's full width, the switch on its own row under it. Below `md` the switch keeps the full width it has today; from `md` up it is as wide as its content needs, with the existing `12rem` minimum, and sits at the row's start. No px dimension; the sticky behaviour, the spacing, every string and the theme default stay as they are. The files are the three components above and their tests.

**Regression test.** Rendered through the admin test helper that mounts the app theme (`apps/admin/src/test/render.tsx`, the real `theme` of `@repo/mui`), the switch's form control must not carry the class `MuiFormControl-fullWidth` (the class MUI adds for `fullWidth`, `@mui/material/FormControl/FormControl.js:29`), and the banner and the switch must not share a row at any breakpoint the bar declares. A test that renders without the app theme proves nothing here, because MUI's own default is not full width. Mutant: drop the opt-out of the theme's full width from the switch; the test is red.

### 2. A save waits for the marketing site's cache refresh, and the browser gives up first

**Measured.** `apps/admin/src/app/api/admin/pages/[slug]/sections/route.ts` awaits `cmsPagesAdminApi.updateSection(...)` and then awaits `triggerMarketingRevalidation(...)`, a `fetch` with a ten-second abort (`REVALIDATE_TIMEOUT_MS`), before it answers 204. The browser client allows five seconds an attempt and fifteen in all (`packages/api-client/src/client.ts`: `DEFAULT_TIMEOUT_MS`, `DEFAULT_MAX_TOTAL_DURATION_MS`). Whenever the marketing site answers slower than five seconds, the row is written and the editor still reports a failed save and refetches nothing. On the owner's host a connection to a port nobody listens on hangs instead of refusing (measured: ten seconds to the abort), so with the marketing dev server down every save and every "Clear Translation" looked like nothing had happened until a reload. The route has carried this since step 0.4b; the step under review did not change it.

**Ruled.** The response no longer waits for the refresh. The handler awaits the write, schedules the refresh with `after` from `next/server`, and answers 204. A write that throws schedules nothing. The refresh itself is unchanged: the same target from `marketingRevalidationTarget(slug, body.locale)`, the same query, the same ten-second abort, the same log lines, the same skip without a secret. Nothing changes in the client, in `packages/api-routes` or in the marketing app.

**Measured for the test.** Next 16.2.6 exports `after` from `next/server` (`apps/admin/node_modules/next/server.d.ts:21`); called outside a request scope it throws (`next/dist/server/after/after.js:12-21`), and the route test calls `PATCH` directly, outside one. So the test replaces `after` with a partial mock of `next/server` that keeps every other export (`NextResponse` is used by `createPatchByParamHandler`) and collects the scheduled tasks.

**Regression tests**, in `apps/admin/src/app/api/admin/pages/[slug]/sections/route.test.ts`:

- the two existing exact-query cases still hold once the collected task has run;
- with a `fetch` that never settles, `PATCH` resolves 204, one task is scheduled, and `fetch` has not been called until the task runs;
- with `updateSection` rejecting, no task is scheduled and `fetch` is never called.

Mutant: await the refresh in the handler again instead of scheduling it; the never-settling case is red.

## The battery after the pass (every heavy command inside the fence, one at a time)

`SKIP_ENV_VALIDATION=1 pnpm exec vitest run --project admin --maxWorkers=2`; `pnpm --filter admin exec eslint . --max-warnings 0`, then `pnpm lint` with the tree clean after it; `SKIP_ENV_VALIDATION=1 pnpm check-types` with `NODE_OPTIONS=--max-old-space-size=2048` and turbo `--concurrency=1`; `pnpm dep:check`; `pnpm format:check`; the admin build with `NODE_OPTIONS=--max-old-space-size=2048`. Nothing in this pass touches `packages/api-server` or `packages/contracts`, so their suites do not run and no database container is needed; if your diff reaches either package, that is a deviation to report and the suite of the package you touched runs as `step-0.4d3a-fix-prompt.md` describes. Mutants: the two named above, each shown red and then green after a restore from a content copy verified by sha256 (never `git checkout --` or `git restore`), every change committed before the campaign starts.

## Commits and the push

Two conventional commits on the step branch, each with its tests: `fix(cms): …` for the banner and `fix(cms): …` for the save response. Lowercase subject at most 100 characters, body lines at most 100 characters, long bodies through `git commit -F <file>`, no trailer of any kind. Push the branch to the PR; never open a second PR, never rebase or squash the existing commits, never force-push, never edit the PR body or comment on the PR.

## Standing constraints, resource budget, concurrency

The sections "Standing constraints", "Resource budget" and "Concurrency" of `step-0.4d3a-fix-prompt.md` apply verbatim, with one difference: this pass needs no database container, so start none. In particular: never start `next dev` or any server, never read an `.env*` file, no real Blob call, no comment in code, no attribution line anywhere, `initiatives/**` never enters a commit.

## Reporting

Your final message is the report the wrapper validates against its schema; its `report` field is for the planner, never for the PR body. It carries: the account of each item (what changed, the files, the regression tests and what they pin); the two mutant results with the restore hash checks; the battery results with the admin test counts and the lint, check-types, dep:check, format and build outcomes; the CI state of the PR after the push (`gh pr checks 458`); the new user-facing strings (none are expected; list any); every deviation (`fence`, `law`, `read-retry`) with its root cause; `round_one` null; the roster as INLINE entries; the tree state where you left it (the step branch, clean, the pushed head) and that no process of yours is alive.
