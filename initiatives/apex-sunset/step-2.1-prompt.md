# Step 2.1 — users import (apex-sunset P2.1)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**)
and run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER
session that spawned you — not the repo owner) → implement → internal review → PR.
This file is skill INPUT, not a plan override; where it pins a live-verified fact,
trust it over guessing, and verify anchors against the tree.

## Mission

Every legacy account keeps working after cutover — same login, same password. Build the
idempotent users-import script that carries ALL legacy `users` rows into the platform:
`User` rows + `MobileLegacyIdentity` rows + bcrypt password-hash carry-over (D-3), with
a dry-run report (created / matched / conflicts) as its default mode. Also close AS-7
(bcrypt cost oracle) with an upgrade-on-verify in the shared auth service, and AS-10
(catalog-id validation) inside the import. The PROD run is NOT yours: you ship the
script + tests + runbook and verify the full vertical on dev; the planner/owner run
prod after merge (dry-run report → owner ok → apply).

## Live-verified facts (recon 2026-08-20 — AUTHORITATIVE)

**Legacy source (restored prod dump, container `tdp-dump-verify`, PG 17.5, db
`prod_snap`, reachable at `127.0.0.1:5544`, user `postgres`, password `snap`):**

- `users` columns: `id` (int PK), `username` varchar(100) UNIQUE, `password`
  varchar(100), `user_role_id` int NOT NULL DEFAULT 1, `training_level_id` int NOT NULL
  DEFAULT 1, `first_name`/`last_name` varchar(32) NULL, `phone_number` varchar(20) NULL,
  `date_of_birth` date NULL, `team_id` int NULL, `user_plan_id` bigint NOT NULL DEFAULT 1,
  `is_enabled` boolean NOT NULL DEFAULT false.
- **19 rows, ids 1..24** (gaps: 4, 12–15). All hashes are bcrypt `$2a$10$`, length 60.
  8 rows disabled (ids 6,7,8,9,10,11,19,21). `team_id` is NULL on every row. Roles seen:
  1,2; plans seen: 1,2 (six rows on plan 2 = Individual: ids 9,16,18,19,20,24); levels
  seen: 2,3,4. About half the rows have empty first/last name; some have phone/DOB.
- **`username` is an email on 18 of 19 rows.** The exception is id 17, username literal
  `admin` (role 2, enabled) — the owner ruled it junk (2026-08-20): import it with the
  synthetic email `legacy-admin@thedisciplineprogram.com` AND `isEnabled: false`
  (force-disabled overriding the dump — a junk account must not gain shim/web login via
  a synthetic address). Do NOT create any mailbox for that address (standing law: no
  mailboxes for synthetic addresses — a password-reset mail would carry a live token).

**Platform side:**

- `MobileLegacyIdentity` (schema.prisma:197): `userId` String @unique → User (Cascade),
  `legacyUserId` Int @unique, `legacyRoleId`/`legacyPlanId`/`legacyLevelId` Int NOT NULL,
  `isEnabled` Boolean @default(false), `firstName?`/`lastName?` String,
  `phoneNumber?` String, `dateOfBirth?` DateTime @db.Date. **The schema is COMPLETE for
  this step — no Prisma migration is needed or allowed.**
- In prod the identity table holds exactly ONE row: the P1.4 demo athlete
  `legacyUserId 990001` / `demo-athlete@thedisciplineprogram.com` (outside 1..24 by
  design — the import can never collide with it, and must never touch it).
- `iamAuthService.validateUser` (endpoints/iam/auth-service.ts) is the SINGLE credential
  check for BOTH the web login (packages/auth/src/auth-options.ts) and the shim signin
  (endpoints/mobile-compat/signin.ts). It normalizes the login as
  `email.toLowerCase().trim()` and looks up `prisma.user.findUnique({where: {email}})`
  → **the import MUST write normalized-lowercase emails** or the user can never log in.
  It compares against `User.password` (bcryptjs), with a `DUMMY_BCRYPT_HASH` (cost 12)
  burn on user-not-found and an over-length guard (`AUTH_CONSTANTS.MAX_PASSWORD_LENGTH`).
