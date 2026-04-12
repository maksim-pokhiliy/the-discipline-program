---
name: Big Tech audit in progress — HANDOFF ENTRY POINT
description: READ THIS FIRST when working on this project. Active architectural audit tracked in docs/BIGTECH-AUDIT.md. Includes full handoff instructions, rule references, current state, next bullet, and cleanup trigger.
type: project
originSessionId: 9ed41cfe-aab0-4c97-9449-e1bbceb2a738
---

# Handoff entry point

**This file is the single source of truth for continuing the Big Tech audit across sessions.** Read it fully before doing anything on this project. Links below are load-on-demand — follow them when you hit a decision that needs the underlying rule.

---

## What this is

A 12-section architectural audit + refactor of the project from a FAANG / M7 staff+ engineering perspective. Sections: (1) Архитектура и границы, (2) Доменная модель, (3) Безопасность, (4) Надёжность и операционка, (5) База данных и миграции, (6) API Design, (7) Архитектурные риски на 6 месяцев, (8) Monorepo дисциплина, (9) Тестирование, (10) Фронт и Next.js 16, (11) Качество кода, (12) DX и процесс.

The living document is `docs/BIGTECH-AUDIT.md` (Russian, in the project repo). It contains: the full bullet list per section, the research summary, and the Implementation plan table with commit hashes + status per bullet.

## How the work is structured — "approach C"

- **Research per section is done once**, in a single exhaustive pass through all relevant files. New findings during research are added as bullets in the file before implementation begins.
- **Implementation is one bullet = one commit.** Never bundle multiple bullets. Never split one bullet across commits without a strong reason.
- **Bullet completion ritual:** check the bullet off with `[x]`, update the Implementation plan table with the commit hash and `✅ Done`, commit. One atomic unit.
- **After closing a bullet:** present a flat bullet list of what was done, then **stop and wait for the user's explicit "ok"** before starting the next bullet. Never proceed to research or implementation of the next bullet without confirmation.
- **Stop condition for research:** "files for that section ran out", not "I have enough findings". The user is explicit about this.

## Drift check — mandatory on every session resume

**When the user asks to continue the audit, BEFORE any implementation work:**

1. **Git reality check.** Run `git log --oneline -10` + `git status`. Compare the actual HEAD, branch, and working tree state against what the handoff's "Current state" section claims. If they diverge — update the handoff first, don't start work on stale assumptions.
2. **Implementation plan vs. code.** For the next pending bullet, verify the preconditions still hold: do the files it plans to touch still exist at the expected paths? Has anything been renamed, moved, or deleted by a later commit that the handoff didn't account for? Quick `ls` / `glob` of the target paths is enough.
3. **Handoff "Current state" freshness.** If the handoff section references commit counts, module counts, or gate results — spot-check at least one (e.g., `git rev-list --count origin/main..HEAD` for commit count). Stale numbers erode trust in the whole handoff.
4. **Report drift, then proceed.** If drift is found: fix the handoff/BIGTECH-AUDIT.md entries before starting the next bullet. If no drift: state "drift check clean" and proceed.

**Why:** Sessions start cold. The handoff is written by the previous session's model, which may have made assumptions that didn't survive (revert, interactive rebase, manual edits between sessions). Catching drift early is cheap; building on a wrong assumption wastes a full bullet cycle.

## Current state — 2026-04-12 (sections 1–3 complete, next is §4 Надёжность и операционка)

**Branch:** `refactor/design-system-typography-hero` (161 commits ahead of `origin/`, working tree clean)
**Last commit:** `a042910 docs(audit): close section 3, record all commit hashes in implementation plan`
**Gates at hand-off time:** `pnpm check-types` ✓ (14/14), `pnpm lint` ✓ (14/14), `pnpm test` ✓ (236/236).

### Section 1 (Архитектура и границы) — CLOSED

All subsections 1.1–1.6 done. Key deliverables:

- ADR framework (0001–0014) + backfill of 13 implicit decisions
- Bounded contexts documented + contracts/api-server reorganized by context
- Dependency-cruiser with 17+ boundary rules, CI pipeline, dep graph artifact
- Infrastructure ports (storage live, email/cache/queue/payment scaffolded)
- Security headers, health endpoints, deploy docs, `.env.example`
- Admin proxy (ADMIN role check), platform proxy (role-based route protection)
- Package.json hygiene (dual-instance fix, wildcard exports, version alignment)

### Section 2 (Доменная модель) — CLOSED

Implementation plan: 2.1.A–2.6.D done (2.4.A deferred — no consumers). Key deliverables:

- Domain invariants documented in BOUNDED-CONTEXTS.md §8 (14 DB + 4 app-level)
- Ubiquitous language glossary (§12, 17 terms, "Program" banned as code term)
- Money VO: `moneySchema` + `Money` type in contracts, utility functions in shared
- Anti-pattern: "No behavior in `@repo/contracts`" added to CLAUDE.md
- Magic number extracted (`ADHERENCE_ON_TRACK_THRESHOLD`)
- UI concerns removed from domain (hrefs, form-field mapping)
- ADRs 0015–0017: archived inconsistency, plain text workouts, anemic domain

### Section 3 (Безопасность) — CLOSED

Implementation plan: 3.1.A–3.5.A done (12 commits). Key deliverables:

- Timing attack fix: dummy bcrypt compare on nonexistent user
- Email normalization (`.toLowerCase().trim()`) in login
- Password policy: MIN 12, MAX 128, bcrypt cost unified to 12
- Env secret validation: `NEXTAUTH_SECRET` / `BLOB_READ_WRITE_TOKEN` → `.min(32)`, `DATABASE_URL` → postgres-only
- Seed prod guard (`NODE_ENV === "production"` throws) + plaintext credentials removed
- Image URL validation: shared `imageUrlSchema = z.string().url().nullable()` across 9 fields in 6 schema files
- Timezone IANA validation via `Intl.supportedValuesOf("timeZone")`
- Upload filename collision fix: `Date.now()` → `crypto.randomUUID()`
- StructuredData XSS fix: `</script>` escaping in ld+json
- Error log redaction: `redactSensitiveFields()` strips password/token/secret/authorization/cookie from logs
- ADR 0018: 6 deferred security decisions with concrete triggers (auth strategy, session/revocation, rate limiting, CSP nonce, authz policy layer, PII classification)
- Stale comments removed from proxy files + contracts barrel

**Known issue from §3:** `contracts/src/common.ts` and `contracts/src/common/` directory coexist (file shadows directory for bare `../../../common` imports). `common.ts` contains `idParamSchema` + `planIdParamSchema` duplicated in `common/params.ts`. Needs cleanup — delete `common.ts`, update imports from `../../../common` to `../../../common/params`. Low priority, no runtime impact.

### Next up: Section 4 (Надёжность и операционка)

Status in audit doc: "Не начато". ~17 bullets already written from initial research. Several cross-referenced from §1 work (health endpoints done in 1.5.B). Research pass needed to validate existing bullets against current code and find new issues.

### Operational notes

- `.github/workflows/ci.yml` hasn't run on GitHub yet — branch unpushed.
- **Known flaky test (local only):** Neon cold-start timeout ~1 in 4 commits. Always retry once. CI uses local postgres container (no Neon dep). File as §9 bullet.
- **Next.js 16 uses `proxy.ts` not `middleware.ts`** — both admin and platform already have correct `proxy.ts` files.
- `dep-graph.mjs` fixed for Windows (`execSync` with quoted collapse pattern instead of `execFileSync` which fails on cmd.exe special chars).
- `taskfile.dist.yml` updated with `dep:check` and `dep:graph` tasks.

**Section 1 (Архитектура и границы):** in progress.

