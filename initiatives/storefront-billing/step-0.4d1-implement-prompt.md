/feature from-plan 1793621707 Implement step 0.4d1 of storefront-billing (the admin forms of the new sections) from the ratified artifacts to the delivery PR, under the rulings below.

You are the IMPLEMENTER of step 0.4d1. The planner's Opus executor researched, designed and planned this step and had the plan ratified at the plan gate on 2026-11-02 after one revision (the rulings below). Nothing is implemented yet: the tree is on `main`, clean, and the ratified artifacts are on disk. Your run is `/feature from-plan`: Stage 4 pre-flight, the implementation of the plan's seventeen tasks, round one of the step's two review rounds, the tests, the documents and the PR.

## Where things are

- Branch `main` at `1b60faa92` or later (the planner's docs commits land on `main` before you start), checked out and clean; base branch `main`. You create `feat/storefront-billing-admin-section-forms` from it at Stage 4 pre-flight; one PR against `main`.
- `.feature-dev/1793621707/`: `research.md`, `design.md`, `plan.md` — the ratified artifacts (the revised versions, 2026-11-02 16:24). `design.v1.md` and `plan.v1.md` beside them are the first-gate drafts and are SUPERSEDED: never read them as input. `plan.md` ends with "## Delta from the first gate" and marks every former G-item "Ruled by the planner 2026-11-02".
- The step prompt: `initiatives/storefront-billing/step-0.4d1-prompt.md`. Read it in full: its "Rulings this step is built on" (R1–R10), "Live-verified facts", the Sacred list and the acceptance gates are the request's detail; the lines this file supersedes are listed under "Superseded lines".
- The initiative: `initiatives/storefront-billing/` (`state.md`, `decisions.md` D-21 / D-22, `deferred.md`, `design-0.4-admin-pages-editor.md`). Read-only for you: nothing under `initiatives/` enters a commit.

## The step's request (the step prompt's opening, verbatim)

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

## Plan-gate rulings (planner, 2026-11-02; verbatim, as sent to the executor at the first gate)

The owner gave the run's mode and concurrency at the contour («step delegated capped») and accepted the contour; no product question reached him from the gate. The thirteen rulings answer the executor's G-items; where a ruling and an artifact disagree, the ruling wins. `plan.md` v2 already applies them.

1. G1 accepted: `AdminPageSection<TKey>`, `SectionWriteBody<TKey>`, `CorrelatedAdminPageDetails` as type-only additions to `pages-api.types.ts`; `getPageBySlug` declares `CorrelatedAdminPageDetails`. Typing `adminSectionVariants` as a tuple in contracts becomes a ledger row of the planner's, riding 0.4d3; not yours.
2. G2 accepted: no resolver, `values: section.data`, the four behaviour changes accepted. The Home Hero checklist line gains "Update Section greys out once the save lands".
3. G3 accepted: `expectTypeOf`, no `@ts-expect-error`.
4. G4 accepted: the case-sensitive gate over `apps/admin/src` with exactly the two exemptions (`admin-header.tsx` "Open menu", `page-labels.ts` "Public Offer"). Label change: `openMenuLabel` reads "Open-Menu Button" and `closeMenuLabel` "Close-Menu Button" (hyphenated; "Menu Opening Button" reads wrong). The rest of the navigation table stands.
5. G5 and G6 accepted as proposed (keyed tables with the `RemainingFields` chain, `isMultiline`, "Screen Reader Labels", three error groups, "Storefront Link"; Title Case for titles, labels and buttons, sentence case for aria labels and helper text).
6. G7 accepted: `id` and `aria-controls` on the AccordionSummary.
7. G8 is pulled INTO this step, not carried forward. The mission's "every section of every page has a form" means every field of every section has an input: 0.4d3's "translate every page" needs them, and SB-65 assumes `storefront:grid.cardActionLabel` is fillable. Give the twelve fields inputs: `home:storefront` (freeLabel, cardActionLabel, modalDismissLabel, modalActionLabel) in `StorefrontProgramsSectionForm`; `storefront:grid` (the same four) and `blog:grid` (readMoreLabel, minReadSuffix, readArticleLabel, notPublishedLabel) by splitting the shared `StorefrontSectionForm` per key or by a `FlatFieldGroup` per key from keyed descriptor tables typed like the site tables — the executor's design call, stated in the plan with the labels. Same label rules: say what the string is for, never the marketing text. Tests: the rendered field count equals the schema key count for the three sections (the same `it.each` shape); the registry test still passes. The twelve labels join the R10 list.
8. G9: hoist, never duplicate. Fence extension granted: `apps/admin/src/test/` (a shared module for `typeInto`, `clickButton` and whatever `pages.fixtures.tsx` would otherwise copy) and `apps/admin/src/modules/products/products.fixtures.ts` for the import swap only.
9. C11: sort the Pages list client-side in `PageSlug` enum order (home, storefront, about, blog, contact, faq, offer, site), a pure sort in the list section covered by the list test; the checklist line names that order. Rationale: the coach's daily order, not alphabetical slugs; three lines.
10. The rest of the gate's strings stand ("Requisites Settings", "Terms Settings", the SEO subtitle included).
11. Mutant restore by content copy and hash, every change committed before the campaign: yes.
12. One PR, as the executor recommends; the design agent's split is not taken (the owner's law; stacked PRs are forbidden here).
13. The `updatedAt` ISO-string typing is a ledger row of the planner's for 0.4d3; not yours.

