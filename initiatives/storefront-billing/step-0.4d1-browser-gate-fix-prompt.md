# Step 0.4d1 — the browser-gate fix (the owner's reopened finding, the Codex fix leg)

**PR:** #440 "feat(cms): make every page section editable in admin", branch `feat/storefront-billing-admin-section-forms`, base `main`, head `6d89e084e` when this file was written (round two's fix pass is on it; the planner verification passed). At the browser gate the owner reopened the finding carried as SB-78 (round one's RF-2): it is not a limitation but a regression of this step, and it is fixed on the delivery PR as the owner's own finding — the step skill's Phase 7 path, with the planner verification rerun after and no review round (two-review-rounds law).

**Your duty:** apply exactly the set below in ONE pass, run the battery, push to the PR branch, update the PR body where the fix changes what it says (one line removed, one checklist item added, as stated), and report. Do not widen: nothing else on the PR is yours.

## The finding, verified at source

The editor on `main` seeded its form with `defaultValues` and never re-read the server document after a save; the 0.4d1 editor seeds it with `values: section.data` (`apps/admin/src/modules/pages/components/section-editor/index.tsx:44`) so the refresh after a successful PATCH resets the form to the stored document. An image upload that was still running when Update Section was clicked therefore completes during the PATCH, writes its new URL with `setValue(..., { shouldDirty: true })` (`hero-section-form.tsx`, `personal-section-form.tsx`), and the refresh replaces that URL with the one the save submitted; the same for a personal-image removal whose delete settles during the PATCH. Round one's breaker measured it against the base editor ("the base controls retain … an upload started before Save, confirming a regression"). The `fieldset` lock of RF-1 stops a new upload during a save but not one already in flight.

## The fix-now set

1. **The image mutations carry a key.** `apps/admin/src/lib/hooks/use-upload.ts`: export `IMAGE_MUTATION_KEY = [...adminKeys.root, "images"] as const` (import `adminKeys` from `../api/keys`) and give both `useUploadImage` and `useDeleteImage` `mutationKey: IMAGE_MUTATION_KEY`; re-export the key through the hooks barrel (`apps/admin/src/lib/hooks/index.ts`) if the barrel re-exports by name. **Fence extension granted for these two files and these lines only.**

2. **Update Section waits for in-flight image operations.** `apps/admin/src/modules/pages/components/section-editor/index.tsx`: `const isImageBusy = useIsMutating({ mutationKey: IMAGE_MUTATION_KEY }) > 0;` (`useIsMutating` from `@tanstack/react-query`; the mutation-cache count, no prop threading, no context) and `disabled={isLoading || isImageBusy || !methods.formState.isDirty}` on the Update Section button. The `fieldset` lock stays as it is: the coach keeps typing while an upload runs; only the save waits. The upload's `onSuccess` sets the URL before the observers see the mutation settle (query-core dispatches `success` and notifies the observer's `mutate`-level callbacks in one batched notification), so the button never renders enabled without the new URL.

3. **Regression tests, real hooks, the API mocked at the boundary** (the pattern of `page-save-lifecycle.test.tsx`: `vi.mock("@app/lib/api")` with deferred promises, `PagesEditView` rendered through `@app/test/render`; add the cases to that file or to a sibling `image-save-gate.test.tsx` under `pages-edit-view/` if the file would pass 300 lines):

   - _Upload:_ a page with the hero section whose `SECTION_FEATURES` entry has `hasBackground`; mock `api.upload.uploadImage` with a deferred; type a title (the form is dirty, Update Section enabled); select a file on the `ImageUpload` input; assert Update Section disabled while the upload is pending, the title input still enabled; resolve the upload with a new URL; assert Update Section enabled and, after the click, `updateSection` called once with the new URL in the hero data.
   - _Delete:_ the personal section with a stored image; mock `api.upload.deleteImage` with a deferred; click the remove control; assert Update Section disabled while the delete is pending; resolve; assert it enabled and the save body carries the cleared image.
   - _The gate is the key:_ a direct `section-editor.test.tsx` case or a mutant note is not required; the two cases above are the regression.

4. **The PR body.** Remove the closing line "An image upload already running when Update Section is clicked can still be overwritten by the completing refresh. Wait for uploads to finish before saving." and add one checklist item after the Home SEO item: `- [ ] Home → Hero: select a background image and, before its preview appears, try Update Section: the button stays disabled until the upload finishes, then the save stores the new image`. Nothing else in the body changes; nothing of the run enters it (`gh pr edit 440 --body-file <file>`, the file written in a step of its own, no Cyrillic, no pipeline vocabulary).