- ✅ 1.1.A — ADR framework (`docs/adr/README.md`, `_template.md`, meta-ADR 0001). Commit `53b5ebe`.
- ✅ 1.1.B — 13 backfilled ADRs (0002–0014) for existing implicit decisions. Commit `ace64ca`.
- ✅ 1.2.A — `docs/BOUNDED-CONTEXTS.md` written. Commit `f107e0a`. Documents CMS / LMS / Coaching / IAM / Billing with aggregates, invariants, dependency-direction graph, current-vs-target file layout, the shared `Product` CMS/Billing split rule, cross-context invariants table, and de-facto non-leak verification.
- ✅ 1.2.B — contracts entities reorganized into 5 context subfolders + subpath exports. Commit `11fd9cc`. Moves 21 entity folders under `cms/`, `lms/`, `coaching/`, `iam/`, and an empty `billing/` placeholder. `packages/contracts/package.json` now exposes `@repo/contracts/<context>/<entity>` subpath exports. All ~246 consumer import sites updated via bulk sed. Two pre-existing cross-context leaks (LMS→Coaching via `plan-enrollment.schema.ts` HealthStatus import; IAM→Coaching via `user.schema.ts` adminUserSchema nesting profile schemas) documented as new bullets in `docs/BIGTECH-AUDIT.md` §1.2 — **must be fixed before 1.3.A (dependency-cruiser)** or the boundary check fails immediately.
- ✅ 1.2.C — endpoints reorganized by context + authz split + context-util sweep. Commit `d4cfb03`. Moves 32 endpoint files into `endpoints/{cms,lms,coaching,iam,billing}/`, eliminates admin/marketing duplication, renames pluralized files to singular. Guards extracted to new top-level `packages/api-server/src/authz/guards.ts` (cross-cutting, not per-context, prevents LMS→Coaching file-level leak). Context-specific utils swept out of `utils/`: `dashboard-computations*` + `enrollment-query.ts` → coaching/; `page-sections.ts` → cms/pages/; `toggle-exclusive-featured.ts` → cms/. `services/` directory removed; `auth.ts` → `iam/auth-service.ts`. Consumer apps untouched (symbol names preserved — rename is filed as new bullet 1.2.F). Three new audit bullets filed during 1.2.C: **1.2.E** (mappers reorg), **1.2.F** (api-server symbol rename to context/role convention, 24 symbols × 56 consumer files), **1.2.G** (extract blog reads from `cms/pages/public.ts` into new `cms/blog/public.ts`).
- ✅ 1.2.D — api-server subpath exports + root barrel removed. Commit `7f233fa`. `packages/api-server/package.json` now exposes 4 context subpaths (`./cms`, `./lms`, `./coaching`, `./iam`) — each points at `src/endpoints/<context>/index.ts`. `main`/`types` dropped; no root `.` export; `src/index.ts` and `src/endpoints/index.ts` deleted. All 56 consumer files migrated (cms: 22, lms: 20, coaching: 8, iam: 6). Billing and authz intentionally omitted.
- ✅ 1.2.F — api-server public symbol rename to context/role convention. Commit `59c4497`. 26 symbols renamed domain-first: `adminBlogApi` → `cmsBlogAdminApi`, `marketingProductsApi` → `cmsProductPublicApi`, `platformTrainingPlansApi` → `lmsTrainingPlanApi`, `platformCoachDashboardApi` → `coachingCoachDashboardApi`, `authService` → `iamAuthService`, etc. 93 files total.
- ✅ 1.2.E — mappers reorg + enum-maps split. Commit `74da02e`. `packages/api-server/src/mappers/` reorganized from flat 18-file layout into 4 context subdirs (`cms/`, `lms/`, `coaching/`, `iam/`). `enum-maps.ts` split into 4 per-context files. `enum-maps.test.ts` split into 4 per-context test files each with local symmetry check (total tests: 219 → 222, +3 extra symmetry tests). Root `mappers/index.ts` barrel deleted. Per-context `index.ts` barrels re-export both mapper functions and enum-maps. ~20 consumer files updated to use `../../mappers/<context>`. Four coaching endpoints now have explicit dual-context imports (coaching + lms) because they aggregate cross-context data. During the split, `mapToAthleteProfile` and `mapToCoachProfile` were extracted from `iam/user.mapper.ts` into `coaching/athlete-profile.mapper.ts` and `coaching/coach-profile.mapper.ts` — they belong to coaching domain-wise. Mapper-level manifestations of schema leaks 98/99 documented in those bullets and left as explicit cross-context imports; both will close together with the schema-level fixes. Known flaky test missed-test count consistency: first test run showed 2 failed, retry showed all 222 passed.
- ✅ 1.2.G — cms blog public extraction. Commit `d04f246`. Created `packages/api-server/src/endpoints/cms/blog/public.ts` exposing `cmsBlogPublicApi` with `listPublished()` (returns `PublicBlogPost[]` — published posts ordered by `publishedAt desc`, filtered via `isPublishedPost`) and `getArticle(slug)` (returns `BlogPostPageData` with post + related posts + labels/title read from `marketingPageSection` for blog page slug). `cmsPagesPublicApi.getBlogPage` now delegates the post list to `cmsBlogPublicApi.listPublished()`, still reads its own page sections. `cmsPagesPublicApi.getBlogArticle` deleted — moved wholesale into `cmsBlogPublicApi.getArticle`. `endpoints/cms/index.ts` barrel augmented with `export * from "./blog/public"`. Marketing route `apps/marketing/src/app/api/public/blog/[articleSlug]/route.ts` switched from `cmsPagesPublicApi.getBlogArticle` to `cmsBlogPublicApi.getArticle`. Blog now has admin+public symmetry matching product/review/contact/pages. New finding filed as 1.2.H (marketing client mirror) during this work.
- ✅ 1.2.H — marketing client api mirror. Commit `177edcf`. Created `apps/marketing/src/lib/api/endpoints/blog.ts` with `createBlogAPI` factory exposing `getArticle(slug): Promise<BlogPostPageData>` against `/api/public/blog/${slug}`. Dropped `getBlogArticle` + the `BlogPostPageData` contract import from `apps/marketing/src/lib/api/endpoints/pages.ts` — `api.pages.getBlog()` (blog landing page, returns `BlogPageData`) remains, it's page-level not article. `endpoints/index.ts` re-sorted alphabetically and gained `export { createBlogAPI } from "./blog"`. `apps/marketing/src/lib/api/factory.ts` registers `blog: endpoints.createBlogAPI(client)` in the root composer (alphabetical ordering: blog/contact/pages). Two consumers updated: `apps/marketing/src/lib/hooks/use-blog.ts` (`api.pages.getBlogArticle` → `api.blog.getArticle`) and `apps/marketing/src/app/blog/[slug]/page.tsx` (`serverApi.pages.getBlogArticle` → `serverApi.blog.getArticle`). Zero test surface — pure rewire. Client layer now matches server layer's domain split.
- ✅ 1.2.I — LMS→Coaching plan-enrollment leak fix (was research-only bullet 98, now scheduled). Commit `6b9628b`. **CQRS-lite split applied.** LMS `planEnrollmentSchema` is now pure: `{ id, trainingPlanId, userId, startDate, endDate, status, createdAt }` — no user object, no health. New coaching entity `packages/contracts/src/entities/coaching/plan-roster/` with `planRosterEntrySchema = planEnrollmentSchema.extend({ user: planRosterUserSchema })` where `planRosterUserSchema` includes id/name/email/image + healthStatus. Direction: Coaching→LMS (allowed, already precedented in `coach-athletes-api.schema.ts`). New contracts subpath export `@repo/contracts/coaching/plan-roster`. **Endpoint split:** `lmsPlanEnrollmentApi` reduced to `create`/`update`/`delete` only (returns pure `PlanEnrollment`); new `coachingPlanRosterApi.list()` / `.getById()` lives at `endpoints/coaching/plan-roster.ts` and returns enriched `PlanRosterEntry`. Both still use shared `resolveCoachId` + `verifyPlanOwnership` from `authz/guards`. **Mapper-level leak closed in same commit:** `mappers/lms/plan-enrollment.mapper.ts` no longer imports anything from coaching — pure mapper returning pure shape. New `mappers/coaching/plan-roster.mapper.ts` holds `mapToPlanRosterEntry`, which reuses `mapToPlanEnrollment` from the LMS mapper (coaching→lms — established 1.2.E pattern for cross-context aggregations). **Route handlers:** `apps/platform/.../enrollments/route.ts` GET → coachingPlanRosterApi, POST → lmsPlanEnrollmentApi (pure response); `enrollments/[enrollmentId]/route.ts` GET → coaching, PUT/DELETE → lms. **UI:** `enrollment-card.tsx`, `enroll-athlete-dialog.tsx`, `use-plan-enrollments.ts` (`useOptimisticMutation<PlanRosterEntry[], ...>`), `lib/api/endpoints/plan-enrollments.ts` (getAll returns `PlanRosterEntry[]`) all switched to `PlanRosterEntry`. `useBulkEnrollAthletes` keeps `PromiseFulfilledResult<PlanEnrollment>` — pure shape correctly typed. UI runtime change: zero (mutation responses were never displayed, only invalidate-and-refetch). 23 files changed. Gates green on first run.
- ✅ 1.2.J — IAM→Coaching admin-user leak fix (was research-only bullet 99, now scheduled). Commit `a05b36f`. **Same CQRS-lite split as 1.2.I, mirrored for IAM→Coaching.** IAM now owns pure `userSchema` (id, email, name, role, image, timezone, emailVerified, createdAt, updatedAt — no profile relations). New coaching entity `packages/contracts/src/entities/coaching/admin-user-view/` with `adminUserViewSchema = userSchema.extend({ athleteProfile, coachProfile })`. Direction Coaching→IAM is explicitly allowed by `BOUNDED-CONTEXTS.md §8`. New subpath export `@repo/contracts/coaching/admin-user-view`. **Endpoint split:** `iamUserAdminApi` reduced to `getAll`/`getPageData`/`updateRole` (the latter now returns pure `User` via new `mapToUser`, no profiles include). New `coachingAdminUserViewApi.getById` returns enriched `AdminUserView`. **Mapper-level leak closed:** `mappers/iam/user.mapper.ts` is now fully pure (only `mapToUser` + `mapToAdminUserListItem`, zero coaching imports). New `mappers/coaching/admin-user-view.mapper.ts` holds `mapToAdminUserView` and reuses `mapToUser` cross-context. **Route handler:** `apps/admin/.../users/[id]/route.ts` GET → coachingAdminUserViewApi, PUT → iamUserAdminApi.updateRole. **UI:** `lib/api/endpoints/users.ts` (`getById: Promise<AdminUserView>`, `updateRole: Promise<void>`); `lib/hooks/use-users.ts` rewritten manually because `createCrudHooks` requires `update` to return the same `TEntity` as `getById`, which no longer holds. The hooks pattern works fine: mutation success → invalidate detail query → next read returns enriched view. Three components (`profile-card`, `user-detail-section`, `user-detail-view`) switched type imports. **Test split:** `mapToAdminUser` describe block moved 1:1 to new `mappers/coaching/admin-user-view.mapper.test.ts` (renamed to `mapToAdminUserView`); test helpers duplicated. New `describe("mapToUser")` added to iam test file with 5 tests. `mapToAthleteProfile` / `mapToCoachProfile` describes left in iam test file as a known 1.2.E leftover — filed as 1.2.K. **Test count:** 222 → 227 (+5 from mapToUser; mapToAdminUser → mapToAdminUserView is a 1:1 move). 25 files changed. Gates green on first run after Neon flake retry.
- ✅ 1.2.K — mapper test cleanup. Commit `0e8f2c5`. Pure file split: new `mappers/coaching/athlete-profile.mapper.test.ts` (9 tests, local `makeAthleteProfile` helper) and `mappers/coaching/coach-profile.mapper.test.ts` (3 tests, local `makeCoachProfile` helper). `mappers/iam/user.mapper.test.ts` stripped to iam-only: dropped coaching mapper imports, contract imports for `Gender`/`HealthStatus`, Prisma enum type imports, `Decimal`, helper functions, and both coaching describes. Also simplified the exclusion tests in `mapToUser` and `mapToAdminUserListItem` to not inject profile-object overrides — `PrismaUser` type has no profile relations structurally, so `not.toHaveProperty("athleteProfile")` assertions remain valid without needing to force-stuff profile data into the input. Test count stable at 227 (22 test files now, was 20). Zero coverage change, zero runtime change.
- ✅ 1.3.A — dependency-cruiser boundary rules. Commit `c7631a7`. Added `dependency-cruiser@^16.10.0` as root devDep. New `.dependency-cruiser.cjs` at repo root with **17 forbidden rules** (all `severity: error`) encoding `BOUNDED-CONTEXTS.md §8`: `no-circular`, `contracts-no-prisma`, `contracts-iam-is-leaf`, `contracts-lms-no-coaching`, `contracts-cms-no-lms-coaching-billing`, `contracts-billing-no-cms-coaching`, `api-server-iam-is-leaf`, `api-server-lms-no-coaching`, `api-server-cms-no-lms-coaching`, `prisma-only-in-api-server`, `ui-no-backend`, `api-routes-no-api-server`, `shared-packages-no-prisma`, `marketing-only-cms-backend`, `admin-no-lms`, `admin-coaching-only-via-user-detail-route`, `platform-no-cms-billing`. **authz exemption** is implicit: api-server-level rules scope `from.path` to `(endpoints|mappers)/*`, so `authz/guards.ts` (which aggregates LMS + coaching enum maps for cross-cutting policy) is naturally out of scope. **Admin→coaching carve-out is file-precise** via `from.pathNot: ^apps/admin/src/app/api/admin/users/\[id\]/route\.ts$` — admin can reach coaching ONLY from the admin-user-view route handler (1.2.J); any other admin file adding a coaching import fires the rule. Options: `enhancedResolveOptions.exportsFields: ["exports"]` for subpath export resolution, `exclude` + `doNotFollow` with `storybook-static|node_modules|dist|.next|.turbo` (storybook build output has circular bundled JS). No `tsConfig` passed — there's no root `tsconfig.json` and boundary rules work on raw file paths, not alias resolution. **First run: 0 violations across 785 modules / 1409 dependencies** — section 1.2 work holds at file-import level. Positive-path verification confirmed rules fire when deliberately violated (tested `admin-coaching-only-via-user-detail-route` and `platform-no-cms-billing`, both reverted). Wired into `lefthook.yml` **pre-push** (not pre-commit — hook takes ~4.2s end-to-end; pre-commit already has 4 parallel hooks). New root script `pnpm dep:check` = `depcruise --config .dependency-cruiser.cjs --no-progress --output-type err packages apps`. First gate that enforces BC §8 automatically — section 1.2 work is now self-preserving.
- ✅ 1.3.B — GitHub Actions CI workflow. Commit `1303ec4`. Created `.github/workflows/ci.yml` with **5 parallel lanes**: check-types, lint, dep-check, test, build. Trigger: pull_request (any branch) + push to main. Concurrency group `ci-${{ github.workflow }}-${{ github.ref }}` with `cancel-in-progress: true`. pnpm `10.32.1` + Node `20` pinned at workflow top (match root `engines.node` + `packageManager`). **Test lane uses postgres:16-alpine service container** — spin up fresh Postgres per run with healthcheck gating, set `DATABASE_URL=postgres://postgres:postgres@localhost:5432/test` + `NEXT_PUBLIC_APP_URL` + `NEXT_PUBLIC_MARKETING_URL` + `SKIP_ENV_VALIDATION=1` as env, run `pnpm --filter @repo/api-server db:push --skip-generate --accept-data-loss` before `pnpm test`. This eliminates the Neon cold-start flake that was hitting local pre-commit hooks — fresh schema per run, no shared state with dev Neon instance. **Build lane uses dummy env vars + `SKIP_ENV_VALIDATION=1`** — all Next.js pages in the repo use `export const dynamic = "force-dynamic"`, so build doesn't hit the DB, dummy values just satisfy zod URL parsing. All lanes install dependencies independently (cached via pnpm/action-setup@v4 + actions/setup-node@v4 `cache: pnpm`). Install duplication across lanes is acceptable for first CI — shared composite action + cross-job cache sharing is a polish future optimization. **Workflow has not yet run on GitHub** — branch is local, 35 commits ahead of origin. First run will happen on next push. Commitlint type `ci` was rejected; used `chore(ci): ...` for the conventional-commits subject.
- ✅ 1.3.C — dep-graph artifact. Commit `5c76b46`. Created `scripts/dep-graph.mjs` — Node helper that runs `depcruise --output-type mermaid --collapse "^(packages|apps)/[^/]+" --no-progress packages apps` and wraps the output in a markdown template with links to `BOUNDED-CONTEXTS.md §8` + `BIGTECH-AUDIT.md §1.3`. Added `pnpm dep:graph` script pointing at the helper. Generated + committed `docs/DEPENDENCY-GRAPH.md` — mermaid flowchart with 16 nodes (4 apps + 12 packages) and ~60 edges. **Collapse pattern is package-level** — 785 modules → 16 nodes for readability; file-level view still available on demand via graphviz dot. Mermaid format chosen over SVG for GitHub-native rendering, diffable text, no graphviz binary dep. Artifact is committed (not CI-regenerated) so PRs show "this edge was added" directly in the file diff. Section 1.3 fully closed: rules (A) + CI (B) + visualization (C).
- ✅ 1.4.A — storage port + vercel-blob adapter. Commit `6f9ca98`. New cross-cutting module `packages/api-server/src/infrastructure/storage/` with `port.ts` (`StoragePort` interface — `put(key, file, options?) → { url }` + `delete(url)`), `vercel-blob-adapter.ts` (the only file in the repo that imports `@vercel/blob`), and `index.ts` barrel exposing `defaultStorage = createVercelBlobAdapter()` as a module-level singleton. **Option C wiring** (chosen after Plan-agent stress-test): `endpoints/iam/upload.ts` exports ONLY the factory `createIamUploadAdminApi(storage: StoragePort)`, default instance `iamUploadAdminApi` is constructed in `endpoints/iam/index.ts` barrel with `defaultStorage` injected. Tests import the factory directly and never touch `infrastructure/storage`, so `createVercelBlobAdapter` never runs at test module load — future-proofs against S3/R2 adapters that might instantiate clients eagerly. Single consumer `apps/admin/.../upload/image/route.ts` unchanged. **Wake-up of dead code:** `createVercelBlobAdapter()` calls `void blobEnv.BLOB_READ_WRITE_TOKEN` at construction, which triggers `@t3-oss/env-nextjs` validation. Before this commit `@repo/env/blob` was exported-but-never-imported — env var was unvalidated at boot, would only fail at first upload attempt. Now fails at boot (and stays short-circuited by `SKIP_ENV_VALIDATION=1` in CI). **First factory+fake-DI test pattern in api-server** — before this commit, ALL api-server tests hit a real Postgres via `src/test/helpers.ts`. `endpoints/iam/upload.test.ts` is the first use of `vi.fn()` in the suite: 9 cases (happy path, filename sanitization, per-context storage prefix parameterized via `it.each` for avatar/blog/marketing, invalid file type, oversize file, delete happy path, delete empty URL). Sets the precedent for future ports in 1.4.C (email, payments, queue, cache). **Dep-cruiser unchanged:** no new rules. `infrastructure/` is automatically out of scope for all context-scoped rules because they anchor `from.path` on `(endpoints|mappers)/<ctx>/`. Verified 0 violations on 785 → 789 modules. **BOUNDED-CONTEXTS.md §1 updated** (2 sentences on lines 73 + 101) to reflect the 1.4.A/1.4.D split: 1.4.A inverts the vendor dependency, 1.4.D moves upload out of IAM into a dedicated Storage supporting context. **New finding filed during this work:** 1.4.D below.
- ⏸ 1.4.B — **DEFERRED TO §2 Money value object.** Standalone-move attempt landed as `4e5fbe8` (`refactor(contracts): move money primitives out of @repo/shared into @repo/contracts/common/money`) and the hash-record commit `74e5353` on top, then was reverted in the next session via `714181f` + `3f6d515`, reformulated in `c00d98d docs(audit): defer 1.4.b to §2 value objects`. The reason the standalone move failed the M7 filter: helper functions (`centsToAmount`, `amountToCents`, `CENTS_PER_UNIT`) are **behavior**, not shape — placing them in `@repo/contracts` violates ADR 0005, which defines contracts as the API-boundary layer (Zod schemas + inferred types + schema-constants). My own in-commit justification called the placement "pragmatic interim home until §2 Money value object lands" — "interim" is a STOP-signal per `feedback_no_compromises_audit_standard.md`. The correct fix is to create the `Money` value object in §2 and attach the helpers as its constructors/converters. The §2 Money VO bullet now explicitly owns this scope (see `BIGTECH-AUDIT.md` line 168). **Do not re-open 1.4.B as a standalone bullet** — it will be closed transitively when the §2 Money VO bullet lands.
- ✅ 1.4.C — scaffold email/cache/queue/payment ports. Commit `1779400`. Four new port directories under `packages/api-server/src/infrastructure/` alongside storage: `email/`, `cache/`, `queue/`, `payment/`. Each contains `port.ts` (committed interface, zero vendor SDK imports, no speculative methods), `index.ts` (type re-exports only — no default singleton yet, no adapter), `README.md` (purpose, shape, vendor candidates, open questions, adapter placement plan, non-goals). New top-level `infrastructure/README.md` documents the convention (port dir layout, dep rules, rules for adding new ports, active ports table, non-goals). **Executed "in full form" per user directive** (not empty placeholders). Each port commits only to what's invariant across serious vendors: `EmailPort.send(input)` — Resend/Postmark/SES/Mailgun/Sendgrid largest common denominator; `CachePort.get<T>/set<T>/delete` with optional `ttlSeconds` — Upstash/Vercel KV/Redis/in-memory universal K/V; `QueuePort.enqueue<T>(name, payload, delayMs?)` — **producer side only**, consumer registration deferred because Inngest/QStash/BullMQ/SQS/Cloudflare Queues diverge on worker lifecycle; `PaymentPort.createCheckout(...)` + `verifyWebhook(...)` — **only** the two operations every hosted-checkout vendor (Stripe/Lemon Squeezy/Paddle/Polar) supports identically. Subscriptions, invoices, refunds, disputes, customer portals, bulk email, scan/pub-sub, cron — all deferred to narrower future ports. **M7 filter survived** because: (a) committed interfaces are real and backed by multi-vendor common-denominator analysis in the READMEs, not speculative; (b) no speculation on what's not stable (queue consumer registration, payment subscriptions, etc.); (c) no adapters, no tests, no consumer wiring — pure scaffolding. No dep-cruiser rule changes: `infrastructure/` is out of scope for all context-scoped rules. Module count 789 → 797 (+8 = 4 ports × {port.ts, index.ts}). Deps unchanged at 1415 — no consumer imports yet.
- ✅ 1.4.D — move upload out of IAM into Storage supporting context. Commit `f4e4655`. **Contracts:** `contracts/iam/upload/` → `contracts/storage/upload/` (5 files, git: 100% renames), subpath export `@repo/contracts/storage/upload`, root barrel re-org (upload line moved from IAM section into new Storage section). **api-server:** `endpoints/iam/upload.{ts,test.ts}` → `endpoints/storage/` (git: 87% / 89% rename after symbol renames inside the files), new `endpoints/storage/index.ts` barrel that constructs `storageUploadAdminApi = createStorageUploadAdminApi(defaultStorage)` — same factory-DI pattern as 1.4.A. Symbol renames: `IamUploadAdminApi`/`createIamUploadAdminApi`/`iamUploadAdminApi` → `Storage...` equivalents. New subpath export `./storage` in `api-server/package.json`. `endpoints/iam/index.ts` cleaned — iam exports only auth-service + users-admin + users-search (pure identity now). **5 admin consumer files** updated: route handler (import + symbol), 2 modules forms (contract import), 1 hook (contract import), 1 api client endpoint (contract import). Zero platform/marketing consumers — upload is admin-only today. **Dep-cruiser: 2 new forbidden rules.** `contracts-storage-is-leaf` — `contracts/src/entities/storage/` can't import from `(cms|lms|coaching|iam|billing)/`. `api-server-storage-is-leaf` — `(endpoints|mappers)/storage/` can't import from `(endpoints|mappers)/(cms|lms|coaching|iam|billing)/`. Direction always `domain → Storage`, never reverse. First run: 0 violations on 798 modules. **BOUNDED-CONTEXTS.md big rewrite:** §1 IAM renamed "Identity, Access, and Media" → "Identity and Access" (media moved out), upload bolt-on para removed, fields cleaned of upload references. **New §6 "Storage — supporting context (file upload)"** written in full — ~80 lines covering responsibility, why it exists separately, what it owns (table of shapes), dependencies (none inbound from domain), who can import (any domain context), invariants (vendor isolation, config contract-level, closed UploadContext union), where it lives, target state. **§7–§12 renumbered** (old §6–§11). Cross-refs updated: §6→§7 × 3 (Product split rule), §8→§9 (dep rules reference), §7→§8 (invariants reference). §9 Dep rules gained a `Storage → (leaf supporting context)` row in the direction graph + explicit `Storage → any domain` forbidden entry. **ADR 0013** (Vercel Blob) updated — all paths + symbol names point at new location. **1.4.C infrastructure READMEs** updated retroactively: historical references to `endpoints/iam/upload.ts` / `createIamUploadAdminApi` / `endpoints/iam/index.ts` all point at storage now. **Dep graph regenerated, byte-identical** — package-level collapse doesn't reflect internal restructuring. **Test count stable at 236**, dep count stable at 1415, module count 797 → 798 (+1 new barrel).
- ✅ 1.5.A — `vercel.json` per app with security headers + next.config.ts fixes. Commit `e9566aa`. See "Current state" section above for details.
- ✅ 1.5.B — `/api/health`, `/api/ready`, `/api/version` endpoints in all 3 apps. Commit `75c2448`. Handler factories (`createHealthHandler`, `createReadyHandler`, `createVersionHandler`) in `@repo/api-routes/src/health-handlers.ts`. Readiness probe via `checkDatabase` (`SELECT 1`) from new `@repo/api-server/ops` subpath (`packages/api-server/src/endpoints/ops/index.ts`). Version endpoint exposes `VERCEL_GIT_COMMIT_SHA` (auto-injected by Vercel, null locally). `turbo.json` `globalEnv` extended. All endpoints public — `withPublicRoute` wrapper (error handling, no auth). `ops/` naturally exempt from dep-cruiser context rules (not a domain context). Infra commit `93e74cd` preceded: CRLF normalization (project moved from Linux to Windows) + `cross-env` for Windows-compatible test scripts. Module count 798 → 806, deps 1415 → 1429.
- ⏳ **NEXT = 1.5.C** — `docs/DEPLOY.md`.
- ⏸ 1.5.D — `.env.example` at repo root.
- ⏸ 1.5.E — `apps/admin/src/proxy.ts` with server-side ADMIN role check.
- ⏸ 1.5.F — role-based route protection in `apps/platform/src/proxy.ts`.
- ⏸ 1.6.A — fix `@repo/auth` next-auth dual-instance risk.
- ⏸ 1.6.B — replace `@repo/ui` wildcard exports with controlled public API.
- ⏸ 1.6.C — declare `@repo/contracts` dependency in `@repo/api-client`.
- ⏸ 1.6.D — minor `package.json` hygiene.