## Facts established since the step prompt was written

- R6 cannot be built with `Extract`: `adminSectionVariants = SECTION_VARIANTS.map(...)` (`pages-api.schema.ts:227-234`) yields a homogeneous array, so `AdminPageDetails["sections"][number]` is one collapsed object and `Extract<..., { section: K }>` is `never`. The mapped types of ruling 1 are the shape; the contracts fix (a typed tuple) is the planner's ledger row SB-76, outside this fence.
- The section schemas hold 35 keys and 166 leaves, every one `z.string()` or an unbounded array of string objects; no `.min`, `.max`, `.url`, enum, regex or refine. Today's `zodResolver` can never report an error, so dropping it (ruling 2) is no regression. The RHF 7.60 `values` effect resets a form only when the new `values` prop is deep-unequal to the previous one.
- Twelve schema fields had no admin input (`home:storefront` and `storefront:grid`: freeLabel, cardActionLabel, modalDismissLabel, modalActionLabel; `blog:grid`: readMoreLabel, minReadSuffix, readArticleLabel, notPublishedLabel). Ruling 7 pulls them in; the plan's task 8 builds them. `storefront:grid.cardActionLabel` has no marketing reader until SB-65 (0.4f): a saved value persists in the admin and shows nowhere on the site yet, which is why its checklist line says "persists", not "shows".
- `admin-header.tsx:54` carries `aria-label="Open menu"`, pre-existing and outside the fence: the one code exemption of the `SECTION_DEFAULTS` gate besides `page-labels.ts` "Public Offer" (ruling 4).
- The design's probes: the 44-file overlay compiles with 0 diagnostics under the admin, ui, contracts and api-server tsconfigs; 17 type mutants fail where intended; a scratch runtime run passed ui 11/11 and admin 18 files / 116 tests; 24 runtime mutants turned exactly their listed tests red. These are the design agent's numbers, not yours: you measure your own at the final HEAD.
- A parallel owner session shares this host today (a Codex leg of another repository runs fenced vitest in `heavy.slice`). This run is CAPPED (below).
- Every other "live-verified fact" of the step prompt held on `main` at `1b60faa92`.

## Superseded lines (this file wins)

