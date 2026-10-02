# Step 4.1a — Publish writes its own snapshot: the coach → app loop without the legacy API (apex-sunset P4.1a)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**) and
run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER session
that spawned you — not the repo owner) → implement → internal review (review-flow's triage
is the ruling; apply its fix-now set in one pass) → PR. This file is skill INPUT, not a plan
override; where it pins a live-verified fact, trust it over guessing, and verify anchors
against the tree.

**This is a production fix.** Work in the order that gets a correct PR open soonest; do not
widen the scope.

## Mission

Since the apex cutover (2026-09-17) nothing a coach publishes reaches the iOS app. The
publish path is still legacy-first: it reads the day from the legacy API, writes the day to
the legacy API, and only then records our snapshot from the legacy response. The connector's
base URL is the apex, and the apex is now this platform's own shim, which has no program
write routes. Every day of every publish run ends as `failed`; the ledger has no row
published after 2026-09-13; the app has shown no General day after 2026-09-20.

D-4 already ratified the end state: publish renders the day with the existing projection and
stores the result as a snapshot in our database; the shim serves snapshots. This step makes
the publish path do exactly that, with no outbound call at all, and removes every coach-side
dependency on a legacy session (connect, reconnect, token expiry).

One delivery PR, five deliverables:

1. Publish writes the snapshot straight from the projection; statuses come from our ledger.
2. The wire `id` the app receives is minted locally (AS-14).
3. Links stop requiring a legacy connection; ownership is the plan's.
4. Training levels and the mobile-athlete picker are served from our own data.
5. The coach UI loses connect / reconnect / conflict-overwrite.

Not yours (step 4.1b, do not start it): dropping `MobileConnection` and `connectionId`,
deleting the token cipher, `token-expiry.ts`, `connections.ts` and its route,
`infrastructure/legacy-mobile/`, `@repo/env/mobile-publish`, the two env variables, the
`contracts/coaching/legacy-mobile` schemas, the `program-dto.ts` barrel edge, AS-21, AS-24,
CI.

## Read before planning

- `initiatives/apex-sunset/{charter.md,decisions.md}` — the Sacred list, D-4, D-7, D-8.
- `initiatives/mobile-publish/decisions.md` D-18 (all rounds) — the week / lifetime status
  contract and the publish-modal run guards. They survive this step byte for byte.
- `docs/planner-discipline.md` (a)–(i).
- Server, verbatim: `packages/api-server/src/endpoints/coaching/mobile-publish/**`,
  `src/authz/{mobile-publish-guards.ts,lms-guards.ts}`,
  `src/endpoints/mobile-compat/{get-program.ts,program-dto.ts,legacy-catalogs.ts}`,
  `src/mappers/coaching/mobile-link.mapper.ts`, `src/test/published-snapshot.ts`,
  `prisma/schema.prisma` (`MobileConnection`, `MobilePublishLink`, `MobilePublishedDay`,
  `MobileLegacyIdentity`), the two newest directories under `prisma/migrations/`.
- Contracts: `packages/contracts/src/entities/coaching/{mobile-publish,mobile-link,mobile-connection,legacy-mobile}/**`.
- Client: `apps/platform/src/modules/plan-detail/components/{publish-week-modal,publish-results-panel,mobile-publishing-strip,manage-mobile-links-modal,individual-links-section,individual-link-row}.tsx`
  and their tests; `modules/coach-profile/{sections/mobile-app-section.tsx,components/connect-mobile-modal.tsx,views/coach-profile-view.tsx}`;
  `lib/{hooks/use-mobile-publish.ts,api/endpoints/mobile.ts,api/keys.ts,api/is-reconnect-required.ts,config/publish-result-chips-config.tsx,mobile.fixtures.ts}`;
  `app/api/platform/mobile/**/route.ts`.

## Live-verified facts (planner, 2026-10-02 — AUTHORITATIVE)

**Why publish fails today.** `publish-day.ts` awaits `args.ops.getProgram(...)` before any
decision and calls `recordPublishedDay` only with a row returned by the legacy write.
`publish.ts` catches the per-day error and pushes `{ action: "failed", legacyRowId: null }`.
Probed against production without auth: `GET /api/v1/generalProgram?...` → 404,
`GET /api/v1/individualProgram?...` → 404, `GET /api/v1/user?userPlanId=2` → 405,
`GET /api/v1/trainingLevel/all` → 200. The shim serves seven routes
(`auth/signin`, `program`, `trainingLevel/all`, `user`, `user/[id]`, `user/changePassword`,
`userPlans`) and none of the connector's write paths.