**Sections 2–12:** research not yet started. Research begins at the top of each section and must complete before any bullet in that section is implemented.

## Repo structure snapshot after 1.3.C — orient fast

`packages/api-server/src/`:

```
authz/                  ← top-level. Cross-cutting authz policy.
  guards.ts             ← resolveCoachId, verifyAthleteBelongsToCoach, verifyPlanOwnership, verifyWorkoutOwnership
  guards.test.ts
  (imports from ../mappers/lms + ../mappers/coaching — intentional, exempted from dep-cruiser rules R7/R8 via from.path scoping to (endpoints|mappers)/*)
db/                     (prisma client + soft-delete extension — unchanged)
endpoints/
  billing/README.md     ← placeholder, no endpoints yet
  cms/
    blog/{admin.ts, admin.test.ts, public.ts}  ← public.ts added in 1.2.G (cmsBlogPublicApi)
    contact/{admin.ts, inbound.ts}
    dashboard/admin.ts
    pages/{admin.ts, public.ts, page-sections.ts}
    product/{admin.ts, public.ts}
    review/{admin.ts, public.ts}
    toggle-exclusive-featured.ts  ← shared cms admin helper
    index.ts              ← barrel for @repo/api-server/cms
  coaching/
    admin-user-view.ts    ← 1.2.J — coachingAdminUserViewApi.getById
    athlete-profile.ts
    coach-action-item.ts + .test.ts + .test-helpers.ts
    coach-athletes/{index.ts, detail.ts, list.ts}
    coach-dashboard.ts + .test.ts
    coach-note.ts
    coach-profile.ts
    dashboard-computations.ts + .test.ts + .test-helpers.ts
    dashboard-progress.test.ts
    enrollment-query.ts
    plan-roster.ts        ← 1.2.I — coachingPlanRosterApi.list/.getById
    index.ts              ← barrel for @repo/api-server/coaching
  iam/                    ← post-1.4.D: pure identity, no upload
    auth-service.ts       ← exports `iamAuthService`
    users-admin.ts        ← post-1.2.J: only getAll/getPageData/updateRole (returns pure User). getById moved to coaching/admin-user-view.ts
    users-search.ts
    index.ts              ← barrel for @repo/api-server/iam (exports auth-service + users-admin + users-search only)
  lms/
    benchmark-definition.ts
    plan-enrollment.ts    ← post-1.2.I: mutations only (create/update/delete, return pure PlanEnrollment). Reads moved to coaching/plan-roster.ts
    training-plan.ts + .test.ts
    user-benchmark.ts
    workout.ts + .test.ts
    workout-log.ts
    index.ts              ← barrel for @repo/api-server/lms
  storage/                ← 1.4.D — supporting context (file upload)
    upload.ts             ← post-1.4.A+1.4.D: factory createStorageUploadAdminApi(storage) depending on StoragePort
    upload.test.ts        ← first vi.fn()-based factory+fake-DI test pattern in api-server (from 1.4.A)
    index.ts              ← barrel for @repo/api-server/storage, constructs storageUploadAdminApi = createStorageUploadAdminApi(defaultStorage)
  infrastructure/         ← cross-cutting ports-and-adapters layer, out of scope for all context dep-cruiser rules
    README.md             ← 1.4.C — convention + active ports table
    storage/              ← 1.4.A — LIVE
      port.ts + vercel-blob-adapter.ts + index.ts (defaultStorage singleton)
    email/                ← 1.4.C — scaffold only, no adapter yet
      port.ts + index.ts + README.md
    cache/                ← 1.4.C — scaffold only, no adapter yet
      port.ts + index.ts + README.md
    queue/                ← 1.4.C — scaffold only, no adapter yet (producer-only shape)
      port.ts + index.ts + README.md
    payment/              ← 1.4.C — scaffold only, no adapter yet (checkout + webhook-verify only)
      port.ts + index.ts + README.md
  (NO src/endpoints/index.ts and NO src/index.ts — deleted in 1.2.D, package has no root barrel)
mappers/                  ← reorganized by context in 1.2.E, leaks closed in 1.2.I/J/K
  cms/
    blog.mapper.ts
    contact.mapper.ts
    product.mapper.ts
    review.mapper.ts
    enum-maps.ts + enum-maps.test.ts
    index.ts
  lms/
    benchmark-definition.mapper.ts
    plan-enrollment.mapper.ts       ← post-1.2.I: pure (no coaching imports)
    training-plan.mapper.ts + .mapper.test.ts
    user-benchmark.mapper.ts
    workout.mapper.ts
    workout-log.mapper.ts
    enum-maps.ts + enum-maps.test.ts
    index.ts
  coaching/
    admin-user-view.mapper.ts + .test.ts  ← 1.2.J — mapToAdminUserView, reuses mapToUser from iam (coaching→iam, allowed)
    athlete-profile.mapper.ts + .test.ts  ← test file added in 1.2.K (co-located with mapper)
    coach-action-item.mapper.ts
    coach-note.mapper.ts
    coach-profile.mapper.ts + .test.ts    ← test file added in 1.2.K (co-located with mapper)
    enum-maps.ts + enum-maps.test.ts
    plan-roster.mapper.ts                 ← 1.2.I — mapToPlanRosterEntry, reuses mapToPlanEnrollment from lms (coaching→lms, allowed)
    index.ts
  iam/
    user.mapper.ts + .mapper.test.ts      ← post-1.2.J/K: pure. Exports mapToUser (new) + mapToAdminUserListItem. Test file trimmed to iam-only describes.
    enum-maps.ts + enum-maps.test.ts
    index.ts
  (NO root mappers/index.ts — deleted in 1.2.E; consumers use ../../mappers/<context>)
test/                     (shared integration test helpers)
utils/                    (only cross-cutting: date-helpers, find-or-throw, json-record, prisma-error-handler + .test files)
  index.ts
```