- The step prompt's R6 sentence "`section: Extract<AdminPageDetails["sections"][number], { section: TKey }>`, `onSave: (body: Extract<UpdatePageSectionBody, { section: TKey }>) => void`": the signatures are the plan's (`AdminPageSection<TKey>`, `SectionWriteBody<TKey>`, `CorrelatedAdminPageDetails`), per ruling 1.
- The step prompt's "every section of every page has a form": every FIELD of every section has an input (ruling 7). The plan's task 8 and its tests are part of the request.
- The step prompt's Touch list: extended by ruling 8 with `apps/admin/src/test/interactions.ts` (new) and `apps/admin/src/modules/products/products.fixtures.ts` (the import swap only; its exports and behaviour unchanged; the two product test files untouched).
- The step prompt's acceptance gate "`capitalize(page.slug)` — no hit under `apps/admin/src/modules/pages`" stays; the plan adds the word-bounded form `grep -rnw capitalize apps/admin/src/modules/pages` (no hit), because a test name may contain "capitalized".
- The step prompt's checklist items: as the plan's delta rewrites them (the Pages list line names the order Home, Storefront, About, Blog, Contact, FAQ, Public Offer, Site (shared strings); the Home Hero line adds "Update Section greys out once the save lands"; a new line covers the listing inputs of Storefront Grid, Blog Grid and Home → Storefront).
- The step prompt's "STOP at the plan gate", "STOP at review-flow's triage gate with the report; the ruling arrives as a follow-up message" and "end your turn with a one-line interim report ... the planner resumes you": nothing resumes a Codex leg. The gate is answered (this file); the flow's triage is the ruling, applied at once in one fix pass; you stay in your turn on `wait_agent` until every helper has reported, and your final message ends the run.
- The step prompt's resource fence numbers are the budget below (identical: `MemoryMax=3G`, heap 2048, `--maxWorkers=2`, `--concurrency=1`).

## How this run proceeds

### Stage 4 — pre-flight

- Create `feat/storefront-billing-admin-section-forms` from `main`; take the lock as the skill says; write `tasks.md` from `plan.md` v2 (seventeen tasks, the ten-commit table under "Task Order"). Never read `design.v1.md` or `plan.v1.md`.
- Implement in the plan's order with `pipeline-worker` implement agents as the skill says, ONE alive at a time (CAPPED): checkpoint commits per the plan's commit table, each with a typed lowercase subject; type-check, lint and the affected tests before every commit; file presence re-verified after every agent round.
- No UI visual check by you: the browser pass is the owner's.

### Stage 5–6 — review-flow at deep, round one of two

- Run the flow as the skill says: fresh lenses, refuters and breaker as `pipeline-worker` agents, strictly one alive at a time (CAPPED: no parallel lenses), the sweep, the synthesis into `.feature-dev/1793621707/review.md`, the triage, then exactly one fix pass. Caller context for the flow: this file (the request and the rulings), `research.md`, `design.md`, and the battery commands below.
- The triage is the ruling: apply exactly the fix-now set in one pass (a typed checkpoint subject naming the change), run type-check, lint and the affected tests before the commit, and never re-review the fix diff. A finding whose fix would add a mechanism, cross the fence or change a contract is never fix-now: it is a carry-forward or a deferral in the report, or a design-change escalation that ends the run `blocked` with the facts.

### Stage 7–8 — Test and Docs, sequentially

- Test agent: the regression tests of the fix-now set, the plan's acceptance criteria not yet covered (`plan.md` Test Strategy; tasks 12–14 already write the planned tests, so fill gaps and do not duplicate), the design's edge cases.
- Docs agent: plan task 15 — the one sentence of `docs/BOUNDED-CONTEXTS.md` §2 (Consumer apps), as the plan's item 8 words it. No ADR, no CHANGELOG.
- Under CAPPED the two agents run one after the other, never in one message. Two checkpoint commits, `test:` then `docs:`.

### Stage 9 — finalize

- The battery at the FINAL HEAD, inside the fence, one heavy command at a time: `pnpm exec vitest run --project admin --maxWorkers=2`; `--project ui`; `--project contracts`; `--project platform` (they must not notice the change); `pnpm check-types`, `pnpm lint`, `pnpm dep:check`, `pnpm format:check` (turbo tasks with `--concurrency=1`; run the non-mutating per-package eslint before `pnpm lint`, which runs `--fix`, then confirm `git status` is clean); the admin build with `NODE_OPTIONS=--max-old-space-size=2048`. No api-server suite, no database, no container.
- The grep gates of the step prompt as superseded above, plus the `SECTION_DEFAULTS` gate per ruling 4 (case-sensitive over `apps/admin/src`, the two named exemptions only).
- The mutant campaign of plan task 17: every mutant restored from a content copy verified by sha256, never `git checkout --` / `git restore`, every change committed before the campaign starts; the results go in the report.
- Push the branch and open the PR through the `pr` skill (pipeline mode: head and base fixed, no branch question). Body per `~/.claude/skills/_shared/pr-template.md`, inside its budget, with the owner's checklist AS CHECKBOXES (the plan's final list); nothing about the run, no mutants, no counts, no finding IDs.
- Report, with the tree state.

