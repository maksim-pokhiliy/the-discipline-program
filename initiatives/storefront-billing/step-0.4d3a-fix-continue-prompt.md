# Step 0.4d3a — the round-two fix pass, continued (the second Codex fix leg)

Continue the round-two fix pass of PR #458 from the first fix leg's preserved work to the pushed head, under `step-0.4d3a-fix-prompt.md` and the ruling below. Read that file in full with `git show origin/main:initiatives/storefront-billing/step-0.4d3a-fix-prompt.md`: it stays the authority for the fix-now set, the battery, the mutants, the commits, the standing constraints, the resource budget and the report. This file changes exactly one expectation in it and tells you where the work stands.

## Why there is a second leg

The first fix leg (`gpt-6.1-sol`, `xhigh`, thread `01a1bcca-77b7-72b1-a0be-1eceb28aa8df`) stopped `blocked`, correctly: item 4 (RF-11) told it to expect the draft's `data` to equal exactly `UK_HERO_TITLE_ONLY`, but the admin read composes a non-default row with the English row's shared values (`packages/api-server/src/endpoints/cms/pages/admin.ts:99`, `overlayWords`; the shared branch at `packages/api-server/src/endpoints/cms/pages/section-translation.ts:77-78`), which is the D-24 rule the handoff ratifies. The leg measured the read and found `buttonHref` and `backgroundImage` of `ENGLISH_HERO` beside the title. The expectation was the planner's error, not the code's.

## The ruling (replaces item 4's first expectation, nothing else)

In `packages/api-server/src/endpoints/cms/pages/admin.translation.test.ts`, "reopens a draft with its words" asserts:

```ts
expect(hero?.data).toEqual({
  ...UK_HERO_TITLE_ONLY,
  buttonHref: ENGLISH_HERO.buttonHref,
  backgroundImage: ENGLISH_HERO.backgroundImage,
});
```

the draft's one written word plus the two shared values the read takes from English, and no other English word. The second exact assertion of item 4 (`getPageBySlug`, the shared values alone) stays as the first leg wrote it. Item 4's mutant is unchanged and must be red in BOTH tests: `data: { ...english.data, ...overlayWords(SECTION_FIELD_KINDS[section], english.data, own.data) }` at `admin.ts:99` leaks `subtitle` and `buttonText` of `ENGLISH_HERO` into the draft.

## Where things are

- Branch `feat/storefront-billing-editor-locales`, HEAD `9a0f2a2c7` (equal to origin and to PR #458's head), nothing committed or pushed by the first leg.
- The tree is DIRTY with the first leg's uncommitted work on exactly these files: `apps/admin/src/lib/hooks/use-pages.ts`; `apps/admin/src/modules/pages/components/locale-gate/{index.tsx,resolve-locale-param.ts,resolve-locale-param.test.ts}`; `apps/admin/src/modules/pages/components/section-editor/{section-editor-key.ts,section-editor-key.test.ts,section-translation.test.tsx,translation-form-values.ts}`; `apps/admin/src/modules/pages/components/section-field/{field-at-path.ts,index.ts}`; `apps/admin/src/modules/pages/pages.fixtures.tsx`; `apps/admin/src/modules/pages/sections/pages-list-section/{index.test.tsx,page-columns.tsx}`; `apps/admin/src/modules/pages/views/pages-edit-view/{page-locale-lifecycle.test.tsx,page-locale.fixtures.ts,pages-edit-form.locale.test.tsx}`; `packages/api-server/src/endpoints/cms/locale/translation-progress.ts`; `packages/api-server/src/endpoints/cms/pages/admin.translation.test.ts`.
- The first leg's own account, which you verify rather than trust: items 1, 2, 3, 5, 6, 7, 8, 9 and 10 applied with their tests; the targeted admin runs green (6 files, 144 tests); the targeted api-server run with one failure, item 4's first expectation; the fixture comparison for item 7 identical before and after (its temporary test removed); item 6's widths asserted on the header cells, which the DataTable exposes; item 5 dispatches the file selection and awaits the mutation flush; no mutant run, item 5's guard mutant included.
- Its scratch is under `.feature-dev/1794168781/` (gitignored): a command ledger, logs, a runner script. Use it or not; never commit it.
- No container of this step exists; port 4714 is free and reserved for your container `tdp-0-4d3a-fix` (the fix prompt's command).

## How this run proceeds

1. Inspect every preserved file against its item of the fix prompt before building on it: the change matches the item, nothing beyond it, no comment, no stray debug. A preserved change that does not match its item is redone to the item, and the report says which.
2. Apply the ruling above.
3. Then the fix prompt from "The battery after the pass" on: the full battery, the mutant campaign (items 1, 2, 3, 4, and 5 when the event reaches the handler), the commits one per concern, the push, the report. The PR body stays as it is.

## Reporting

The report covers the whole fix pass: the per-item account for all ten items (marking which you took from the first leg after inspection and which you redid), the mutant results, the battery, the CI state after the push, the deviations, the roster (INLINE; a fix leg spawns nothing), and the tree, container and process state.