`packages/contracts/src/entities/` (post-1.3.C — all schema leaks closed):

```
cms/        blog/ contact/ dashboard/ pages/ product/ review/
lms/        benchmark-definition/ plan-enrollment/ training-plan/ user-benchmark/ workout/ workout-log/
            (plan-enrollment.schema.ts is pure post-1.2.I: no user object, no HealthStatus)
coaching/   admin-user-view/  ← 1.2.J, imports userSchema from iam (coaching→iam)
            athlete-profile/
            coach-action-item/
            coach-athletes/   (coach-athletes-api.schema.ts imports PlanEnrollmentStatus from lms — legal coaching→lms)
            coach-dashboard/
            coach-note/
            coach-profile/
            plan-roster/      ← 1.2.I, imports planEnrollmentSchema from lms (coaching→lms)
iam/        auth/ user/
            (user.schema.ts is pure post-1.2.J: no athleteProfile or coachProfile fields; userSchema exported as the new pure shape)
            (upload/ moved to storage/upload/ in 1.4.D)
storage/    upload/       ← 1.4.D — new supporting context; subpath export @repo/contracts/storage/upload
billing/    README.md (placeholder)
```

Contract subpath exports (22 total post-1.4.D): `@repo/contracts/<context>/<entity>`. Notable new post-1.2: `@repo/contracts/coaching/plan-roster`, `@repo/contracts/coaching/admin-user-view`. Post-1.4.D: `@repo/contracts/iam/upload` removed, `@repo/contracts/storage/upload` added (net zero change in count, domain reshape).

`@repo/api-server` public surface (post-1.2.D + 1.2.F + 1.2.I/J + 1.4.D): **5 subpaths** — `@repo/api-server/cms`, `@repo/api-server/lms`, `@repo/api-server/coaching`, `@repo/api-server/iam`, `@repo/api-server/storage` (new in 1.4.D). No `.` root export. Consumer imports look like `import { cmsBlogAdminApi } from "@repo/api-server/cms"`. Public symbols follow the `<context><Entity><Role?>Api` convention. Notable new post-1.2: `cmsBlogPublicApi` (1.2.G), `coachingPlanRosterApi` (1.2.I), `coachingAdminUserViewApi` (1.2.J), `storageUploadAdminApi` (1.4.D). Notable exception from convention: `iamAuthService` keeps the Service suffix because it's not an API object. `lmsPlanEnrollmentApi` (1.2.I) and `iamUserAdminApi` (1.2.J) both shrank to mutations-only — their read paths moved to the coaching context. IAM's public surface shrank further in 1.4.D — upload is no longer re-exported from `@repo/api-server/iam`, consumers must use `@repo/api-server/storage`.