**Production ledger (read-only, ids and counts only).** `app_mobile_published_days`: 303
rows, none without content (`isRestDay IS NULL` → 0). `legacyRowId` ranges 279 … 990385; the
values from 990000 up are the demo universe's (`scripts/shim-demo-days.ts`,
`LEGACY_ROW_ID_BASE + offset`), the rest are legacy primary keys. Seven links; for all seven
`plan.creatorId` equals the user behind `link.connection.coachProfile` — plan ownership and
connection ownership name the same coach on every existing link. Legacy identities: 14 on
the General plan, 6 on the Individual plan (`legacyPlanId = 2`), one of them the demo athlete
(`legacyUserId 990001`); a second synthetic test athlete (`990002`) is being added today.

**The read path this step must keep feeding.** `mobile-compat/get-program.ts` serves
`mobilePublishedDay.findFirst({ where: { scheduledDate, isRestDay: { not: null }, link: channel + level | user }, orderBy: [{ publishedAt: "desc" }, { legacyRowId: "desc" }] })`
and `program-dto.ts` emits `id: row.legacyRowId`. The table carries the `rest_xor_program`
CHECK: a rest day stores `dailyProgram` as `Prisma.DbNull` (never `Prisma.JsonNull`); a
training day stores `isRestDay: false` with a non-null program. `isRestDay: false` with a
null program is a `fatalError` on the app's main screen and is unrepresentable at three
layers today — keep all three.

**Hashing.** `day-content-hash.ts` (`dayContentHash`, `toHashable`) is the shared helper the
publish path, the backfill and the demo script all use. Every existing ledger row's
`contentHash` was computed with it over the same shape the projection yields, so "stored
hash equals the fresh projection's hash" is a sound unchanged-day test.

**Repository facts.**

- `MobilePublishedDay.legacyRowId` is `Int`, NOT NULL, no default, not unique (the legacy
  general and individual tables had overlapping key spaces). `MobilePublishLink.connectionId`
  is `String`, NOT NULL, FK → `MobileConnection` with `onDelete: Cascade`.
- `verifyMobileLinkOwnership` (`authz/mobile-publish-guards.ts`) resolves ownership through
  `link.connection.coachProfile.userId`. `links.ts` `createLink` requires a
  `MobileConnection` row ("Connect the mobile app first") and `listLinks` filters
  `connection: { coachProfileId }` after `verifyPlanOwnership`.
- The local seed creates no `MobileConnection`: today a link cannot be created locally
  without a live legacy harness.
- `training-levels.ts` and `athletes.ts` decrypt the stored token and call the legacy client;
  their response contracts are `getTrainingLevelsResponseSchema`
  (`{ id, name }[]`) and `getMobileAthletesResponseSchema`
  (`{ id, username, firstName, lastName }[]`).
- `mobile-compat/legacy-catalogs.ts` holds `LEGACY_TRAINING_LEVELS` (the four levels) and
  `LEGACY_PLAN_INDIVIDUAL = 2` — the SSOT the import and the shim already use.
- `mobile-publish.integration.test.ts` is gated by `RUN_LEGACY_INTEGRATION=1` and drives the
  publish path against a live legacy harness.
- The PROD-GUARD hook refuses Edit / Write on `prisma/migrations/`. A NEW migration is
  authored through the shell (`prisma migrate diff --from-schema-datamodel <old> --to-schema-datamodel <new> --script > <dir>/migration.sql`,
  appended to with shell redirection). Migrations apply atomically only without explicit
  `BEGIN` / `COMMIT`.
- Hooks: pre-commit = `check-secrets` + `lint-staged`; pre-push = `dep:check` + `turbo run
lint check-types --filter="...[origin/main]"`; commit-msg = commitlint. `main` requires
  six green checks: Build, Dependency boundary check, Format check, Lint, Tests, Type check.
- `endpoints-di-bootstrap.test.ts` pins the api-server `package.json` exports; add no export.

## Rulings this step is built on