## Scope fence (from the step prompt, verbatim, with the ruling-8 extension)

- **Touch:** `apps/admin/src/modules/pages/**`; `apps/admin/src/lib/api/endpoints/pages.ts`;
  `apps/admin/src/lib/hooks/use-pages.ts`; new test files under `apps/admin/src/modules/pages/`;
  `packages/ui/src/components/dynamic-list-item.tsx` and `dynamic-list-item.test.tsx`;
  `packages/contracts/src/entities/cms/pages/pages-api.types.ts` (type-only additions);
  `docs/BOUNDED-CONTEXTS.md` (the one sentence of R9); ruling 8: `apps/admin/src/test/interactions.ts`
  (new) and `apps/admin/src/modules/products/products.fixtures.ts` (the import swap only).
- **Do NOT touch:** every other file under `apps/admin/src/{app,lib,modules,test}` (the route
  handlers, the navigation config, every other module, the existing test helpers), `apps/marketing/**`,
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

## Sacred (charter, verbatim)

The iOS wire contract · prod data additive-only (this step changes no table, no column
and no row on production; the English defaults it lets the coach see are written by the
existing scaffold on first open, as 0.4b designed) · athlete navigation stays free ·
dep-cruiser context rules (the admin reaches CMS through `@repo/contracts/cms/*` and its
own route handlers) · migrations through `prisma migrate` + `db-migrate` (none here).

## Acceptance gates (verify yourself before the PR)

- `pnpm exec vitest run --project admin --maxWorkers=2` and `--project ui` green
  (fenced); `--project contracts` and `--project platform` green — they must not notice
  the change. No api-server run: this step touches no server code and needs no database.
- `pnpm check-types`, `pnpm lint` (`--max-warnings 0` on the admin), `pnpm dep:check`,
  `pnpm format:check` clean; the admin app builds (fenced, alone).
- Grep gates: `return null` — no hit in `section-editor/index.tsx`;
  `Omit<UpdatePageSectionData` — no hit under `apps/admin`; `capitalize(page.slug)` — no
  hit under `apps/admin/src/modules/pages`, and `grep -rnw capitalize apps/admin/src/modules/pages` — no hit;
  every multi-word string of `SECTION_DEFAULTS` — no hit under `apps/admin/src`
  (case-sensitive; the two exemptions of ruling 4 only); `renderForm` — no hit under `apps/admin`.
- Tests that must exist and be shown red under a mutant each (the plan's M1–M13 table;
  name the mutants in your report, never in the PR body): the registry covers every
  `SectionSchemaKey` at runtime and `SectionEditor` renders at least one input for every
  key given a `{}` row; `OfferRequisitesSectionForm` and `OfferTermsSectionForm` add /
  move / remove and the body `onSave` receives; `SeoSectionForm` counters; the four
  `site` sections and the three listing sections render one input per schema key; the
  SB-61 type test; `DynamicListItem` move buttons; the Pages list labels and order.