**All cross-context leaks closed.** The two known schema leaks (LMS→Coaching, IAM→Coaching) plus their mapper-level manifestations were closed in commits `6b9628b` (1.2.I) and `a05b36f` (1.2.J). Enforced automatically by dep-cruiser since commit `c7631a7` (1.3.A) — any regression fires `pnpm dep:check` locally (lefthook pre-push) and in CI.

## Repo-root tooling added in section 1.3

Top-level files and scripts added during section 1.3:

```
/.dependency-cruiser.cjs    ← 1.3.A — 17 forbidden rules (boundary gate)
/.github/workflows/ci.yml   ← 1.3.B — 5 parallel lanes (check-types, lint, dep-check, test, build)
/scripts/dep-graph.mjs      ← 1.3.C — helper script for `pnpm dep:graph`
/docs/DEPENDENCY-GRAPH.md   ← 1.3.C — committed mermaid dep graph (package-level, 16 nodes)
```

New root scripts in `package.json`:

- `pnpm dep:check` — runs dep-cruiser (used locally via lefthook pre-push + in CI dep-check lane)
- `pnpm dep:graph` — regenerates `docs/DEPENDENCY-GRAPH.md` via `scripts/dep-graph.mjs`

Lefthook state (post-1.3.A):

- `pre-commit`: 4 parallel hooks — lint, prettier, type-check, test
- `pre-push`: 1 hook — dep-check (NEW in 1.3.A; ~4.2s on 798 modules post-1.4.D)
- `commit-msg`: commitlint

Note: `.github/workflows/ci.yml` has not yet run on GitHub — the branch is 48 commits ahead of `origin/`, unpushed. First CI run will happen whenever the branch is finally pushed. If the first run surfaces a workflow bug (e.g. wrong prisma flag, missing env var), iterate in follow-up commits, not by rewriting 1.3.B.

Post-1.4.A addition: `packages/api-server/src/infrastructure/storage/` is the first `infrastructure/` directory in api-server. Convention: ports live here, one subdirectory per port. Each port directory has `port.ts` (interface), `<vendor>-adapter.ts` (implementation, the ONLY file that imports the vendor SDK), and `index.ts` (barrel + default singleton instance). Dep-cruiser context-scoped rules do not need updating for new ports because `from.path` anchors on `(endpoints|mappers)/<ctx>/` — `infrastructure/` is always out of scope. Closed in 1.4.C: ports `email/`, `cache/`, `queue/`, `payment/` scaffolded alongside `storage/`, each with `port.ts` + `index.ts` + `README.md` (no adapters yet — vendor selection is business-adjacent). Top-level `infrastructure/README.md` documents the convention, active ports table, how-to-add-a-port rules.

Post-1.4.D addition: Storage is now a **bounded context of its own** (specifically, a supporting context). It has:

- its own contracts subtree: `packages/contracts/src/entities/storage/` with subpath export `@repo/contracts/storage/<entity>`
- its own api-server endpoints subtree: `packages/api-server/src/endpoints/storage/` with subpath export `@repo/api-server/storage`
- two new dep-cruiser leaf rules (`contracts-storage-is-leaf` + `api-server-storage-is-leaf`) enforcing domain → Storage direction
- its own section in `BOUNDED-CONTEXTS.md` as §6

Upload is the only entity in Storage today. If/when other cross-cutting file concerns emerge (export generation, document signing, media transcoding, etc.) they get their own entity subdirectory inside `storage/`. IAM went back to pure identity after this move — `endpoints/iam/` now exports only auth-service + users-admin + users-search.

Post-1.4.B addition: **1.4.B was reverted** (commits `714181f` + `3f6d515`) and deferred to §2 (`c00d98d`). The idea that `packages/contracts/src/common/` is a home for cross-context domain primitives is WRONG — contracts is the schemas+types boundary by ADR 0005. Domain primitives live with their value objects, and value objects are a §2 concern. Do not extend `contracts/common/` with further non-schema files until §2 has settled the value-object layering question. Re-reading `BIGTECH-AUDIT.md §1.4 bullet 2` → §2 Money VO is the one-and-only home for that scope; do not open a standalone bullet for it.

## Lesson from 1.4.B — the M7 filter

**The trigger word test:** if my own in-commit justification contains `interim`, `temporary`, `pragmatic compromise`, `for now`, `placeholder`, `will move later`, `until §X`, `until we have Y`, then the move is failing the M7 filter. Stop. Re-scope the bullet as "deferred to §X" and land a doc commit instead of a code commit. The cost of a single wrong code commit that gets reverted the next day is much higher than the cost of pausing for 5 minutes to check whether the scope is really owned by a later section.

**ADR 0005 is literal, not aspirational.** `@repo/contracts` is **schemas + types + schema-constants**, not behavior. Helper functions, conversion math, comparators, formatters, factories — all belong next to the type they operate on, which for domain primitives means the value object. If the value object doesn't exist yet, the helpers don't move yet. They stay in their current home (even if that home is "wrong") until the VO lands and provides a correct target.

**Decomposition with documented intermediate state is legal; hidden compromises are not.** 1.4.A (storage port + vercel-blob adapter) survives the same filter that 1.4.B fails, because 1.4.A's "intermediate state" (upload still lives in `endpoints/iam/` rather than `endpoints/storage/`) is explicitly filed as bullet 1.4.D, cross-referenced from BOUNDED-CONTEXTS.md §1, and scheduled. The difference is that 1.4.A doesn't need to call itself "interim" — the intermediate state is a separate, atomic, filed unit of work. 1.4.B tried to call itself interim because it had no such separate filed unit — the real fix was a §2 concern, but 1.4.B wanted to ship a smaller version of it as a prelude. Prelude fixes are the anti-pattern.

## Lessons from execution — avoid re-learning

### 1.2.B/C (contracts + endpoints reorg)

- **Pre-commit prettier can push a file over ESLint `max-lines` after a rename**, if the file was near the limit and the new path makes an import wrap to multiple lines. Happened to `endpoints/platform/coach-action-items.test.ts` in 1.2.B — inlined one assertion to reclaim a line. Watch for files near 300 non-blank lines.
- **Depth counting is error-prone.** Concrete reference points in the current layout:
  - `endpoints/iam/auth-service.ts` is at depth 2 under `src/`. From it: `../../db/client` reaches `src/db/client`.
  - `endpoints/cms/blog/admin.ts` is at depth 3. From it: `../../../db/client` reaches `src/db/client`.
  - `endpoints/coaching/coach-athletes/list.ts` is at depth 3. Same pattern.
  - `authz/guards.ts` is at depth 1 under `src/`. From it: `../db/client` reaches `src/db/client`.
  - `mappers/<context>/<name>.mapper.ts` is at depth 2 (post-1.2.E). From it: `../../db/client`.
  - A file moving from depth X to depth Y needs every relative import updated by (Y − X) more `../` prefixes — unless the target is co-located in the new folder, in which case the import becomes `./sibling`.
- **Verify every consumer before declaring a util "context-specific".** In 1.2.C I moved `json-record.ts` to `cms/pages/` under the assumption that only `admin/pages.ts` used it. `coaching/coach-action-item.ts` also imported it — had to move it back. Lesson: `grep -rn "<file-base>" packages/api-server/src/` before the move, not after.
- **`git rm` on the last file in a directory removes the directory automatically.** Saves an explicit `rmdir`. Don't chain them.
- **Bulk sed with ordered patterns is the right tool for path rewrites.** Sort entity/pattern names by length descending to avoid prefix collisions (`user-benchmark` before `user`, `workout-log` before `workout`, `coach-action-item` before `coach-action`). Anchor on trailing quote for extra safety.
- **Prettier auto-fix during lint may reorder imports** after a path rename. Let it. Don't hand-fight it.
- **Commit output can be truncated by the tool's byte cap** when pre-commit runs a long log. If a commit looks stuck or returns exit 1 suspiciously, redirect: `git commit ... > /tmp/commit.log 2>&1; echo "exit=$?"; tail -30 /tmp/commit.log`. Unmasks the real lefthook error.
- **The `authz/` directory is a cross-cutting module, not a bounded context.** Dep-cruiser rules added in 1.3.A will exempt it from the "no LMS→Coaching" rule. Don't try to split back into `lms/guards.ts` and `coaching/guards.ts`.

### 1.2.D (api-server subpath exports)

- **`exports` field can fully replace `main`/`types`** for bundler/nodenext `moduleResolution`. Both `@repo/contracts` and `@repo/api-server` now rely on `exports`-only, no `main`/`types` fallback. Proven in production build + test.
- **Bulk sed by pre-computed file groups** is the cleanest way to migrate consumers when each file's new target differs. For 1.2.D I grouped the 56 consumer files into 4 context buckets (based on which symbol each imported), then ran `sed -i 's|old|new|' <file-list>` once per bucket. No mixed-context files existed, so every file went to exactly one bucket.
- **Pre-work grep with `rg` confirms there are no multi-line or aliased imports** before doing a literal sed replacement. Always run the scope-check grep before committing to sed-based rewrites.
- **Explicit `sort by name length DESC` is unnecessary for single-name sed patterns** — only matters when patterns can prefix-match each other. A full-symbol-name literal replacement is safe regardless of order if new names don't contain old names as substrings.

### 1.2.F (symbol rename)

- **`rg -l <union-regex> | xargs sed -i -e ... -e ...` is the right pattern for repo-wide rename.** One ripgrep discovery, one sed pass with N `-e` substitutions. In 1.2.F: 26 substitutions, 93 files, single invocation. Make sure to check chain-replacement safety (no new name should contain any old name as substring) before running.
- **Exclude audit docs that contain "old → new" rename descriptions** from the sed sweep with `--glob '!docs/BIGTECH-AUDIT.md'`. Otherwise sed rewrites both sides of the arrow and destroys the example. Handle those docs with targeted manual edits.
- **Sed preserves whitespace/formatting** but prettier during pre-commit may reorder imports. Accept the reorder, don't pre-format.
- **Duplicate imports from the same path** (e.g. two `import { A } from "X"; import { B } from "X";`) happen when two different sed rules rewrite two imports to the same target. Lint catches them as `import/no-duplicates` — merge manually after the sed pass.

### 1.2.E (mappers reorg + split)