- **D-4.** Publish = project the day, store the snapshot, serve the snapshot. No network.
- **D-18.** The links aggregate (`publishedDayCount`, `lastPublishedAt`, `weekPublish`) and
  the strip / modal semantics do not change. The modal's run guards (run id, the snapshotted
  links and start date, the in-flight ref, the same-week reopen) stay exactly as they are.
- **Charter Sacred.** The iOS wire contract does not move by a byte; production data is
  additive-only.
- **Planner rulings for this step** (argue at the plan gate with a reason from the tree,
  otherwise build them):
  - **The decision is ours and has three outcomes.** For a (link, date): no ledger row →
    insert → `created`; a row carrying content whose `contentHash` equals the projection's
    hash → no write, `publishedAt` untouched → `skipped`; anything else (different hash, or
    a content-less row) → update content, hash and `publishedAt` → `updated`. Keep the
    decision a pure function with its own test, as `decide-publish-action.ts` is today.
  - **`conflict` and `overwriteUnowned` are deleted, not kept dormant.** Nothing foreign can
    hold a day any more. `MOBILE_PUBLISH_ACTIONS` becomes `created · updated · skipped ·
failed`; `overwriteUnowned` leaves `publishMobileSchema`; the overwrite confirmation
    leaves the modal. `failed` stays as the per-day isolation it is: one day throwing must
    not fail the run, and it still logs `mobile.publish.day_failed`.
  - **The wire id is minted by the database and is stable per day.** `legacyRowId` gets a
    sequence default starting at **1 000 000** (above every id in the ledger, legacy and
    demo). An insert omits it; an update never changes it; a script that supplies its own
    value (the demo days, the test helper) keeps working. The column is not renamed and
    gains no unique constraint. `PublishDayResult.legacyRowId` stays in the contract and
    carries the row's id (`null` for `failed`).
  - **A link belongs to its plan's coach.** `connectionId` becomes optional; `createLink`
    no longer reads `MobileConnection`; new links are created without one;
    `verifyMobileLinkOwnership` and `listLinks` resolve access through the plan with the
    same rule `verifyPlanOwnership` applies (reuse it, do not re-derive it). Existing rows
    keep their `connectionId` untouched.
  - **Levels come from the catalog; the athlete picker comes from the identities.**
    `listTrainingLevels` returns `LEGACY_TRAINING_LEVELS`. `listIndividualAthletes` returns
    the legacy identities on the Individual plan as `{ id: legacyUserId, username: the
user's email, firstName, lastName }`, **without the synthetic ones** (the demo athlete
    and test athletes, `legacyUserId` ≥ 990000 — D-8 reserves that range). Bring the exact
    exclusion rule and its home to the plan gate; a named constant beside the catalogs with
    a test is the planner's lean. Neither call touches a token or a connection; both keep
    their response contracts and their coach-only route guards.
  - **Delete what this step orphans, nothing more.** `channel-program-ops.ts`,
    `reconnect-signal.ts`, `MOBILE_RECONNECT_REQUIRED`, `is-reconnect-required.ts`, the
    connect modal, the profile section, their tests and fixtures go when nothing imports
    them. Whatever only the connection endpoints still use (`connections.ts`, the cipher,
    `token-expiry.ts`, the REST adapter, the connections route, the `mobile-connection`
    connect / connection schemas) is 4.1b's and stays untouched even though the UI stops
    calling it.

## Deliverable 1 — publish from our own ledger

`publish.ts` / `publish-day.ts`: load the link (plan, channel, level or athlete), load and
sort the target days and exercises as today, and for each day project, hash, decide, write.
No `legacyClient`, no token, no `expiresAt` check, no `UnauthorizedError` branch. The
snapshot is built from the projection result (`projected.isRestDay`, `projected.dailyProgram`)
with the XOR rule above. The write must be safe under two concurrent runs for the same
(link, date): no duplicate row, no `P2002` surfacing as `failed` for a benign race.
`createPublishApi` takes no legacy client; `createMobilePublishApi` passes it only where it
is still used.

## Deliverable 2 — the local wire id

