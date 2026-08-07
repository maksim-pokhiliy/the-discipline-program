# Step 1.1 — mobile compat shim foundation (apex-sunset P1.1)

Invoke the `/feature` skill with everything below as its argument, and run its full
pipeline: research → plan (STOP at the plan gate and report to the planner session
that spawned you — not to the repo owner) → implement → internal review → PR.
This file is skill INPUT, not a plan override: /feature's own research and planning
stages still run; where this file pins a fact verbatim, trust it over guessing, and
verify anchors against the tree as usual.

## Mission

ADR-0043 (absorb & retire): the platform becomes the ONLY backend for the live
App-Store iOS app by serving the legacy Spring API's wire contract itself under
`/api/v1/*`, so the apex domain can later be repointed with zero Swift changes.
This step builds the FOUNDATION of that compat shim:

1. the `/api/v1` namespace mounted in `apps/platform`,
2. a legacy-format bearer auth wrapper (raw `Authorization` token) in `@repo/api-routes`,
3. `POST /api/v1/auth/signin`,
4. the two public catalog endpoints `GET /api/v1/trainingLevel/all` and `GET /api/v1/userPlans`,
5. the golden contract-test harness that proves shim responses match the live legacy
   backend, byte-compatibly, on one seed.

Later steps add user endpoints (1.2) and the publish-snapshot + `GET /program` serve
(1.3). Build the foundation so those can slot in without rework, but do NOT build them.

## Read before planning

- `initiatives/mobile-publish/legacy-contract.md` — the verified wire contract (the spec).
- `docs/adr/0043-absorb-and-retire-legacy-mobile-stack.md` — the strategy this executes.
- `initiatives/apex-sunset/{charter.md,decisions.md}` — sacred constraints + D-1..D-5.
- `initiatives/mobile-publish/journal.md` — "Re-seed recipe" section (the docker harness).
- `packages/api-routes/src/{auth-wrappers.ts,auth-factories.ts,route-helpers.ts,index.ts}` —
  the session-auth world the bearer wrapper joins.
- `packages/api-server/src/endpoints/coaching/mobile-publish/mobile-publish.integration.test.ts` —
  the gated live-integration pattern the golden suite follows (`RUN_LEGACY_INTEGRATION=1`).
- `packages/api-server/src/endpoints/iam/auth-service.ts` — `validateUser` (reuse it).
- `packages/env/src/mobile-publish.ts` — the env-module pattern to mirror.
- Legacy source (read-only clone, NEVER edit): `~/projects/contrib/tdp/mobile-backend/backend/`
  — `AuthController`, `AuthServiceImpl`, `TokenProvider`, `SecurityFilter`,
  `AuthConfiguration`, `TrainingLevelController`, `UserPlanController`, the DTOs.

## Verbatim wire contract for THIS step (source-read 2026-08-07, backend HEAD `190d9fd`)

### POST `/api/v1/auth/signin` (public)

- Request: `{"username": "<email>", "password": "<plain>"}` (SignInDTO; NO validation
  annotations — no `@Valid`). Legacy lowercases the username before lookup.
- Success 200: `{"userId": <int>, "accessToken": "<jwt>", "userRole": {"id": <int>, "name": "<str>"}, "userPlan": {"id": <int>, "name": "<str>"}}`
  (JwtDTO). `userId` is the LEGACY integer id — the app stores it in UserDefaults and
  sends it on every request; a cuid here kills the Swift decode.
- The `accessToken` is OPAQUE to the app (stored, echoed in `Authorization`). Legacy
  signs HMAC256 `{sub: username, username, exp: now+1 month}`; the shim does NOT need
  to replicate claims — only its own wrapper must verify its own tokens.