- **Splitting a "cross-cutting" file often exposes real leaks that were hidden behind a shared barrel.** `enum-maps.ts` looked cross-cutting because it bundled enums from all contexts. But each individual enum is single-context; the file was a bundle, not a cross-cutter. After splitting into 4 per-context `enum-maps.ts` files, the two pre-existing mapper-level leaks (iam→coaching in user.mapper.ts, lms→coaching in plan-enrollment.mapper.ts) became EXPLICIT cross-context imports. Good — leaks should be visible.
- **Move ≠ split.** When reorganizing files by domain context, first check if the file holds symbols owned by DIFFERENT contexts. `iam/user.mapper.ts` originally held `mapToAthleteProfile` and `mapToCoachProfile` alongside `mapToAdminUser` — the first two belong to coaching. The correct operation is split-then-move: extract to `coaching/athlete-profile.mapper.ts` and `coaching/coach-profile.mapper.ts`, then the remainder stays in `iam/user.mapper.ts` with an explicit cross-context import (the leak manifestation).
- **Cross-context dual imports cannot be sed'd.** Each file needs individual analysis: which symbols come from which context. Use manual `Edit` calls. In 1.2.E, 4 coaching files had dual-context enum-maps imports (coaching + lms) — each required a manual rewrite.
- **Per-context barrel re-exporting both mappers AND enum-maps is the right granularity.** One `index.ts` per context, `from "./blog.mapper"` + `from "./enum-maps"`. Consumer gets `import { mapToX, X_MAP } from "../../mappers/<context>"`. No separation of "functions" and "const dicts" — they share a context.
- **Splitting a cross-cutting test file** preserves coverage if each per-context file carries a local version of any cross-cutting assertion. The 1.2.E symmetry test ("no two Prisma keys collide") was globally defined over 13 maps; after split each per-context file has its own narrow symmetry check over 2–6 maps. Total test count increased by 3 (one global → four per-context tests = +3).

### 1.2.G/H (cms blog public extraction + marketing client mirror)

- **Server-side refactors that change public API shapes ripple to the client.** 1.2.G split blog reads into `cmsBlogPublicApi`; the UI was still reading them through `api.pages.getBlogArticle`. That mismatch is a new bullet, not a scope-expansion of the original one. The audit-doc rule "living document" ate this cleanly: new bullet filed the moment the gap was spotted, implemented in the next commit.
- **Client-side api composers mirror server-side context organization.** `apps/marketing/src/lib/api/endpoints/{blog,contact,pages}.ts` + `factory.ts` now maps 1:1 to the server's CMS split. When you create a new server-side public endpoint, check if the client API factory needs a matching namespace.
- **`api.pages.getBlog()` stays in pages** — the blog LIST page is a CMS page (page sections + posts), not a blog article. Distinction between "page composed of blog data" and "blog domain entity" is real; don't collapse them.

### 1.2.I/J (CQRS-lite split for LMS→Coaching and IAM→Coaching leaks)

- **CQRS-lite pattern for closing projection leaks.** The leak shape was the same in both cases: a "lower" context's schema embedded fields from a "higher" context to serve a coach/admin view. Fix: the "lower" context keeps a PURE schema (no projection fields), and the "higher" context creates a new entity that extends the lower one with the projection. Direction Coaching→{IAM,LMS} is allowed per `BOUNDED-CONTEXTS.md §8` so coaching can legally import lower contract shapes.
- **Endpoint split follows schema split.** `lmsPlanEnrollmentApi` → mutations only (return pure `PlanEnrollment`). New `coachingPlanRosterApi` → read view returning enriched `PlanRosterEntry[]`. Same pattern for `iamUserAdminApi` / `coachingAdminUserViewApi`. Route handlers keep the SAME URL surface but mix handlers from both apis: GET routes use the coaching read api, POST/PUT/DELETE routes use the iam/lms mutation api.
- **createCrudHooks can't model mixed-shape CRUD.** `createCrudHooks<TPageData, TEntity, ...>` assumes update and getById return the same `TEntity`. When 1.2.J made update return pure `User` and getById return enriched `AdminUserView`, the factory broke. Solution: hand-roll `useQuery` + `useMutation` for that endpoint. Don't fight the factory — drop it per-entity.
- **UI mutation responses are almost never read directly** — hooks invalidate the query and re-fetch. So changing a mutation's return type from enriched to pure is runtime-invisible even when the UI has an optimistic update hook. Verify by grepping for usages of the mutation result in consumers before committing.
- **Mapper cross-context reuse is the right escape hatch.** `mappers/coaching/plan-roster.mapper.ts` does `{ ...mapToPlanEnrollment(row), user: {...} }` — reusing the LMS mapper instead of duplicating it. This is coaching→lms, allowed, and avoids two places to update when the pure shape changes.
- **Empty placeholder imports `_` can evade TypeScript's noUnusedLocals** when testing dep-cruiser rules. Better: assign to `void` — `void coachingCoachDashboardApi;` — works, silent to TS, easy to revert. Used this during 1.3.A positive-path verification.

### 1.2.K (test file colocation — a 1.2.E leftover)

- **Test files accumulate history the source doesn't.** When 1.2.E moved `mapToAthleteProfile`/`mapToCoachProfile` from iam to coaching, the test file stayed in iam (tests imported across context boundaries via `../coaching/...`). 1.2.J wanted to remove only `mapToAdminUser` tests — but that left two orphan describes for functions that lived elsewhere. Fixing test colocation became its own atomic bullet (1.2.K). Lesson: when splitting source, ALWAYS check test ownership in the same commit. A "left over" test file is as much a leftover as a left over source file.
- **Test-data helper duplication is acceptable.** `makeAthleteProfile` and `makeCoachProfile` are ~10-line fixture builders. Duplicating them across 3 test files (iam/user, coaching/athlete-profile, coaching/coach-profile) is cleaner than sharing a helper file that re-introduces cross-file coupling. Colocation > DRY for test fixtures.

### 1.3.A (dependency-cruiser boundary rules)

- **tsConfig discovery in dep-cruiser needs CWD tsconfig OR none at all.** Setting `tsConfig.fileName: "tsconfig.json"` made dep-cruiser look in CWD, which has no tsconfig (the repo uses per-app/per-package tsconfigs only). Solution: omit `tsConfig` entirely. Boundary rules work on raw file paths, they don't need TS alias resolution. `@app/*` aliases are app-internal and never cross package boundaries anyway.
- **Build artifacts must be explicitly excluded, not just not-followed.** Storybook's `storybook-static/` contains bundled JS with naturally circular imports (bundler artifacts, not real source cycles). First dep-cruiser run surfaced 103 no-circular violations, all in storybook-static. Fix: add `storybook-static` to BOTH `doNotFollow.path` AND `exclude.path`. `includeOnly: "^(apps|packages)/"` alone is not enough because apps/storybook is included.
- **Subpath exports need `enhancedResolveOptions.exportsFields: ["exports"]`** — without this, dep-cruiser can't resolve `@repo/api-server/cms` to `packages/api-server/src/endpoints/cms/index.ts`. Also set `conditionNames: ["import", "require", "default", "types"]` and `mainFields: ["main", "types"]` for completeness.
- **File-precise carve-outs are the right tool for narrow exceptions.** Admin can import coaching only from ONE file (admin-user-view route). Encode via `from.pathNot` regex with escaped brackets: `^apps/admin/src/app/api/admin/users/\[id\]/route\.ts$`. Any other admin file adding a coaching import fires the rule. Don't use blanket-waiver as the default — make exceptions narrow and reviewable.
- **Authz exemption via scope, not via explicit ignore.** `authz/guards.ts` is cross-cutting and reaches into LMS + Coaching mappers. Don't add it to an `allowOverride` list — instead, scope `api-server-lms-no-coaching`-type rules' `from.path` to `(endpoints|mappers)/...`, so `authz/` is naturally out of scope. Cleaner, self-documenting.
- **Pre-push is the right hook for dep-check.** ~4.2s on 785 modules. Pre-commit already has 4 parallel hooks; adding a 5th that adds 4s would noticeably slow every commit. Pre-push fires once per push, not per commit, and is where "did I break the graph" is an actionable question.
- **Positive-path rule verification is mandatory.** Don't trust that `0 violations` means rules are correctly wired. Deliberately add a bad import for each rule you care about, verify it fires with the expected rule name, revert. Did this for R17 (admin→coaching from wrong file) and R18 (platform→cms). Caught nothing this time, but the pattern protects against silent misconfigurations.

### 1.3.B (GitHub Actions CI)

- **Commitlint rejects `ci` as a conventional-commits type.** Allowed types: `feat|fix|docs|style|refactor|test|chore|revert|perf`. Use `chore(ci): ...` for CI workflow commits.
- **Postgres service container is the clean way to provide a test DB in GH Actions.** Spin up `postgres:16-alpine` as a service with healthcheck gating (`--health-cmd pg_isready --health-retries 5`), then `pnpm --filter @repo/api-server db:push --skip-generate --accept-data-loss` to push the Prisma schema. Fresh DB per run, zero state sharing, no secrets needed for the test lane. Obviates DATABASE_URL secret management.
- **Build lane doesn't need a real DB** because the repo's Next.js pages all use `export const dynamic = "force-dynamic"`. Dummy `DATABASE_URL=postgres://dummy:dummy@localhost:5432/dummy` + dummy `NEXTAUTH_SECRET` / `BLOB_READ_WRITE_TOKEN` + `SKIP_ENV_VALIDATION=1` satisfies the zod env layer during build. If build ever does become DB-dependent, the build lane needs the same service container as test.
- **pnpm+Node version pinning at workflow `env:` top** keeps workflow-wide consistency and makes bumping a one-line change. Never duplicate `version:` in each job's `uses: pnpm/action-setup@v4` block.
- **Concurrency group with `cancel-in-progress: true`** saves GitHub Actions minutes on PR force-pushes. Group key should include `github.workflow` AND `github.ref` so different workflows don't cancel each other.

### 1.3.C (dep-graph artifact)

- **Mermaid is the right format for committed dep graphs.** GitHub renders mermaid blocks natively, the output is text (diffable), and there's no graphviz binary dependency in dev/CI. SVG would give richer visuals but defeats diffability. Mermaid wins for a committed artifact.
- **Collapse pattern is mandatory for repos >100 files.** Raw output on 785 modules is unreadable. `--collapse "^(packages|apps)/[^/]+"` aggregates to package-level (16 nodes). For finer granularity (context-level inside api-server), a more sophisticated collapse regex would be needed — filed as polish-future, not a 1.3.C requirement.
- **Wrapping CLI output in a markdown template** via a small Node helper at `scripts/dep-graph.mjs` is cleaner than inline shell chains in `package.json`. The script lives outside dep-cruiser's `includeOnly` scope so it doesn't show up in the graph itself.

### 1.4.A (storage port + vercel-blob adapter)