`schema.prisma`: a database default on `MobilePublishedDay.legacyRowId` backed by a
sequence. One new migration, authored through the shell: the sequence, the column default,
the sequence owned by the column, `setval` so the first minted id is 1 000 000, and the
`connectionId` relaxation of deliverable 3 (`DROP NOT NULL`). Nothing else: no data
rewrite, no drop, no index change. **The owner approved the sequence-and-default migration
at the contour (2026-10-02); the `connectionId` line is new and needs his word — bring the
complete SQL to the plan gate and write no migration file before the planner answers.**
State in the PR's rollout note that the migration must be applied before the deploy serves
(old code on the new schema is safe: it supplies both columns itself).

## Deliverable 3 — links without a connection

As ruled above. `links.test.ts` gains: a coach with no `MobileConnection` creates a General
and an Individual link; a coach cannot list, publish through or delete a link on another
coach's plan; an existing link that still carries a `connectionId` behaves identically.

## Deliverable 4 — levels and athletes from our data

As ruled above. Tests: the four levels in catalog order; the picker lists Individual-plan
identities only, excludes the synthetic range, includes legacy-disabled identities (the
legacy list did), and returns the user's email as `username`.

## Deliverable 5 — the coach UI

- `publish-week-modal.tsx`: no reconnect branch, no `ConnectMobileModal`, no overwrite
  confirmation, no `overwriteUnowned` in the mutation. Every D-18 guard and its test stays.
- `publish-results-panel.tsx`: the `reconnect` outcome and `onReconnect` go.
  `publish-result-chips-config.tsx`: the `conflict` chip goes.
- `mobile-publishing-strip.tsx`, `manage-mobile-links-modal.tsx`,
  `individual-links-section.tsx`: no `useMobileConnections`, no "not connected" or
  "connection expired" states, no connect modal; levels and athletes queries are always
  enabled; the strip hides only while links load.
- `coach-profile`: the "Mobile app" section and the connect modal are removed from the view
  and deleted. `useMobileConnections`, `useConnectMobile`, `api.mobile.connect`,
  `api.mobile.listConnections`, their query keys and fixtures go with them.
- No new screen, no new copy beyond what removing a state forces. List every user-facing
  string you add or change in your report.

## Tests that must exist

- A database-backed publish vertical: a week with training days and a rest day publishes as
  `created`; the rows carry content, the right hash, an id ≥ 1 000 000; an immediate second
  run is all `skipped` with `publishedAt` unchanged; editing one day and publishing again
  gives one `updated` whose id did not change and whose `publishedAt` moved.
- The same vertical read back through `createGetProgramApi().getProgram` for a General and
  an Individual identity: the day the coach published is the day the shim serves, `id`
  included, rest day included.
- A day whose projection throws yields `failed` for that day and does not stop the rest.
- A source-level guard: `publish.ts`, `publish-day.ts`, `links.ts`, `athletes.ts` and
  `training-levels.ts` import nothing from `infrastructure/legacy-mobile` except types, and
  nothing from the cipher.
- The gated legacy integration test: delete the publish half that can no longer be true, or
  rewrite it against the database; say which at the plan gate.
- Each new test shown to fail under at least one mutant of the code it pins; name three in
  your report (for example: the unchanged-day branch always writing, an update that
  re-mints the id, the picker including the synthetic range).

## Scope fence