- `AUTH_CONSTANTS.BCRYPT_COST_FACTOR = 12`
  (packages/contracts/src/entities/iam/auth/auth.constants.ts). Legacy hashes are cost
  10 → AS-7's timing oracle arms the moment the import lands (see rider below).
- `MobilePublishLink` (schema.prisma:152) carries `channel` (GENERAL/INDIVIDUAL),
  `legacyLevelId Int?`, `legacyUserId Int?`, `athleteId String?` → User. INDIVIDUAL
  links from the mobile-publish era are the AUTHORITATIVE `legacyUserId ↔ athleteId`
  mapping — stronger evidence than an email match.
- Legacy catalog SSOT: `endpoints/mobile-compat/legacy-catalogs.ts` — roles 1–2,
  plans 1–2, levels 1–4, `LEGACY_PLAN_INDIVIDUAL`. AS-10 validation imports from THIS
  module; never a copied literal list.
- `parseLegacyDate`/`serializeLegacyDate` (endpoints/mobile-compat/wire-schemas.ts)
  already implement the `yyyy-MM-dd` ↔ UTC-midnight `@db.Date` convention — reuse for
  `date_of_birth` (memory `db-date-utc-format`: never device-local).
- Script patterns, both MANDATORY reading before the plan:
  - `packages/api-server/scripts/audit-profile-selections.ts` — the `isDirectRun`
    testability pattern (exported pure logic + `main()` only on direct run). AS-15 makes
    this pattern MANDATORY here; an unconditional `main()` with unexported guards is a
    named anti-pattern (it forced two review rounds to prove the demo seed by execution).
  - `packages/api-server/scripts/shim-demo-{seed,universe,days}.ts` — the guard-layer
    semantics to REPLICATE (as tested, exported functions this time): dry-run by
    default; `--write` requires `--expect-host=<hostname>` matched against the RESOLVED
    host of the target DSN; a hostless DSN and an empty `--expect-host=` are both
    rejected; a repeated flag throws; the DSN is NEVER printed (not even in errors);
    abort loudly rather than touch a foreign row.

## Design (planner-ratified contour — owner ok 2026-08-20)

**Source = a JSON export file** (`--source=<path>`), zod-validated on load; the script
opens NO second database connection. The runbook documents the one-liner export from
the dump container (psql `json_agg(row_to_json(u))`). Rationale: no legacy DSN handling
in the script, fixture-friendly tests, and apply-day freshness is solved by re-running
the export against a fresh dump (SSH recipe exists from P0.2).

**Target = the platform DB via the ambient Prisma client** (`DATABASE_URL`), guarded by
the demo-seed guard layer above.

**Classifier — a pure, exported function; four match levels in strict priority order.**
For each legacy row (with normalized email; id 17 remapped per the fact above):

1. **identity-exists**: a `MobileLegacyIdentity` with this `legacyUserId` already exists
   → re-run refresh (see idempotency below).
2. **link-match**: an INDIVIDUAL `MobilePublishLink` with this `legacyUserId` and a
   non-null `athleteId` exists → attach the identity to THAT user (merge — this is what
   makes the Trello "no duplicates" hold for already-linked athletes).
3. **email-match**: a `User` with the normalized email exists → attach the identity to
   that user.
4. **create**: none of the above → new `User` + identity.

**Conflicts — classified, reported, NEVER written:** link-match and email-match disagree
(link says user X, email says user Y ≠ X) · the matched user is soft-deleted
(`deletedAt` set) · the matched user already has a legacyIdentity with a DIFFERENT
`legacyUserId` · catalog id out of range (AS-10: role ∉ 1–2, plan ∉ 1–2, level ∉ 1–4) ·
two source rows normalize to the same email · a source row whose username is not a valid
email after the id-17 remap. (All 19 current rows pass the catalog check — the guard is
for future re-runs against fresh dumps.)

**Write policies:**

- **create**: `User { email: normalized, name: "First Last" from identity fields when
present else null, role: ATHLETE, password: the legacy hash VERBATIM }` — platform
  role is ALWAYS `ATHLETE`; legacy role 2 maps into `legacyRoleId` ONLY, never into
  platform privileges. Plus the full identity row (all seven legacy fields, `isEnabled`
  mirrored from the dump — except id 17, forced false). Create NOTHING else — no
  AthleteProfile, no subscriptions, no links; platform flows create those lazily.