## The battery after the pass (every heavy command inside the fence, one at a time)

`SKIP_ENV_VALIDATION=1 pnpm exec vitest run --project admin --maxWorkers=2` (every case green, the new cases included); `pnpm --filter admin lint` (`--max-warnings 0`; `max-lines` 300 and `react/no-multi-comp` are on, decompose instead of suppressing); `SKIP_ENV_VALIDATION=1 pnpm check-types` with `NODE_OPTIONS=--max-old-space-size=2048` and turbo `--concurrency=1`; `pnpm dep:check`; `pnpm format:check`. The step's grep gates stay at zero (`return null` under the section editor, `Omit<UpdatePageSectionData`, `capitalize`, `renderForm`, multi-word `SECTION_DEFAULTS` strings under `apps/admin/src` with the two exemptions, singular `.fixture.` files, `vitest/globals` imports).

## Commits and the PR

One or two conventional commits on the step branch (`fix(cms): hold update section while an image operation runs`, `test(cms): …` if the tests are separate), lowercase subject at most 100 characters, body lines at most 100 characters, long bodies through `git commit -F <file>`, no trailer of any kind. Push to the PR; never open a second PR, never rebase, squash or force-push. Warm `check-types` with `SKIP_ENV_VALIDATION=1` before the push (the pre-push hook runs dep:check, lint and check-types on the cone and exits 143 on a cold cache).

## Standing constraints (the handoff's, still in force)

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any committed file; synthetic fixtures only.
- No comments in code; delete comments in regions you edit. No AI attribution, signature or trailer anywhere.
- No Cyrillic in any command that contains `git commit` or the GitHub CLI's PR verbs, nor in the files behind `-F` / `--body-file`; the hook `pr-guardrails.sh` scans the WHOLE command once it contains the PR create or edit verb of the GitHub CLI.
- Never `--no-verify`; a red hook is root-cause work.
- No database is needed: the admin project runs without one. Never read `apps/*/.env.local`, `packages/api-server/.env`, `packages/api-server/.env.test` or any `.env*`; never print an env value or a DSN; never connect to a remote database.
- Never start a dev server on 3000, 3001 or 3002 (3002 and 3012 belong to other projects on this host). Leave every docker container alone. A Codex process of the owner's other project may run on this host: not yours.
- `pkill -f <pattern>` matches the shell that runs it: kill by pid.
- Command form: never `cd` inside a compound command; absolute paths in every command that names files or globs; the repository is `/home/maksym/projects/contrib/the-discipline-program`.
- The project hook PROD-GUARD refuses `Edit` / `Write` on `prisma/migrations/`, lock files and `.github/workflows/`; nothing here touches them.
- `initiatives/**`, `CLAUDE.md` and `.feature-dev/**` never enter a commit; this file lives on `main` only and is read, never copied into the tree.
- No polling: no `sleep` loops, no `pgrep` watchers.

## Resource budget (the step skill's, verbatim)

- **Hard fence:** every heavy command runs inside a cgroup ceiling, in the shared slice: `systemd-run --user --scope -q --slice=heavy.slice -p MemoryMax=3G -p MemorySwapMax=1G -- <cmd>`. A breach kills that command (retriable red), never the VM. If `systemd-run --user` is unavailable, say so in the report and fall back to the diet and sequencing rules alone — never silently.
- **Shared ceiling:** `heavy.slice` is ONE slice for the fenced commands of every session on the host; never drop `--slice=heavy.slice`.
- **Diet inside the fence:** `NODE_OPTIONS=--max-old-space-size=2048` on build and type-check commands, set in the CALLER's environment (never `-p Environment=...`); vitest capped at `--maxWorkers=2`; turbo fan-out capped at `--concurrency=1`.
- **Sequencing:** heavy steps run strictly one at a time.

## Concurrency

STOCK (the owner's ruling of 2026-11-02): no cap on your internal stages; heavy commands still one at a time inside the fence.

## Reporting

Your final message is the report the wrapper validates against its schema; its `report` field is the fix-pass report for the planner, never for the PR body. It carries: the per-item account (the key, the gate, the two tests, the PR-body edit: what changed, the files, what each test pins); the battery results with counts; the CI state of the PR after the push (`gh pr checks 440`); the new user-facing strings (the checklist line is not product copy; list any product string you add — none is expected); every deviation and its root cause; `round_one` null; the roster as INLINE entries (a fix leg spawns nothing); the tree state where you left it (the step branch, clean, the pushed head).
