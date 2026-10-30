/feature from-plan 1792839110 Continue step 0.4b of storefront-billing (content surfaces, server half) from its committed implementation to the delivery PR, under the rulings below.

You are the SUCCESSOR executor of step 0.4b. The planner's previous executor researched, designed and planned this step, had the plan ratified at the plan gate on 2026-10-24 (the rulings below), implemented tasks T1-T15 of the plan as six checkpoint commits on the step branch, ran the first stages of the review round and was then paused by the owner; its context is gone. Everything binding is in this file and in the files it names. Invoke the /feature skill in `from-plan` mode with this entire file as its argument and continue the pipeline from where the previous executor left it: do not restart planning, do not regenerate any artifact, do not reimplement what is committed.

## Where things are

- Branch `feat/storefront-billing-cms-content-surfaces`, checked out and clean; base branch `main`, merged into the branch so this file is on disk (never rebase the branch: the task record below resolves the checkpoint commits by SHA). The six step commits: `e7ed3942c` (C1, SB-52), `0f3fc5432` (C2, SB-51), `e414aff77` (C3, SB-54), `c0665c725` (C4, contracts), `cc6d3df3f` (C5, api-server), `1ffbb5e49` (C6, route handlers and the admin section-editor labels). `git diff main...HEAD` is the change.
- `.feature-dev/1792839110/`: `research.md`, `design.md`, `plan.md` (ratified); `gate-ruling.md` (the planner's binding ruling, reproduced below); `tasks.md` (T1-T15 COMPLETED with their checkpoint commits, T16 and T17 PENDING); `perf-baseline.md` with `evidence/perf/` (the "before" capture, its scripts and sha256 values); the interrupted review round: `review-state.md`, `review-lens{1,2,3}.md`, `review-refuter-{a,b}.md`, `review-breaker.md`, `evidence/{review-lens*,refuter-*,breaker}/`. There is no `.lock`.
- The step prompt: `initiatives/storefront-billing/step-0.4b-prompt.md`. Read it in full: its "Rulings this step is built on", the four deliverables, the Sacred list and the plan-gate report section are the request's detail; the lines this file supersedes are listed under "Superseded lines". The initiative docs: `initiatives/storefront-billing/{charter,decisions,deferred,plan}.md`; `initiatives/**` is read-only and never enters a commit.
- What remains: a compliance pass over the committed code against the rulings; Stage 5-6 (review-flow at deep with its one fix pass, round one of the step's two); Stage 7-8 (the tests; the documents, plan task T16); Stage 9 (the battery and the gates at the final HEAD, the perf "after" capture, the PR).

## The step's request (the step prompt's opening, verbatim)

## Mission

D-21 (ratified 2026-10-16) says everything a buyer reads is CMS data or an `Intl` result.
After 0.4a the page sections exist per locale with a fallback to English, but three kinds
of buyer-facing text still live in code: the page SEO titles and descriptions
(`apps/marketing/src/lib/seo/seo-page.ts`), the site chrome (navigation labels, the
footer, the lead form, the 404 and error pages) and the public offer with the seller's
requisites, which does not exist at all and which the acquiring checklist requires.

This step moves all three into the content model and ships nothing visible: a `seo`
section on every public page, a `site` pseudo-page whose sections hold the chrome, an
`offer` page with its three sections, the public and admin reads and writes for them, the
English defaults that pre-fill the new English sections so the coach translates instead
of authoring, and the retirement of the dead page-metadata write (SB-49). The admin forms
for the new sections come in 0.4d, the marketing site reads them in 0.4f and 0.4g; both
are built on what you ship here. After this step the marketing site looks exactly as it
does today; the admin's Pages list gains two rows (Site, Offer) whose editors stay empty
until 0.4d.

One delivery PR, four deliverables:

1. The contracts: the new section keys and schemas, the two page slugs, the per-page
   `seo` on every page response, the `offer` and `site` responses, the section defaults.
2. The api-server: the readers and the scaffold for the new pages and sections, the
   defaults applied to the default locale only, the fixtures and the tests, SB-49.
3. The route handlers: the two new entries of the public pages route, the revalidation of
   the whole site when the `site` page changes, the admin metadata PATCH removed.
4. The documents: ADR-0046, `docs/BOUNDED-CONTEXTS.md` §2.

Not yours: any admin or marketing screen or component, the marketing `generateMetadata`
and `PAGE_SEO` / `SEO_CONFIG` (0.4f removes them), the offer page route and the sitemap
(0.4g), product translations and the photo (0.4c), any migration (none is needed: the
schema change is `@ignore` on two columns), creating content on any database but a test
one.

## Plan-gate rulings (planner, 2026-10-24; verbatim from `.feature-dev/1792839110/gate-ruling.md`)

The questions each ruling answers are in `design.md` under the heading "Plan-gate items for the planner" (PG-1 to PG-15, each with the previous executor's recommendation). Where a ruling and an artifact disagree, the ruling wins. The "Process" lines on the cap, the 4G fence and the container are reproduced for completeness and superseded below.

# Gate A ruling (planner, 2026-10-24) — binding addendum to design.md and plan.md

Where this file and design.md / plan.md differ, THIS FILE WINS. Everything not named here is approved as written.

## Process

- ONE PR. Riders stay C1–C3 with their own commits and non-overlapping files.
- Implementation runs in sequential rounds (capped: one live sub-agent); the orchestrator commits after every round,
  before the next spawn. Round 1 = T1–T3 (C1–C3), round 2 = T4–T7 (C4), round 3 = T8–T13 + SB-62 (C5),
  round 4 = T14–T15 (C6). T16 (docs, C7) goes to the Docs stage. T17 is the orchestrator's final verification.
- Resource fence: MemoryMax=4G, NODE_OPTIONS=--max-old-space-size=3072, --slice=heavy.slice, one heavy command at a time.
- Database: the orchestrator's throwaway container `tdp-0-4b-exec` on 127.0.0.1:5532 (migrated; databases `tdp`,
  `tdp_test`, `tdp_shadow`). api-server suite: `SHADOW_DATABASE_URL=postgres://postgres:postgres@localhost:5532/tdp_shadow
task --dir /home/maksym/projects/contrib/the-discipline-program test:api TDP_DB_PORT=5532` (baseline at b336f02fa:
  199 files / 2486 tests green, 153.8 s). Single file: `DATABASE_URL=postgres://postgres:postgres@localhost:5532/tdp_test
pnpm -C /home/maksym/projects/contrib/the-discipline-program --filter @repo/api-server exec vitest run <file>`.
  Never touch `tdp-platform-db` (5432) or any other container.

## Rulings

- PG-1 accepted: the section-editor typing patch is a granted fence extension (typing only, no runtime change).
- PG-2 accepted: SB-61 rides; keep the type tests that go red on regression.
- PG-3 accepted: eleven defaulted keys, `offer:seo` included.
- PG-4 wording, FINAL:
  - `site:navigation.offer` = "Public Offer"
  - `site:navigation.languageSwitchLabel` = "Change language"
  - `offer:seo.title` = "Public Offer — The Discipline Program" (U+2014)
  - `offer:seo.description` = "Seller details and the terms of buying a training program from The Discipline Program."
    (CHANGED from design.md)
- PG-5 accepted with ONE wording change: `site:navigation.navigationLabel` defaults to "Main" (NOT "Marketing").
  `errorGlyph` "Error", `errorIdLabel` "Error ID:" as proposed. "Program is required" stays unmodelled.
- PG-6 accepted (productPrefix "You're getting:", rightsLabel "All rights reserved.", the no-edge-whitespace test).
- PG-7 a–d accepted as proposed.
- PG-8 accepted: `type: z.literal("layout").optional()`; a public page revalidates by its concrete path with no type.
  ADR-0046's revalidation paragraph must state the reason (the route-template tag versus the concrete path after the
  0.4f `[locale]` segment), since code carries no comments.
- PG-9 accepted: `parseQuery` per SB-51's disposition. ONLY call sites inside the fence move to it:
  `auth-factories.ts`, `apps/admin/src/app/api/admin/pages/**` routes, `apps/marketing/src/app/api/public/pages/**` and
  `apps/marketing/src/app/api/revalidate/**`. Any other `Object.fromEntries(new URL(request.url).searchParams…)` call
  site outside the fence stays as it is and is LISTED (file:line) in the round report, never edited.
- PG-10 accepted as stated.
- PG-11 accepted; the PR checklist line becomes: "the six pages answer with seo: null, or with the English default for
  a page already opened in the admin".
- PG-12 carry-forward (the planner opens the ledger row). ADR-0046 states the consequence, not a law: a new chrome string
  arrives as a new `site:*` section so its English default reaches production through the same scaffold; a field added
  to an already-scaffolded section would need a backfill of the default-locale rows, which no step does yet.
- PG-13 accepted, INCLUDING a disabled-locale case in `public.offer.test.ts` (NotFoundError before any page query, like
  the unknown case).
- PG-14 OVERRIDDEN — SB-62 rides in this step:
  - `packages/api-server/src/endpoints/cms/pages/public.ts` parses a stored section with `.deepPartial()` like every
    other surface (the one `.partial()` line in `extractSectionDataOrNull`, ~:43).
  - One test pins it: a `uk` `offer:requisites` row whose item lacks `value` is served from the uk row with the partial
    item — no fallback to English, no Sentry warning; the English case alongside.
  - Audit (REPORT item, no code change): list every marketing component that reads a nested list item of a CMS section
    and whether it tolerates an undefined nested field at runtime. Marketing components stay untouched; findings go to
    the PR-open report for 0.4f.
  - A fourth mutant may be named in the PR body only if it reads naturally; three is the requirement.
- PG-15: the planner's, after the merge.

One-line rationale per ruling:

- PG-1: typing only, no runtime change; the editor must compile against the 35-key catalog.
- PG-2: SB-61 was verified real at research; the contracts half of its fix belongs where the section variants are reshaped (`sectionVariant` typed per key); the admin call sites follow in 0.4d.
- PG-3: `offer:seo` is search text the planner owns, not the coach's requisites.
- PG-4: new user-facing copy is the planner's call at the gate, listed for the owner's veto; the owner has seen the strings.
- PG-5: "Main" names the landmark without the word "Marketing"; the error glyph and the error-id label are chrome strings and belong to the model; "Program is required" guards a hidden field and stays API validation.
- PG-6: as proposed; the no-edge-whitespace test keeps the defaults clean.
- PG-7: a gate must be able to fail; the four rescoped gates prove the move.
- PG-8: `revalidatePath(path, "page")` targets the route template, which goes silent for `/{code}/...` once 0.4f adds `[locale]`; the concrete path is right today and after 0.4f.
- PG-9: `parseQuery` is SB-51's disposition (RF-17 of 0.4a); the fence bounds the sweep.
- PG-10: as stated.
- PG-11: the scaffold writes the English defaults when a page is opened in the admin, so a smoke after the merge may legitimately see them.
- PG-12: a backfill for already-scaffolded sections is a new mechanism; a ledger row (SB-65), not this step.
- PG-13: a disabled locale must 404 before any page query, exactly as an unknown one does.
- PG-14: 0.4d's forms will write partial nested items; serving them as English with a Sentry warning per request is the wrong behaviour to ship first, and the switch is one line plus one test.
- PG-15: the ledger is the planner's, after the merge.

## Facts established since the step prompt was written

- SB-51: `packages/api-routes/src/auth-factories.ts` used `paramsSchema.parse`, `querySchema.parse` and `requestSchema.parse`, so the prompt's `schema\.parse\(` gate was case-sensitive and vacuous; the real gate is PG-7(a) below. `responseSchema.parse` stays: it validates server output and a failure there is a real 500.
- SB-49: `packages/api-server/src/endpoints/cms/pages/__fixtures__/marketing-pages-state.test.ts` and `admin.test.ts` (`readStoredSeo`) read `seoTitle` / `seoDesc` and had to change with the metadata removal; C5 did that. Verify.
- The query-parse call sites outside the fence that PG-9 leaves untouched were found at `packages/api-routes/src/route-helpers.ts` (`createMultiToggleHandler`) and `packages/api-server/src/endpoints/mobile-compat/wire-handlers.ts`; re-verify the exact lines at the final HEAD and list them in the report, never edit them.
- Every other "live-verified fact" of the step prompt held on `main` at `b336f02fa`.

## Superseded lines (this file wins)

- The step prompt's "Capped run" bullet and the gate ruling's "capped: one live sub-agent" clause: this run is STOCK (below).
- The resource fence of the step prompt (`MemoryMax=4G`, heap 3072, `--concurrency=2`) and of the gate ruling (`MemoryMax=4G`, heap 3072): the budget below (`MemoryMax=3G`, heap 2048, `--concurrency=1`) applies to every command of this run, the perf scripts included.
- The gate ruling's container `tdp-0-4b-exec` on 5532 no longer exists; you create your own (below). Its baseline numbers stand as the api-server suite's reference.
- The step prompt's "STOP at review-flow's triage gate" and "end your turn with a one-line interim report ... the planner resumes you": nothing resumes a Codex leg. The flow's triage is the ruling, applied at once in one fix pass; you stay in your turn on `wait_agent` until every helper has reported, and your final message ends the run.
- The step prompt's "Branch ... from `main`": the branch exists; do not create, rename or rebase it.
- Any mention of `tdp-platform-db`, `prod_snap` or a Neon URL as something to use: not yours, never.

## How this run proceeds

### Stage 4 - pre-flight and resume

- The tree is on the step branch and clean; the base branch for every diff and for the PR is `main`. Do not stash, branch or rename. Take the lock as the skill says.
- `tasks.md` is the resume record: T1-T15 are COMPLETED and every checkpoint commit resolves, so none of them is re-run; T16 (the documents, C7) is the Docs agent's in Stage 7-8 per the gate ruling; T17 is Stage 9.
- The compliance pass, read-only first: read `git diff main...HEAD` in full against the rulings above and the step prompt's "Rulings this step is built on". Where the committed code contradicts a ruling or the request, the correction is an implementation task of this run (a `pipeline-worker` implement agent, or yourself for a line-sized change; a checkpoint commit with a typed subject that names the change). A contradiction that cannot be corrected without a design change is a structural deviation: stop and report `blocked` with the facts. Nothing is known to be wrong; the previous executor's checkpoint reports claimed every ruling applied. Verify, do not assume.
- No UI visual check: nothing visible changes.

### Stage 5-6 - review-flow at deep, round one of two

- Run the flow as the skill says: fresh lenses, refuters and breaker as `pipeline-worker` agents, the sweep, the synthesis into `.feature-dev/1792839110/review.md`, the triage, then exactly one fix pass. Caller context for the flow: this file (the request and the rulings), `research.md` (its backwards-compatibility surface is the correctness lens's checklist), `design.md`, and the battery commands below.
- The interrupted round: `review-state.md` holds 17 deduped candidates (RF-1 to RF-17) and three breaker gaps (G2 to G4), each with a refutation status and a DRAFT bucket that was never applied. Treat it as a prior finder's output, never as a ruling. The three lenses run WITHOUT it (they read the code; independence is the point). After the Phase 1 dedupe, merge its candidates into the pool (same file:line and defect = one finding; keep the stronger evidence). Every pooled candidate that would trigger a code change goes to a refuter of this run; the earlier CONFIRMED / REFUTED verdicts and the DRAFT buckets are not inherited, though a refuter may re-run the probes recorded under `evidence/refuter-*/` and `evidence/breaker/` instead of inventing new ones. The breaker runs fresh and may reuse the recorded mutants as attacks. Report the counts of both sources before any cap. Keep the RF numbers of `review-state.md` for the candidates that survive the dedupe and number new findings from RF-18, so the planner can map the two rounds.
- Two candidates are the planner's, not yours: RF-3's production check (no `api` / `faq` row in `marketing_locales`) and RF-4's production check (partial nested items in existing section rows) are production READS the planner runs before the merge on the owner's word. This run reads no remote database. Say so in the triage rationale when you bucket them.
- The triage is the ruling: apply exactly the fix-now set in one pass (a typed checkpoint subject naming the change: `test: ...` when only tests changed, `fix: ...` or `refactor: ...` for code), run type-check, lint and the affected tests before the commit, and never re-review the fix diff. A finding whose fix would add a mechanism is never fix-now.

### Stage 7-8 - Test and Docs, one message, two agents

- Test agent: the regression tests of the fix-now set (every confirmed breakage that got fixed becomes a test), the plan's acceptance criteria not yet covered (`plan.md` Test Strategy; T7, T12 and T13 already wrote the planned tests, so fill gaps and do not duplicate), the design's edge cases. `research.md` names the conventions and the commands.
- Docs agent: plan task T16 (C7). `docs/adr/0046-chrome-and-seo-as-cms-sections.md` (0046 is free; follow `docs/adr/_template.md`; the revalidation paragraph PG-8 requires and the consequence paragraph PG-12 requires; the retired columns named, per PG-7(c); add the ADR to `docs/adr/README.md` if that index lists the others) and `docs/BOUNDED-CONTEXTS.md` section 2 as the request's Deliverable 4 says. The repository has no CHANGELOG; do not create one.
- The marketing-component audit of PG-14 is a REPORT item: list every marketing component that reads a nested list item of a CMS section and whether it tolerates an undefined nested field at runtime. No marketing file changes.
- Two checkpoint commits, `test:` then `docs:`, as the skill says.

### Stage 9 - finalize

- The battery at the FINAL HEAD, inside the fence, one heavy command at a time: `pnpm --filter @repo/contracts test`; `pnpm --filter @repo/api-routes test`; `task test:api TDP_DB_PORT=5532` (serial, against your container, `SHADOW_DATABASE_URL` pointing at your container's `tdp_shadow`); the `admin` and `platform` vitest projects with `--maxWorkers=2`; `pnpm check-types`, `pnpm lint`, `pnpm dep:check`, `pnpm format:check` (turbo tasks with `--concurrency=1`); the admin and the marketing builds, one at a time, with `NODE_OPTIONS=--max-old-space-size=2048`; the prisma drift check against your container (no drift except the `citext` line); the grep gates below; the three mutants.
- The perf "after" capture: repeat the captures of `perf-baseline.md` with the same scripts (`evidence/perf/perf-run.sh`, `perf-data.sh`, the tsx scripts), which pin the container name `tdp-0-4b-exec` and the URL `postgres://postgres:postgres@localhost:5532/tdp`. Name your container so, recreate the harness working directory in your own scratch space (your copy of `perf-env.sh` sets `W=` to it and its `run_tsx` fence line to the budget below), store the "after" files beside the "before" files under `evidence/perf/`, and put the delta in the report, per the baseline's "What the after run adds".
- Push the branch and open the PR through the `pr` skill (pipeline mode: head and base fixed, no branch question). Body per `~/.claude/skills/_shared/pr-template.md`, inside its budget, with the checklist below AS CHECKBOXES; the three mutants named in one plain sentence; nothing about the run.
- Remove your container when the PR is open. Report, with the tree state.

## Scope fence (from the step prompt, verbatim)

- **Touch:** `packages/contracts/src/entities/cms/pages/**`;
  `packages/api-server/prisma/schema.prisma` (the two `@ignore` lines only);
  `packages/api-server/src/endpoints/cms/pages/**`;
  `apps/admin/src/app/api/admin/pages/**`;
  `apps/admin/src/modules/pages/components/section-editor/index.tsx` (`SECTION_LABELS` only);
  `apps/marketing/src/app/api/{public/pages/**,revalidate/**}`;
  `packages/api-routes/src/auth-factories.ts` and its tests (SB-51);
  the five contract test files of SB-52;
  `packages/contracts/src/entities/cms/locale/{locale.constants.ts,locale.schema.ts,locale.schema.test.ts}` (SB-54);
  `docs/adr/0046-*.md`; `docs/BOUNDED-CONTEXTS.md`.
- **Do NOT touch:** every other file under `apps/admin/src/{modules,lib,app}`,
  `apps/marketing/src/{modules,lib,app}` except the two route folders above
  (`PAGE_SEO`, `SEO_CONFIG`, the layout, the chrome components and `sitemap.ts` wait for
  0.4f and 0.4g), `apps/platform/**`, `packages/{ui,mui,shared,query,api-client,env}/**`,
  `endpoints/cms/{blog,contact,dashboard,locale,product,review}/**`, `endpoints/{billing,lms,iam,coaching,mobile-compat,ops,storage}/**`,
  `prisma/migrations/**` (no migration in this step), `prisma/seed/**`, `src/authz/**`,
  `src/db/**`, `.github/**`, lockfiles, `initiatives/**`, `CLAUDE.md`,
  `docker-compose.yml`, `taskfile.dist.yml`, any `.env*` file. No new dependency, no new
  api-server export subpath, no change to the locale module.
- **Not in this step:** the admin forms for the new sections and the Languages page
  (0.4d); product translations and the photo (0.4c); the marketing chrome reading the
  `site` sections, `generateMetadata` reading `seo`, the `[locale]` routing (0.4f); the
  offer page route, the footer and dialog entries, the sitemap (0.4g); real requisites
  (SB-4, the coach types them in 0.4d).
- **Secrets.** Never read `apps/*/.env.local`, `packages/api-server/.env` or any `.env*`;
  never print an env value; the shared stack and `prod_snap` are not yours.

Granted extensions, adjudicated at the gate (the round-two reviewer is told the same): PG-1, the typing patch in `apps/admin/src/modules/pages/components/section-editor/index.tsx` beyond `SECTION_LABELS` (typing only); PG-9, `parseQuery` in `packages/api-routes/src/route-helpers.ts` and the package barrel, consumed only by the fenced call sites; PG-14, `.deepPartial()` in `packages/api-server/src/endpoints/cms/pages/public.ts` (inside the fence already) with its one test. Out-of-fence query-parse call sites are listed in the report, never edited.

## Sacred (charter, verbatim)

The iOS wire contract · prod data additive-only (this step changes no table, no column
and no row on production; `@ignore` hides two columns from the client and nothing else) ·
athlete navigation stays free · dep-cruiser context rules (CMS contracts import no LMS,
Coaching or Billing contract; `apps/marketing` reaches CMS endpoints only; the platform
never imports CMS contracts for billing) · migrations through `prisma migrate` +
`db-migrate`, expand before contract (D-18).

## Acceptance gates (verify yourself before the PR)

- `pnpm --filter @repo/contracts test`, `pnpm --filter @repo/api-routes test` green; `task test:api TDP_DB_PORT=5532` green in your throwaway container; the `admin` and `platform` vitest projects green (fenced): they must not even notice the change.
- `pnpm check-types`, `pnpm lint`, `pnpm dep:check`, `pnpm format:check` clean; the admin and marketing apps build (fenced, `NODE_OPTIONS=--max-old-space-size=2048`, one at a time). The marketing build's `blog_fetch_failed` warning from the sitemap is pre-existing on `main` and not a signal.
- `prisma migrate diff --from-migrations ... --to-schema-datamodel ...` against your container reports no drift except the `citext` line (the `@ignore` columns stay in the database).
- Grep gates, as rescoped by PG-7: (a) `(params|query|request)Schema\.parse\(` has no hit in `packages/api-routes/src/auth-factories.ts` and `responseSchema\.parse\(` has exactly its pre-step count there (nine on `main`); (b) `updatePageMetadata|UpdatePageMetadataInput|updatePageMetadataSchema` has no hit under `apps`, `packages` and `docs` (`initiatives/` keeps history); (c) `seoTitle|seoDesc` hits only in `packages/api-server/prisma/schema.prisma`, `packages/api-server/prisma/migrations/`, `docs/adr/0021-architectural-risks-six-month-horizon.md` and `docs/adr/0046-chrome-and-seo-as-cms-sections.md`; (d) every multi-word string of `SECTION_DEFAULTS` appears as a fixed string in no `*.ts` / `*.tsx` under `packages/` except `section-defaults.ts`, `packages/ui/src/components/error-pages/` and `packages/contracts/src/entities/cms/contact/contact.schema.ts` (single words excluded as non-diagnostic). Also: `PAGE_SLUG_PATH_MAP\[` indexes only with a `PublicPageSlug`; `%p` has no hit in `packages/contracts/src/**/*.test.ts`.
- Every new test shown to fail under at least one mutant; three named in the PR body in one plain sentence: a scaffold that writes the defaults for every locale, a `site` read that skips the locale guard, a `seo` pick that ignores the English fallback (a fourth only if it reads naturally).
- The PR contains no file under `initiatives/`, no `CLAUDE.md`, nothing under `.feature-dev/`.
- PR body per the PR-body law, opened through the `pr` skill, with the checklist AS CHECKBOXES. No browser gate (nothing visible changed on the site; the admin shows two new rows with empty editors). The checklist carries exactly:
  - [ ] planner: production smoke after the merge: `/api/public/pages/site` and `/api/public/pages/offer` answer 200 with `null` sections; the six pages answer with `seo: null`, or with the English default for a page already opened in the admin; the admin Pages list shows Site and Offer
  - [ ] the offer's requisites and terms are typed by the coach in the admin (0.4d), never seeded

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any committed file; synthetic fixtures only; no real requisites anywhere.
- No comments in code; delete comments in regions you edit. No AI attribution, signature or trailer anywhere: not in commits, not in the PR, not in code (the owner's rule overrides any harness reminder).
- Commitlint: lowercase conventional subject at most 100 characters, body lines at most 100 characters, long bodies through `git commit -F <file>`; never `--no-verify`; no Cyrillic in any command that contains `git commit` or `gh pr`, nor in the files behind `-F` / `--body-file`. The hook `pr-guardrails.sh` scans the WHOLE command once it contains `gh pr create` or `gh pr edit`: never quote those phrases in any other command (a heredoc that saves a report, a grep).
- The pre-commit hook runs check-secrets and lint-staged; the pre-push hook runs dep:check, lint and check-types over the cone. A red hook is root-cause work; the hook's task set can be run fenced at `--concurrency=1` first so the hook replays from cache.
- One PR against `main`; the repository squash-merges; never stack this branch on another. Never merge; the merge is the owner's.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence after every subagent round; nothing of value sits uncommitted while a subagent may be alive. A sub-agent's "done" does not mean its processes died: sweep before trusting the tree.
- Databases: your own throwaway container (D-19): `docker run -d --name tdp-0-4b-exec -p 127.0.0.1:5532:5432 -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tdp -v "/home/maksym/projects/contrib/the-discipline-program/docker/db/init:/docker-entrypoint-initdb.d:ro" -m 512m postgres:17-alpine`, then `task stack:migrate TDP_DB_PORT=5532` and `task test:api TDP_DB_PORT=5532`; every prisma, tsx and test command sets `DATABASE_URL` and `SHADOW_DATABASE_URL` to your container explicitly. The shared stack `tdp-platform-db` (5432: `tdp`, `tdp_test`, `tdp_shadow`, `prod_snap`) and every other container on the host (`csapi-*`, `film-dna-db`, `tradebench-dev-db`, `s3g-route3`, `tdp-dump-verify`) are not yours. Remove your container when the PR is open.
- Never read `apps/*/.env.local`, `packages/api-server/.env`, `packages/api-server/.env.test` or any `.env*`; never print an env value or a DSN. Never connect to a remote database.
- Never start a dev server on 3000, 3001 or 3002 (3002 belongs to another project on this host); the perf harness needs only the container.
- `pkill -f <pattern>` matches the shell that runs it: kill by pid.
- Command form: never `cd` inside a compound command; absolute paths in every command that names files or globs; the repository is `/home/maksym/projects/contrib/the-discipline-program`.
- The project hook PROD-GUARD refuses `Edit` / `Write` on `prisma/migrations/`, lock files and `.github/workflows/`; nothing in this step touches them.
- `initiatives/**`, `CLAUDE.md` and `.feature-dev/**` never enter a commit.

## Resource budget (the step skill's, verbatim)

- **Hard fence:** every heavy command (`next build`, full vitest runs, the route suite, `test:coverage`) runs inside a cgroup ceiling, in the shared slice: `systemd-run --user --scope -q --slice=heavy.slice -p MemoryMax=3G -p MemorySwapMax=1G -- <cmd>`. A breach kills that command (retriable red), never the VM. If `systemd-run --user` is unavailable, say so in the report and fall back to the diet and the sequencing alone, never silently.
- **Shared ceiling:** `heavy.slice` is ONE slice for the fenced commands of every session on the host (`MemoryMax=10G` on this host today); never drop `--slice=heavy.slice`.
- **Diet inside the fence:** `NODE_OPTIONS=--max-old-space-size=2048` on build commands, set in the CALLER's environment, which a `--scope` unit inherits (never `-p Environment=...`); vitest capped at `--maxWorkers=2` where a runner takes it (`task test:api` is serial and takes no flag); turbo fan-out capped at `--concurrency=1` for multi-package tasks (two Next apps in parallel OOM under the 3G fence); throwaway DB containers at `--memory=512m`.
- **Sequencing:** heavy steps run strictly one at a time: never a build concurrently with a test run, never two agents driving heavy commands at once.

## Concurrency

STOCK: no parallel owner session shares the host. Stage fan-out as the skills allow (lenses in parallel, Test and Docs in one message); heavy COMMANDS still one at a time.

## Reporting

Your final message is the report the wrapper validates against its schema; its `report` field is the executor's PR-open report, for the planner and never for the PR body. It carries: the per-row account of the work (C1-C6 as found and verified, every commit this run added); the compliance pass's findings and corrections; the complete stage-agent roster (implement if any, review-flow lenses, refuters and breaker, fix pass, test, docs: `subagent_type` and count, or INLINE where you ran a stage yourself); round one's candidate counts before any cap from both sources (your lenses and the prior pool) alongside the reported count, the refuted count, and every finding with its bucket and rationale as the triage applied it; the PG-14 marketing-component audit; the out-of-fence query-parse call sites (file:line); the perf delta; the verification evidence (every number measured at the FINAL HEAD); every new user-facing string (the full ruled list of `SECTION_DEFAULTS` strings that are not today's code strings, plus anything new); any design-change escalation. Declare the branch, the HEAD, clean or dirty, and that your container is gone.