- **Option C (barrel wires default, factory file stays pure) beats module-level singleton in the factory file.** Original plan was to put both the factory and the default instance in `endpoints/iam/upload.ts` (pre-1.4.D path — now `endpoints/storage/upload.ts`). Plan agent stress-test caught the smell: any test importing from the file would trigger `createVercelBlobAdapter()` at module load time, which is fine for `@vercel/blob` (verified `sideEffects: false`, no env read at import) but breaks the moment a future S3/R2 adapter needs eager client instantiation. Cleaner pattern: factory file exports ONLY the factory; the default instance is constructed in the closest barrel (now `endpoints/storage/index.ts` post-1.4.D) with the real adapter injected. Tests import the factory directly → infrastructure never loaded in tests. Applied to all 1.4.C ports (they have no adapter yet, but barrel-only wiring convention is set).
- **Dead-code env validation modules are a free win to resurrect during port work.** `@repo/env/blob` existed since the original Vercel Blob integration but had ZERO consumers — the SDK reads `process.env.BLOB_READ_WRITE_TOKEN` itself, so the `@t3-oss/env-nextjs` wrapper was never imported. Boot-time validation was effectively off. The adapter is the natural home: `createVercelBlobAdapter()` does `void blobEnv.BLOB_READ_WRITE_TOKEN` on construction, which forces the t3-env module to run its Zod check. Boot-time validation on, `SKIP_ENV_VALIDATION=1` still short-circuits in CI. Same pattern for future ports: if there's a `@repo/env/<vendor>` file with no consumers, the adapter factory is where you wake it up.
- **First `vi.fn()` in api-server was a convention, not a technical question.** Before 1.4.A, every api-server test hit real Postgres via `test/helpers.ts` fixtures — there was literal zero use of `vi.mock` / `vi.fn` in the whole package. A port refactor naturally forces the question: mock the vendor module with `vi.mock("@vercel/blob")`, or inject a fake port? The factory-DI answer is obviously right for ports (the whole point of the port is to BE the injection seam), but worth flagging in the commit message so reviewers don't see "wait, we don't mock in this package" and push back. Same convention applies to every 1.4.C port test.
- **File type is in scope via DOM lib, no tricks needed.** `packages/typescript-config/base.json` has `"lib": ["ES2022", "DOM", "DOM.Iterable"]`, so `File` is available in every package without importing from `node:buffer`. The upload contract already uses it, the port signature keeps it, the test fakes build it via `new File([new Uint8Array(N)], name, { type })`. No `Blob` downgrade, no Node-specific shims.
- **BOUNDED-CONTEXTS.md sentences tied to a specific bullet can become stale the moment that bullet lands.** Lines 73 + 101 of BOUNDED-CONTEXTS.md said "Section 1.4.A moves upload behind a storage port, and at that point 'Storage' becomes its own supporting context" — but the actual 1.4.A scope (as executed) deferred the context-move to 1.4.D. If the prose isn't updated IN the same commit as the work that changes it, the document actively lies until the follow-up bullet lands. Rule: when a bullet closes and the doc references that bullet's end state, update the prose in the same commit. Plan-agent stress-test caught this; the original plan had "no update to BOUNDED-CONTEXTS.md in 1.4.A".
- **ADR cleanup goes in the follow-up hash commit, not the implementation commit.** Pattern established in 1.2/1.3: implementation commit writes `_pending_` in the BIGTECH-AUDIT table, follow-up `docs(audit): record <bullet> commit hash` updates the table with the real hash. For 1.4.A the follow-up commit also fixed ADR 0013: status flip ("scheduled → closed"), path corrections (ADR still referenced `endpoints/admin/upload.ts` from pre-1.2.C and `contracts/entities/upload/` from pre-1.2.B), and a new reference to `infrastructure/storage/`. Keep ADR touches in the follow-up — they tend to cluster with doc updates, not code changes.
- **`it.each` parameterization inflates test counts non-obviously.** Planned "7 test cases" → actually 9 because the per-context storage-prefix test expands 3 rows via `it.each`. Test count jumped 227 → 236, not 227 → 234. Not a problem, just note it when writing up the bullet so the count in docs matches reality.
- **Optional chaining on `vi.fn().mock.calls[N]` is the non-null-assertion workaround** for this codebase's ESLint rule forbidding `!`. `const [key, file, opts] = storage.put.mock.calls[0] ?? [];` compiles clean, reads cleanly, and assertions on the destructured values fail loudly if the call never happened (`expect(storage.put).toHaveBeenCalledTimes(1)` on the previous line catches that case first).

### 1.4.C (scaffold email/cache/queue/payment ports)

- **"Full form" means committed interface, not empty placeholder.** User directive "исполняем всё в полной форме" rejected the minimal "empty `port.ts` + README" framing. The working answer is: commit to what's stable across serious vendors (largest common denominator), defer what diverges. EmailPort.send and CachePort.get/set/delete commit to the full shape because every vendor in the candidate set accepts that shape identically. QueuePort is producer-only (enqueue stable, consumer registration diverges across Inngest/BullMQ/QStash/SQS/Cloudflare — defer). PaymentPort is checkout+webhook-verification only (hosted checkout URL + HMAC sig both universal across Stripe/LS/Paddle/Polar; subscriptions/invoices/refunds diverge — defer to narrower future ports). This "safe common denominator" framing survives the M7 filter because it's backed by multi-vendor analysis in the README, not vendor speculation.
- **READMEs must carry their own proof-of-thought.** Each port README has a vendor-candidates table + an "open questions" section listing what was deliberately NOT committed and why. If the open-questions section is empty, you probably over-committed. If the table only lists one candidate, you probably under-researched. Both conditions are M7 filter smells.
- **No default singleton when no adapter exists.** `index.ts` for each new port re-exports types only: `export type { EmailPort, SendEmailInput, ... } from "./port";`. No `export const defaultEmail = ...;`. When an adapter lands later, the barrel becomes 1 line longer (`defaultEmail = createResendAdapter()`) and consumers who were importing types from `./port` directly via subpath don't need to change anything. Setting the default at scaffold time would require either an `undefined` placeholder (lie about runtime state) or a `NotImplementedError` fake (test-fake posing as prod) — both fail the filter.
- **Top-level `infrastructure/README.md` is the natural convention anchor.** Without it, the 4 new port READMEs are orphans — readers have no "what is `infrastructure/` for" entry point. With it, the per-port READMEs are siblings under a well-defined umbrella: port dir layout, dep rules, how to add a new port, active port status table, non-goals. This README was not in the original 1.4.C plan — it emerged during scaffolding as the minimum necessary orientation. Add it retroactively to any future "scaffold many things" commit if missing.
- **Module count math matters for commit messages.** 4 new port dirs × 2 .ts files each = 8 new modules. README.md files are not modules. `dep:check` showed 789 → 797, as expected. If the count were off, it'd mean some import path is unresolved. Always run the pre-commit gates and cite the module delta in the commit message for anyone who wants to sanity-check the scope.

### 1.4.D (upload → storage supporting context)

- **Git `mv` + intra-file rename = ~87% rename preservation.** For `endpoints/iam/upload.test.ts` → `endpoints/storage/upload.test.ts`, after renaming `createIamUploadAdminApi` → `createStorageUploadAdminApi` (~8 occurrences in a 113-line file), git recognized it as 87% rename and preserved blame history. `upload.ts` was 89% (8 occurrences in a 48-line file, higher ratio because smaller denominator). For pure contracts moves with zero intra-file changes, git gets 100% renames. These percentages in `git commit` output aren't decoration — they confirm `git log --follow` will work on the new path. If a "rename" drops below ~50%, it's treated as delete+create and blame history is lost; in that case break the commit into two (pure rename first, symbol rename second) to preserve the link.
- **Renumbering doc sections requires grep-driven cross-ref audit.** `BOUNDED-CONTEXTS.md` §6 became §7 and §7 became §8 etc. — the section headers themselves are 1-line edits, but cross-refs elsewhere in the doc (`See §6`, `§8`, `§7`) are what actually break the read. Grep for `§\d+` across the whole file, make a map of old→new, edit every match. Caught 6 cross-refs: 3× §6→§7 (Product split rule references), 1× §8→§9 (dep rules), 1× §7→§8 (invariants). Missed any would leave the doc internally inconsistent — readers would follow a reference to the wrong section. Always grep-then-verify after a renumber.
- **Infrastructure READMEs from the previous commit can become stale.** 1.4.C wrote READMEs that referenced `endpoints/iam/upload.ts` as the factory-DI reference example. 1.4.D moved that file to `endpoints/storage/upload.ts`. The READMEs had 4 stale path references. They had to be updated IN THE SAME COMMIT as 1.4.D, because leaving stale path references in committed code would be a regression introduced by this bullet. Rule of thumb: when moving a file that doc elsewhere reference, grep for the file path across `.md` / `.mdx` / `.ts` / `.tsx` before committing. Caught 4 hits in infrastructure READMEs + 4 hits in ADR 0013 + 6 hits in BOUNDED-CONTEXTS.md. All updated.
- **Supporting contexts get their own dep-cruiser leaf rules.** Unlike domain contexts (whose rules are mostly "context X can't import from Y"), supporting-context rules are "X is a leaf — it can't import from ANY domain context". Two rules per supporting context: one for contracts, one for api-server endpoints/mappers. Direction graph annotation: `domain → Supporting`, never reverse. When the next supporting context materializes (e.g. observability/logging, cross-cutting audit trails), follow the same pattern: `X-is-leaf` rule in `contracts/src/entities/X/` + identical rule in `(endpoints|mappers)/X/`.
- **Dep graph is byte-identical after intra-package reorgs.** `scripts/dep-graph.mjs` uses `--collapse "^(packages|apps)/[^/]+"` which aggregates everything inside a package into a single node. Moving files between subdirectories of the same package doesn't change the mermaid output. Don't bother staging `docs/DEPENDENCY-GRAPH.md` after such moves — `git status` will show no diff and you'll be confused. Only regenerate+stage when a new package appears or cross-package edges change. For 1.4.D the regen ran but the file was unchanged.
- **`git status` with a path arg filters output misleadingly.** Running `git status docs/DEPENDENCY-GRAPH.md` showed "working tree clean" while the rest of the tree had 20+ modified files. That's technically correct (the path arg scoped the report to that file), but it tricked me into thinking the reverts earlier had already committed everything. Don't trust path-scoped `git status` for full state — use `git status` without arguments to confirm overall working tree health.

### 1.4.B (money primitives → contracts/common/money) — REVERTED, deferred to §2