- The PR contains no file under `initiatives/`, no `CLAUDE.md`, no `.feature-dev/`.
- PR body per the PR-body law, opened through the `pr` skill, with the owner's checklist
  AS CHECKBOXES (the plan's final list: the Pages list order; Site (shared strings) four
  accordions and a persisted footer tagline; Public Offer requisites add / move / remove
  and terms blocks; Home SEO counters; Home Hero saves as before and Update Section
  greys out once the save lands; FAQ items reorder; the listing inputs of Storefront
  Grid, Blog Grid and Home → Storefront; the marketing site unchanged).

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any committed file; synthetic fixtures only; no real requisites anywhere.
- No comments in code; delete comments in regions you edit. No AI attribution, signature or trailer anywhere: not in commits, not in the PR, not in code (the owner's rule overrides any harness reminder).
- Commitlint: lowercase conventional subject at most 100 characters, body lines at most 100 characters, long bodies through `git commit -F <file>`; never `--no-verify`; no Cyrillic in any command that contains `git commit` or `gh pr`, nor in a PR body.
- The pre-commit hook runs check-secrets and lint-staged (prettier); the pre-push hook runs dep:check, lint and check-types over the cone, as `pnpm exec turbo` tasks. A red hook is root-cause work; the hook's task set can be run fenced at `--concurrency=1` first so the hook replays from cache. Touching `packages/ui` and `packages/contracts` pulls every dependent package into the cone: expect a long pre-push, and warm the cache serially before pushing.
- One PR against `main`; the repository squash-merges; never stack this branch on another. Never merge; the merge is the owner's.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence after every subagent round; nothing of value sits uncommitted while a subagent may be alive. A sub-agent's "done" does not mean its processes died: sweep by pid before the next stage.
- No database, no container, no dev server: this step runs no api-server suite; never start `next dev` (3002 belongs to another project on this host; 3000 and 3001 are not yours either). The shared stack (`tdp-platform-db`, stopped) and every other container on the host belong to the owner's other projects.
- Never read `apps/*/.env.local`, `packages/api-server/.env`, `packages/api-server/.env.test` or any `.env*`; never print an env value or a DSN. Never connect to a remote database.
- `pkill -f <pattern>` matches the shell that runs it: kill by pid.
- Command form: never `cd` inside a compound command; absolute paths in every command that names files or globs; the repository is `/home/maksym/projects/contrib/the-discipline-program`.
- The project hook PROD-GUARD refuses `Edit` / `Write` on `prisma/migrations/`, lock files and `.github/workflows/`; nothing in this step touches them.
- `initiatives/**`, `CLAUDE.md` and `.feature-dev/**` never enter a commit.
- No polling: never `sleep`-loop or `pgrep`-loop on a helper; wait on `wait_agent`.

## Resource budget (the step skill's, verbatim)

- **Hard fence:** every heavy command (`next build`, full vitest runs, the route suite, `test:coverage`) runs inside a cgroup ceiling, in the shared slice: `systemd-run --user --scope -q --slice=heavy.slice -p MemoryMax=3G -p MemorySwapMax=1G -- <cmd>`. A breach kills that command (retriable red), never the VM.
- **Shared ceiling:** `heavy.slice` is ONE slice for the fenced commands of every session on the host (`MemoryMax=10G` on this host today, and another session's leg is using it); never drop `--slice=heavy.slice`.
- **Diet inside the fence:** `NODE_OPTIONS=--max-old-space-size=2048` on build commands, set in the CALLER's environment, which a `--scope` unit inherits (never `-p Environment=...`); vitest capped at `--maxWorkers=2`; turbo fan-out capped at `--concurrency=1`.
- **Sequencing:** heavy steps run strictly one at a time: never a build concurrently with a test run, never two agents driving heavy commands at once.

## Concurrency

CAPPED: a parallel owner session shares the host. At most ONE internal subagent alive at a time; no parallel fan-out (no parallel lenses, no Test-and-Docs in one message); stages strictly sequential; heavy commands one at a time.

## Reporting

Your final message is the report the wrapper validates against its schema; its `report` field is the executor's PR-open report, for the planner and never for the PR body. It carries: the per-task account of the work (every task of the plan with its checkpoint commit); the complete stage-agent roster (implement, review-flow lenses, refuters and breaker, fix pass, test, docs: `subagent_type` and count, or INLINE where you ran a stage yourself); round one's candidate count before any cap alongside the reported count, the refuted count, and every finding with its bucket and rationale as the triage applied it; the mutant campaign's results (every M-row with its red tests, every restore hash-verified); the verification evidence (every number measured at the FINAL HEAD); every new user-facing string (the full list: card titles, group headings, field labels, buttons, helper texts, aria labels, page labels); any design-change escalation. Declare the branch, the HEAD, clean or dirty, and that no process of yours is alive.