- **link-match / email-match**: create the identity row attached to the existing user;
  do NOT touch `User.password`, `role`, `name`, or `email` — the platform credential
  wins, the person signs into the app with their platform password (owner-acknowledged).
- **idempotent re-run (identity-exists)**: refresh the identity's mirror fields
  (role/plan/level/isEnabled/firstName/lastName/phone/DOB) from the source — this feeds
  the AS-12 fidelity guarantee. `User.password` refresh ONLY for import-created users
  and ONLY when the stored hash differs from the source hash AND the stored hash is
  cost 10 (a differing cost-12 hash means a platform-side change — report a warning, do
  not overwrite). Deletions: NEVER — a source row vanishing (won't happen; guard anyway)
  is a reported warning, not a delete.
- All writes in ONE transaction; any conflict present → apply aborts entirely (report
  everything, write nothing) unless the report is conflict-free.

**Report (stdout, both modes):** per-class listing — created (legacy id, email, plan/
level/role, enabled), matched (legacy id → platform email, matched-by: identity|link|
email), conflicts (legacy id, reason), warnings. **NEVER print password hashes, DSNs, or
the resolved target host in the dry-run** (P1.4 lesson: the dry-run printing its derived
host made `--expect-host` a circular attestation — the operator must source the hostname
independently).

**AS-7 rider — upgrade-on-verify in `iamAuthService.validateUser`:** after a SUCCESSFUL
password compare, if the stored hash's cost factor is below `BCRYPT_COST_FACTOR`,
re-hash the (in-hand) plaintext at cost 12 and persist it. Do NOT bump `tokenVersion`
(same password — sessions stay valid). Must be race-safe under concurrent logins (an
update conditioned on the password column still holding the old hash is acceptable) and
must NEVER fail the login if the persist fails (log and return the validated user).
Note honestly in code-adjacent tests + PR body: this closes the oracle per-user on first
login; dormant imported accounts keep a residual oracle until they log in — accepted by
the owner (enumeration value: confirming 19 already-known addresses).

## Deliverables

1. `packages/api-server/scripts/legacy-users-import.ts` (+ sibling modules as the
   demo-seed trio does, e.g. a pure classifier module) — guard layer + classifier +
   apply, ALL exported and unit-tested (AS-15), `isDirectRun` entry.
2. AS-7 upgrade-on-verify in `endpoints/iam/auth-service.ts` + tests (upgrade fires on
   cost-10 success; no fire on cost-12; no fire on failed compare; tokenVersion
   untouched; login survives a failed persist).
3. Unit tests: classifier (every match level, every conflict class, priority order,
   id-17 remap+force-disable, email normalization, password-refresh cost heuristic),
   guard layer (every branch: dry-run default, missing/empty/repeated `--expect-host`,
   hostless DSN, host mismatch, no-DSN-in-output), apply layer against a fake client
   (transactionality, never-delete, matched-user fields untouched) — the P1.4 bar:
   each guard branch should die under mutation.
   **Fixtures are SYNTHETIC ONLY — the repo is PUBLIC; real names/emails/hashes from
   the dump must never appear in committed files.** (This prompt file deliberately
   lists ids/counts only.)
4. An opt-in integration probe (pattern:
   `apps/platform/src/app/api/v1/__tests__/shim-demo-stand.integration.test.ts`, env-gated
   e.g. `RUN_LEGACY_IMPORT_CHECK=1`) proving the DoD vertical on dev: after importing a
   harness-exported user set into the dev DB, the shim signin (real route handler)
   succeeds with the KNOWN harness password and returns the legacy integer `userId`,
   and a matched/created user's `GET /user/{id}` serves the mirrored profile.
5. `docs/runbooks/legacy-users-import.md`: export one-liner (dump container → JSON),
   dev rehearsal recipe, prod recipe (`.env.prod` `DATABASE_URL_PROD` pattern from
   `docs/runbooks/appetize-stand.md` — prod `DATABASE_URL` is Sensitive in Vercel, `env
pull` returns the literal `[SENSITIVE]`), apply-day freshness rule (fresh SSH dump →
   fresh export → dry-run → owner ok → apply), and the report-reading guide.
6. Initiative docs close-out IN the feature PR (build-loop law): state.md next-action,
   journal entry, deferred dispositions for AS-7/AS-10/AS-15 (scheduled → their P2.1
   outcome), plan.md 2.1 status.

## Acceptance gates (verify yourself before the PR)

- Unit suites green (run per-package: `pnpm --filter @repo/api-server exec vitest run
<targeted paths>` — the full serial api-server suite is NOT required for this step;
  targeted slices + the fs-only guards are).
- `endpoints-di-bootstrap.test.ts` green locally IF `package.json` exports change (P1.3
  lesson — this fs-only guard runs only in CI otherwise).
- Full dev vertical executed and shown in the report: harness-seeded legacy DB → JSON
  export → dry-run (report sane) → `--write --expect-host=<dev host>` into dev Neon →
  opt-in probe green (signin with known password) → re-run idempotency (second apply:
  zero creates, all identity-exists, zero diffs).
- A dry-run against the REAL `prod_snap` export (19 rows) run locally with the DEV
  target: report shows the expected classes (18 email-shaped + id 17 remapped; expect
  mostly create on dev), zero catalog conflicts. This validates the classifier against
  real data WITHOUT committing any of it.
- **Golden regression 43/43** — you touched `validateUser`, which signin rides:
  `scripts/legacy-harness-seed.sh` then `RUN_LEGACY_INTEGRATION=1 SKIP_ENV_VALIDATION=1
pnpm exec vitest run --project platform src/app/api/v1/` from the REPO ROOT (the
  harness compose lives at `~/projects/contrib/tdp/local/docker-compose.yml`).
- Type-check + lint green on the cone.
- PR body: what/why, the honest AS-7 residual note, and the owner checklist AS
  CHECKBOXES (PR-body law): review dry-run report classes · confirm apply target/date ·
  post-apply smoke expectations. No browser gate — the gate here is the report + the
  planner-run prod apply after merge.

## Scope fence

- **Touch:** `packages/api-server/scripts/**` (new import modules + tests),
  `packages/api-server/src/endpoints/iam/auth-service.ts` (+ its test) — AS-7 ONLY,
  `docs/runbooks/legacy-users-import.md`, `initiatives/apex-sunset/*` (close-out),
  `apps/platform/src/app/api/v1/__tests__/*` (the opt-in probe).
- **Do NOT touch:** `prisma/schema.prisma`, `prisma/migrations/**` (no migration in
  this step — if you believe one is needed, STOP and escalate to the planner),
  lockfiles, CI configs, `endpoints/mobile-compat/**` (the shim is shipped and
  prod-verified; catalogs are imported, not modified), `@repo/contracts`, any UI.
- **Prod is out of your hands:** never point `DATABASE_URL` at prod, never read
  `.env.prod`. Dev Neon + local containers only.

## Standing constraints

- Both repos are PUBLIC — zero secrets/PII in committed files (real dump rows count as
  PII; synthetic fixtures only).
- Prod data is INVIOLABLE (the script itself must guarantee it: adds and its own
  refreshes only, never a delete, never an overwrite of a non-import-created user's
  credential; abort on anything foreign).
- The iOS wire traps are sacred; you are not changing shim endpoints, so the only wire
  surface you can affect is signin timing (AS-7) — behavior-identical on success/fail.
- No code comments; commit messages lowercase (commitlint: subject lowercase, body
  lines ≤150, footer lines ≤100 — long bodies via `git commit -F <file>`); never
  `--no-verify`; branch from `main`, PR against `main`.
- Resource fence (WSL): heavy commands inside `systemd-run --user --scope -q -p
MemoryMax=4G -p MemorySwapMax=1G -- <cmd>`; vitest `--maxWorkers=2`; turbo
  `--concurrency=2`; one heavy command at a time.
- Dev-DB day-to-day work uses the direct (non-pooler) Neon host (memory
  `neon-dev-direct-url`); expect a cold-wake flake on first touch (AS-8) — warm up
  before timing-sensitive assertions.
- `pnpm db:generate` after any branch switch that crosses a schema change.