**The lesson of 1.4.B is the lesson itself** — it failed the M7 filter and was reverted (`714181f` + `3f6d515`), then deferred to §2 Money value object (`c00d98d`). The meta-rule from this experience is now `feedback_no_compromises_audit_standard.md`. The rule supersedes any tactical lesson about HOW 1.4.B was executed. If a future bullet looks structurally similar to 1.4.B (move behavior into the wrong layer because the right layer isn't ready yet), defer the bullet and do not write it.

**Revert mechanics (worked clean, 2026-04-11):** `git revert 74e5353 --no-edit` → `git revert 4e5fbe8 --no-edit` → `pnpm install` → gates all green → reformulation commit editing 3 sections in `BIGTECH-AUDIT.md` (plan table row, §1.4 prose bullet, §2 Money VO bullet gains "Owns §1.4.B scope" sentence). Revert order matters — hash commit first, then refactor commit, otherwise they conflict because the hash commit edits text that the refactor commit inserted. Full turbo cache hit on `check-types` after the reverts (tree byte-identical to post-1.4.A, turbo's content-hash catches it).

**Two tactical observations from the landed-then-reverted work that ARE worth keeping** (they will apply to any clean future money-primitive work when §2 Value Objects lands):

- **`formatPrice` is presentation, not domain — it stays in `@repo/shared`.** The split line: if a function operates on a domain primitive and produces a domain primitive (`cents → amount`), it's a domain primitive. If it produces a UI string with locale-aware formatting via `Intl.NumberFormat` + `DEFAULT_LOCALE`, it's presentation. Contracts layer (or the future `Money` value object) must not reach for locales. `formatPrice` will eventually depend on whatever new home the primitives land in (probably `@repo/contracts` once §2 gives it a legitimate `Money` type), and that becomes the first `@repo/shared → @repo/contracts` dep in the repo — a correct direction, nothing special, no need to emphasize in commit messages.

- **When a subpath points at a flat `.ts` file and you need to add a sibling, convert to a folder — don't dual-path.** `contracts/package.json` had `"./common": "./src/common.ts"`. Adding `"./common/money": "./src/common/money.ts"` alongside a `common.ts` file is technically legal (exports map resolves by exact key) but creates visual ambiguity. Cleaner: rename `common.ts` → `common/index.ts` (git sees it as 100% rename, blame preserved), update the existing subpath target to `./src/common/index.ts`, then add the new sibling as `common/money.ts`. Relevant to any future bullet that adds a second file next to a flat module file — NOT specific to money.

## To resume work — exact instructions

When the user says "продолжай", "continue audit", "keep going", "идём дальше", or references BIGTECH-AUDIT:

0. **Read `feedback_no_compromises_audit_standard.md` in memory FIRST.** This is the M7 filter that every audit decision must pass. It was formalized on 2026-04-10 after 1.4.B fell. Every commit, every plan, every file placement — check against this rule. Words like "interim", "temporary", "pragmatic compromise", "OK for now" are STOP signals. When in doubt, defer the bullet or surface the tradeoff — never silently take the easier path.
1. **Read this handoff file fully.** Current state, next bullet, lessons learned, rule references. Don't start coding until you've read it.
2. **Read `docs/BIGTECH-AUDIT.md`** in the project repo. Find the "Implementation plan (section N)" table. Locate the first row with status `⏳ Next`. Verify the hash in this handoff matches the hash in the table for the last ✅ Done row — if not, somebody edited state out-of-band and you must reconcile before doing anything.
3. **Re-read the relevant subsection** of the audit file for the full bullet description. The bullet text in the subsection is more detailed than the plan table.
4. **Verify the current code state** matches the audit description. The code may have moved since the research pass; a bullet that describes a file that no longer exists must be handled per the "code proves concern is unreal" rule (see link below).
5. **For non-trivial bullets, enter Plan Mode first.** Plan Mode rule: any bullet that touches a full package (1.2.B/C/D, 1.3.A, 1.4.A, 1.5.A/E) warrants Plan Mode. Localized single-file edits skip it. If unsure, enter.
6. **Implement the bullet.** Follow any technical preferences from CLAUDE.md (project + user global) and the rule files linked below. Keep the bullet atomic — one bullet, one commit. Filing new findings inline as new bullets in the audit doc is explicitly allowed (and required) per `feedback_audit_doc_is_living.md`.
7. **Run local checks before committing** (in addition to lefthook pre-commit):
   - `pnpm check-types` (15/15 must be green)
   - `pnpm lint` (15/15 must be green)
   - `pnpm test` (current baseline: 236 tests across 23 files; Neon flake hits ~1 in 4 runs, retry once)
   - `pnpm dep:check` (added in 1.3.A — MUST be 0 violations; if it fires, fix code or carve out a rule, never weaken severity)
   - `pnpm dep:graph` only if your change affects the package-level dep graph (new package, moved entity). Commit the regenerated `docs/DEPENDENCY-GRAPH.md` alongside.
8. **Commit with a descriptive message.** Lowercase subject (commitlint rule). Allowed types: `feat|fix|docs|style|refactor|test|chore|revert|perf`. No `ci` type — use `chore(ci): ...` instead. No Co-Authored-By, no Generated-By (user rule). Reference the bullet number in the body if helpful.
9. **If pre-commit fails on Neon flake** (`Can't reach database server at ep-royal-wind-...`), retry the commit ONCE before investigating. It's the known local flake documented above.
10. **Follow-up hash-recording commit** (standard pattern from 1.2/1.3): `docs(audit): record 1.x.y commit hash in implementation plan` — just updates the audit doc table with the commit hash. Keeps the main commit's hash stable.
11. **Update this handoff file** with: (a) new current state (last commit, branch ahead count, gate status), (b) mark the just-finished bullet as ✅ with one-paragraph summary, (c) flip the next bullet to ⏳ NEXT, (d) add any lessons learned to the appropriate `### 1.x.y` subsection, (e) if new bullets were filed mid-commit, list them.
12. **STOP and wait for user "ок" before starting the next bullet.** This is the `feedback_no_pause_between_steps.md` rule: during the audit, pause after every commit and do not silently continue. Exception: if the user has explicitly said "go" / "делай N подряд" / equivalent for a bounded scope, execute that scope as a unit without pausing between bullets inside it. Normal default is pause; override only on explicit user directive. Inside a single bullet, keep going without asking (don't pause between "implement" and "commit" and "hash follow-up" — those are one atomic unit).

## Rule references — load on demand

These files live alongside this one in the memory directory. When you hit a decision that might touch them, read them.

- **`feedback_no_compromises_audit_standard.md`** — **READ FIRST, ALWAYS.** The FAANG/M7 filter for every audit decision. 6-12 month outlook, zero tolerance for "interim" placement, "temporary" homes, or "pragmatic compromises". Formalized after 1.4.B fell. Applies to every single commit from now to audit close.
- **`feedback_audit_doc_is_living.md`** — the audit document is a living artifact. Add new findings as bullets during research, never keep them only in chat. **Never delete a bullet** without proof that the concern is not real.
- **`feedback_no_accommodation_of_crutches.md`** — during refactors, never silently work around legacy structure. If something doesn't fit the new design, either fix it in this commit or file an explicit new bullet in the audit doc. Silent deferral is forbidden.
- **`feedback_use_plan_mode.md`** — enter Plan Mode for multi-file refactors, cross-package reorgs, and schema changes. Skip it for localized edits. During the big-tech audit specifically, bullets that touch a full package (1.2.B/C/D/I/J, 1.3.A, 1.4.A, 1.5.A/E) warrant Plan Mode; single-file bullets don't. Rule of thumb: if you need to decide where to put things (new directory, new package, new convention), use Plan Mode. If you're editing files you already know, skip it.
- **`feedback_no_low_impact_excuse.md`** — never skip fixes OR delete plan items with "low impact", "minor", "cosmetic", "doesn't affect anything" reasoning. The only legitimate reason to remove a bullet is code-level proof that it was a false positive.
- **`feedback_decision_split.md`** — technical decisions (commit granularity, file organization, refactor approach, library choice between comparable options) are made solo at FAANG staff+ level. Do not ask the user about them. Business decisions (feature priorities, user-visible trade-offs, revenue, deadlines) are escalated with a concrete recommendation.
- **`feedback_stale_docs.md`** — during audit/refactor work, the source of truth is the code, not old documentation. If a doc is more than a few months old and the project is active, treat the doc as a historical artifact.
- **`feedback_no_low_priority.md`** — every audit finding has priority 1. There is no "low priority" tier, just "not yet implemented".
- **`feedback_system_thinking.md`** — trace the full data flow (DB → contract → API → UI) before writing code. Never hardcode CMS content.
- **`feedback_no_overengineering.md`** — minimal changes to shared components. Children handle their own layout.
- **`feedback_no_cross_module_imports.md`** — never import between app modules. Extract to shared lib first.
- **`feedback_nextjs16_proxy.md`** — Next.js 16 uses `src/proxy.ts` as the middleware convention. No `middleware.ts` file is needed.
- **`user_role_expectations.md`** — think and act as Architect + Engineer + PM + PO + BA, all at M7/FAANG level. World-class committee, not a junior developer.
- **`project_db_empty.md`** — the database is empty, no real users or data. Schema can be wiped and recreated freely. No migration constraints from existing data.

Also relevant (in the repo, not in memory):

- **`CLAUDE.md` at repo root** — project rules, anti-patterns, architecture conventions. Mandatory read if you touch code, not just docs.
- **`docs/adr/`** — 14 ADRs documenting all architectural decisions backfilled in section 1.1.

## Cleanup trigger — when the audit closes

When the final bullet of section 12 is checked off and all 12 sections show `[x]` in the `BIGTECH-AUDIT.md` progress tracker:

1. Remove the `⚠ ACTIVE WORK` block at the top of `~/.claude/projects/-home-maksim-projects-contrib-the-discipline-program/memory/MEMORY.md`.
2. Remove the `BIG TECH AUDIT IN PROGRESS` paragraph from the project `CLAUDE.md` (the one at repo root, not the user global).
3. Delete this file (`project_audit_in_progress.md`).
4. Keep `docs/BIGTECH-AUDIT.md` as a historical record — do not delete it. It becomes an artifact of the refactor pass.
5. Keep the `docs/adr/` directory and all ADRs — those are permanent records, not audit-scoped.

This cleanup is part of the audit's own completion ritual. Do not skip it — stale handoff pointers are worse than no pointers at all.

## Do not

- Rewrite the audit document from scratch.
- Skip the research phase of a new section because "I already know the patterns".
- Delete or demote audit bullets for non-code reasons.
- Ask the user permission for technical micro-decisions (commit size, file layout, refactor sequence).
- Bundle multiple bullets into one commit.
- Ignore the cleanup trigger when the audit closes.
- **Accept any decision that you would describe using the words "interim", "temporary", "pragmatic compromise", "OK for now", "until X lands", "will clean up in a follow-up", or "this is close enough".** These are STOP signals. See `feedback_no_compromises_audit_standard.md`. Fix properly or defer the bullet.
- **Chain audit bullets without user "ок".** Per the audit pause rule (`feedback_no_pause_between_steps.md`), stop after every commit (implementation AND follow-up hash) and wait for the user to say "ок" before starting the next bullet.