- Failure statuses per legacy source (NO `@ControllerAdvice` catches
  `AuthenticationException`, so bad password / unknown user / disabled user all fall
  through to Spring Boot's default → expect 500 with the Boot error JSON): these are
  HYPOTHESES from source — the golden tests MUST pin the real statuses from the live
  harness, and the shim must mirror whatever is pinned. The iOS app treats any
  non-200 as failure and does not parse error bodies.

### GET `/api/v1/trainingLevel/all` and GET `/api/v1/userPlans` (public, no auth)

- 200 arrays of `{"id": <int>, "name": "<str>"}` (Jackson order id,name — key order is
  NOT contractual; ARRAY order IS user-visible in the app's pickers).
- Exact prod catalog rows (pinned from the restored prod snapshot `tdp-dump-verify`,
  2026-08-07 — re-verify with
  `docker exec tdp-dump-verify psql -U tdp -d prod_snap -c "TABLE training_levels"` etc.):
  - `user_roles`: 1 USER, 2 ADMIN
  - `user_plans`: 1 General, 2 Individual
  - `training_levels`: 1 Scaled, 2 Pro, 3 Advanced, 4 "Functional Bodybuilding"
- Legacy serves these via unordered `findAll()` (in practice insertion order = id asc).
  Shim emits id-ascending; golden compares arrays order-sensitively.

### Auth mechanics the wrapper must reproduce (for 1.2+; wrapper ships NOW)

- The app sends the RAW token in `Authorization` — no `Bearer ` prefix. Legacy's
  filter does `authHeader.replace("Bearer", "")`; accept both raw and `Bearer `-prefixed
  forms the same way legacy effectively does.
- Legacy failure semantics (source-read; each becomes a golden case in 1.2 when the
  first authed shim endpoint exists — encode now as unit-tested wrapper behavior,
  clearly marked as legacy-mirroring):
  - protected path, NO `Authorization` header → 403 (Spring `Http403ForbiddenEntryPoint`);
    this is the status the iOS app reacts to with sign-out — never emit 403 for any
    other reason.
  - header present but token invalid/expired → legacy throws out of the filter →
    500-class response (NOT 401/403).
  - token valid but user missing or `is_enabled=false` → 401 `sendError` ("User is disabled").
- Do NOT "improve" these semantics on the wire. Internally the wrapper should be built
  on explicit mapped outcomes so 1.2 golden pinning can adjust statuses in ONE place.

## Deliverables

### 1) Prisma: legacy identity table (additive migration)

A NEW table (planner-ratified: separate table, not columns on `User` — legacy-only
attributes stay out of the core model and die cleanly at the future app redesign).
Suggested shape (final naming/fields = your plan-gate proposal):

- `legacyUserId Int @unique` — the id the app sends; sequence source of truth stays legacy.
- `userId String @unique` FK → `User` (Cascade) — 1:1.
- `legacyRoleId Int`, `legacyPlanId Int`, `legacyLevelId Int?` — catalog refs (plain
  ints; the catalogs are code constants, not tables).
- `isEnabled Boolean` — legacy `is_enabled` semantics (8 of 19 prod users are disabled).
- `firstName String?`, `lastName String?` — legacy profile fields 1.2 will serve
  (platform `User.name` is a single field; do not fold).
- timestamps per house style; `@@map` under the `app_mobile_*` prefix family.

Population happens in P2.1 (users import) — in prod this table stays EMPTY after this
step; goldens seed it locally. Author the migration offline per house practice
(`migrate diff`; see `docs/` if needed), apply to dev Neon (standing approval), never
touch prod.

### 2) api-server: `endpoints/mobile-compat/` domain

New endpoint domain (sibling of `coaching`/`lms`/`iam`), composed like
`create-mobile-publish-api.ts`. Contains:

- `signin` service: reuse `iamAuthService.validateUser` (bcrypt `$2a` compat proven);
  join the identity row; enforce `isEnabled` (and treat a soft-deleted platform user
  as disabled); mint the token; return the JwtDTO shape with legacy catalog names
  resolved from the code constants.
- legacy catalog constants module (the exact rows above) + the two catalog services.
- Wire-shape zod schemas for the shim live IN this domain (api-server-local), NOT in
  `@repo/contracts` — no platform client consumes them; keep the compat surface
  self-contained. If /feature research finds a hard project rule forcing contracts
  placement, raise it at the plan gate instead of silently complying.

### 3) api-routes: bearer wrapper + token module

- Token: `jose` (ADD as a dependency — catalog entry + package dep; owner-approved),
  JWS HS256. Claims: `sub` = platform user id, plus `legacyUserId` and `tokenVersion`;
  `exp` = +1 month (mirrors the legacy reconnect rhythm). Secret: NEW env var
  `MOBILE_SHIM_JWT_SECRET` (min 32 chars) in a new `packages/env/src/mobile-shim.ts`
  mirroring the mobile-publish env module.
- Wrapper `withMobileBearerAuth` (or better name you propose) beside the four session
  wrappers: extract raw-or-`Bearer` token → verify → load user + identity → enforce
  `tokenVersion` match and enabled semantics → hand `(userId, identity)` to the
  handler; failure outcomes mapped per the legacy semantics table above. Bind
  request-context/monitoring identity like `buildWrapper` does.
- Do NOT reuse `createAuthPostHandler`-family factories for shim endpoints — they emit
  201/204 and platform error envelopes; the shim needs 200-only success and
  legacy-mirroring failures. Build thin shim-local helpers instead.

### 4) apps/platform: `/api/v1` routes

- `src/app/api/v1/auth/signin/route.ts`, `src/app/api/v1/trainingLevel/all/route.ts`,
  `src/app/api/v1/userPlans/route.ts` — thin delegates per house pattern.
  (Edge `proxy.ts` matcher already excludes `api` — verified; do not touch it.)
- signin: public + credentials rate limit (`withAuthCredentialsRateLimit`) — a
  DELIBERATE delta vs legacy (which was a brute-force oracle); thresholds must stay
  far above the app's organic rate, and goldens must run under them.
- Catalogs: public; keep response headers neutral (no cache-control differences that
  change app behavior; extra platform headers like request-id are fine — the app
  ignores unknown headers).

### 5) Golden contract harness

- Bump `~/projects/contrib/tdp/local/docker-compose.yml` postgres `16-alpine` →
  `17-alpine` (prod is PG 17.5; PG16 pg_restore can't read PG17 dumps). This compose
  is OURS — editable; the `mobile-backend`/`mobile-ios` clones are READ-ONLY.
- Extend the harness seed (journal recipe) to prod-shape catalogs: INSERT training
  level 4 "Functional Bodybuilding"; seed a matching user set BOTH sides — at least:
  an enabled athlete (General plan), an enabled ADMIN, and a DISABLED user — same
  emails/passwords/legacy ids in the harness DB and in the platform DB (test helpers
  - identity rows), so identical requests can be fired at both stacks.
- Golden suite in api-server following the `RUN_LEGACY_INTEGRATION=1` gated pattern:
  fire the SAME request at the live harness (`localhost:8080/api/v1/...`) and at the
  shim, compare:
  - status codes exact;
  - 200 bodies as canonical JSON — object keys sorted, ARRAYS order-sensitive,
    numbers/strings exact; volatile fields (`accessToken` value) asserted by shape,
    not value;
  - non-200: status exact; body NOT byte-compared (the app never parses it) but must
    be JSON.
  - Cases minimum: signin success (athlete), signin success (admin), wrong password,
    unknown user, disabled user, both catalogs.
- HOW the shim runs under golden test is YOUR plan-gate proposal (route handlers are
  standard `Request → Response` functions — a direct-invocation adapter is acceptable;
  a full `next dev` boot is not required). Whatever you choose MUST exercise the real
  handler chain (wrapper included) and MUST verify the three route files actually
  mount at the exact wire paths (path-mount check — Next file-tree assertions count).
- Docker Desktop may be down on this WSL host — starting it is allowed:
  `nohup "/mnt/c/Program Files/Docker/Docker/Docker Desktop.exe" & disown`, then poll
  `docker info`. Local containers are workspace, not data.

## Scope fence

- NO user endpoints (`GET/PUT /user*`, `changePassword`, `changeTrainingLevel`) — step 1.2.
- NO `GET /program`, no publish-snapshot model or writes — step 1.3.
- NO users import, no writes to any prod DB (Neon prod OR legacy prod), no legacy
  backend/iOS changes, no DNS/Vercel config.
- NO UI work.
- Do not modify `initiatives/**` (this file included), `CLAUDE.md`, CI configs, or
  lockfiles beyond the single `jose` addition.

## Wire traps (sacred — from the charter)

Raw `Authorization` (no `Bearer ` requirement) · HTTP 200-only success (201/204 = failure
to the app) · `yyyy-MM-dd` dates everywhere (none in this step's payloads — keep it
true) · 403 ONLY where legacy emits 403 (it drives app sign-out) · integer legacy ids
as JSON numbers · array order is contractual, object key order is not.

## Acceptance gates (verify before opening the PR)

1. Golden suite green against the live harness for the case matrix above.
2. Unit tests: wrapper outcome mapping, signin service (enabled/disabled/deleted/no
   identity row), catalog constants, token round-trip incl. `tokenVersion` mismatch
   and expiry.
3. `pnpm check-types`, `pnpm lint`, `pnpm dep:check` clean; api-server unit slice you
   touched green. Full serial api-server suite NOT required for this step.
4. Migration applied to dev Neon; `db:generate` clean.
5. PR contains zero planner artifacts (`initiatives/`, `CLAUDE.md`) and zero edits to
   legacy clones.
6. PR body: what/why, the golden-evidence summary, and an OWNER CHECKLIST as
   `- [ ]` checkboxes (PR-body law): re-run golden suite command; curl signin +
   catalogs against harness and shim side by side; set `MOBILE_SHIM_JWT_SECRET` in
   Vercel (Preview + Production, `openssl rand -base64 32`) BEFORE merge. No
   signatures/attribution lines.

## Resource budget (WSL — hard law)

Heavy commands (any build, full-package vitest, coverage) run inside
`systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=1G -- <cmd>`; vitest
capped `--maxWorkers=2`; turbo `--concurrency=2`; heavy steps strictly sequential
(never build + test simultaneously); throwaway DB containers `--memory=512m` (the
legacy harness compose keeps its existing limits — the Java backend needs headroom).
If `systemd-run --user` is unavailable, say so in your report and fall back to the
diet + sequencing rules.

## Process

- Branch `feat/apex-shim-foundation` off current `main`; PR against `main`.
- Conventional commits, all-lowercase subjects, body lines ≤150 chars, no signatures.
- No comments in code; delete comments in any code you edit.
- Dev DB only (`DATABASE_URL` non-pooler dev Neon per project memory); never prod.
- End every turn declaring tree state (branch, clean/dirty, last commit).
- At the plan gate report: your proposed schema naming, wrapper API, golden runner
  mechanics, env wiring, seed mechanics, and any contract ambiguity you hit — with
  your recommendation each time, not option lists.