- **Touch:** `packages/api-server/src/endpoints/coaching/mobile-publish/**` (except
  `connections.ts`, `legacy-token-cipher.ts`, `token-expiry.ts` and their tests);
  `src/authz/mobile-publish-guards.ts`; `src/test/published-snapshot.ts` only if the default
  requires it; `prisma/schema.prisma` and ONE new directory under `prisma/migrations/`;
  `packages/contracts/src/entities/coaching/mobile-publish/**`; the client files named in
  deliverable 5 and their tests; `apps/platform/src/lib/{hooks/use-mobile-publish.ts,hooks/index.ts,api/endpoints/mobile.ts,api/keys.ts,api/is-reconnect-required*.ts,config/publish-result-chips-config.tsx,mobile.fixtures.ts}`;
  the runbook `docs/runbooks/mobile-publish-legacy-connector.md` (a short "superseded for
  publishing as of 4.1a" note at the top, nothing else).
- **Do NOT touch:** `endpoints/mobile-compat/**` (read it, import its catalog, change
  nothing), `infrastructure/legacy-mobile/**`, `packages/env/**`, `turbo.json`,
  `.github/**`, lockfiles, existing migrations, `scripts/**`, `apps/admin/**`,
  `apps/marketing/**`, `apps/platform/src/app/api/v1/**`,
  `app/api/platform/mobile/connections/route.ts`, `initiatives/**`, `CLAUDE.md`, any `.env*`.
  No new dependency, no new api-server export subpath.
- **Secrets and production.** Never read `.env.prod`, `apps/*/.env.local` or any `.env*`
  besides `.env.example`; never connect to a production or Neon database; never print an
  env value.

## Acceptance gates (verify yourself before the PR)

- `pnpm --filter @repo/contracts test`; the api-server suite green in your own throwaway
  container (`task test:api TDP_DB_PORT=<your port>`); the platform project
  (`pnpm exec vitest run --project platform`, fenced) green.
- `pnpm check-types`, `pnpm lint`, `pnpm dep:check`, `pnpm format:check` clean; the platform
  app builds (fenced, `NODE_OPTIONS=--max-old-space-size=3072`).
- `prisma migrate deploy` on a fresh throwaway database applies the whole history; the
  first id minted after it is 1 000 000.
- Grep gates: `overwriteUnowned`, `MOBILE_RECONNECT_REQUIRED`, `isReconnectRequired`,
  `useMobileConnections`, `useConnectMobile`, `ConnectMobileModal`, `MobileAppSection` — no
  hit under `apps/platform/src` or `packages/contracts/src`; `"conflict"` — no hit in the
  mobile-publish contract, the chips config or the modal; `decryptLegacyToken` — hits only
  where the connection endpoints still need it.
- The PR contains no file under `initiatives/` and no `CLAUDE.md`.
- PR body per the PR-body law: the change, its rollout note, and the owner's browser-gate
  checklist AS CHECKBOXES — a coach with no mobile connection links a level and an athlete;
  publishes the open week and sees `Created`; publishes again and sees `Skipped`; edits a
  day, publishes, sees one `Updated`; the strip's week status and the Manage modal's
  lifetime status follow; the coach profile has no "Mobile app" section; no reconnect or
  overwrite prompt appears anywhere.

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any committed
  file; synthetic fixtures only.
- No comments in code; delete comments in regions you edit.
- Commitlint: lowercase subject, body lines at most 100 characters, long bodies through
  `git commit -F`; never `--no-verify`; no signatures or attribution lines anywhere.
- Branch `fix/mobile-publish-own-snapshot` from `main`; one PR against `main`; the
  repository squash-merges, so never stack this branch on another.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence after
  every subagent round; nothing of value sits uncommitted while a subagent may be alive.
- Capped run: at most ONE internal subagent alive at a time; no parallel fan-out; stages
  strictly sequential.
- Resource fence (WSL): every heavy command inside `systemd-run --user --scope -q
--slice=heavy.slice -p MemoryMax=4G -p MemorySwapMax=1G -- <cmd>`, builds with
  `NODE_OPTIONS=--max-old-space-size=3072` in the caller's environment, vitest
  `--maxWorkers=2`, turbo `--concurrency=2`, one heavy command at a time.
- Databases: your own throwaway container (`postgres:17-alpine`, `--memory=512m`, a free
  port, the stack's init directory mounted; `task stack:migrate TDP_DB_PORT=<port>` then
  `task test:api TDP_DB_PORT=<port>`); the shared stack (`tdp`, `tdp_test`, `tdp_shadow`,
  `prod_snap`) and every other container on the host are not yours.
- End every turn declaring where you left the tree (branch, clean or dirty, last commit).

## Plan-gate report

Bring, each with your recommendation and never as an option list: the decision function and
the write (how the concurrent-run case is closed); the migration's complete SQL; the
ownership change and every call site of `verifyMobileLinkOwnership` and of the
`connection: { coachProfileId }` filter; the synthetic-identity exclusion rule and its home;
where the publish module imports the level catalog from and whether dep-cruiser agrees; the
fate of the gated legacy integration test; the full list of files this step deletes; every
consumer the (f) and (g) passes found beyond the inventory above; anything in this file the
tree contradicts.

## PR-open report

For the planner, not the PR body: the internal review's candidates before any cap against
reported, the refuted count, every finding with its bucket in one line; the three mutants;
every user-facing string added or changed; the tree state.
