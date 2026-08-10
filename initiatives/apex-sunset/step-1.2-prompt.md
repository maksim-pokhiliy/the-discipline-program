# Step 1.2 — user endpoints (apex-sunset P1.2)

Invoke the `/feature` skill with everything below as its argument, and run its full
pipeline: research → plan (STOP at the plan gate and report to the PLANNER session that
spawned you — not the repo owner) → implement → internal review → PR. This file is skill
INPUT, not a plan override: /feature's own research/planning still runs; where this file
pins a fact verbatim (especially the LIVE-VERIFIED wire tables), trust it over guessing,
and verify anchors against the tree.

## Mission

Extend the mobile compat shim (ADR-0043) with the THREE user endpoints the athlete iOS
app actually calls. This is the FIRST real use of the P1.1 bearer wrapper (built in 1.1,
still unmounted). Served from platform models via the `MobileLegacyIdentity` map.

The three (and ONLY these three — see the scope fence for why the other user endpoints
are out):

1. `GET  /api/v1/user/{id}` — the athlete views their own profile (bearerAuth)
2. `PUT  /api/v1/user` — the athlete edits their own profile (bearerAuth)
3. `PATCH /api/v1/user/changePassword` — the athlete changes their own password

## Read before planning

- `initiatives/apex-sunset/{charter.md,decisions.md}` — sacred wire traps + D-1..D-7.
- `initiatives/mobile-publish/legacy-contract.md` — the verified contract (user rows).
- The P1.1 shim you extend (all on `main`):
  - `packages/api-routes/src/legacy-shim/` — the bearer wrapper (`bearer-auth.ts`,
    `read-bearer-token.ts`, `responses.ts`, `types.ts`), exported at
    `@repo/api-routes/legacy-shim`. **1.2 MOUNTS this wrapper for the first time.**
  - `packages/api-server/src/endpoints/mobile-compat/` — `signin.ts`, `identity-resolver.ts`
    (D-11 top-level `user.findUnique` + nested identity, soft-delete-safe — REUSE it),
    `shim-token.ts`, `wire-handlers.ts`, `wire-schemas.ts`, `legacy-catalogs.ts`,
    `create-mobile-compat-api.ts`, `index.ts`.
  - `apps/platform/src/app/api/v1/` — the three P1.1 route files + `mobile-shim-auth.ts`
    (the app-composed resolver — this is where the bearer wrapper gets composed) +
    `mobile-shim-rate-limit.ts`.
  - `apps/platform/src/app/api/v1/__tests__/shim-golden.integration.test.ts` — the golden
    you EXTEND (do not rewrite; add the user-endpoint cases).
- `packages/api-server/prisma/schema.prisma` — `MobileLegacyIdentity` (you add 2 columns)
  - `User`/`AthleteProfile` (source of `username`=email).
- `packages/api-server/src/endpoints/iam/auth-service.ts` — `validateUser`/`comparePassword`/
  `hashPassword`/`incrementTokenVersion` (REUSE for changePassword).
- Legacy source (read-only, NEVER edit): `~/projects/contrib/tdp/mobile-backend/backend/`
  — `UserController`, `UserServiceImpl`, `models/dtos/user/UserRequestDTO`,
  `ChangePasswordDTO`, `exceptions/exceptionhandlers/{UserExceptionHandler,GlobalExceptionHandler}`.
- iOS (read-only): `~/projects/contrib/tdp/mobile-ios/.../Network/UserService.swift`,
  `Models/User.swift`, `Views/User/UserView.swift`, `ViewModels/User/EditUserViewModel.swift`.

## LIVE-VERIFIED wire surface (probed against the harness 2026-08-09 — AUTHORITATIVE)

The step prompt's job is to stop you re-deriving these from source (P1.1 taught us the
source-declared statuses are wrong on the wire). Every row below was captured with
`curl` against the live legacy backend at `localhost:8080/api/v1`. The golden re-pins
them vs the harness; the shim mirrors them for the APP-EXERCISED cases.

### `GET /api/v1/user/{id}` (bearerAuth)

| Case                           | Status                            | Body / ctype                                                                                     |
| ------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| own id, valid token            | **200**                           | `application/json` — the full UserRequestDTO (shape below)                                       |
| unknown id, valid token        | **404**                           | `text/plain` `User not found with id: <id>` (authed 404 REACHES the wire — NOT swallowed to 403) |
| no `Authorization` header      | **403**                           | empty, no content-type (the auth-collapse; the sign-out trap)                                    |
| another user's id, valid token | **200 on legacy (IDOR PII LEAK)** | our shim MUST NOT reproduce — see hardening                                                      |

### `PUT /api/v1/user` (bearerAuth) — body carries the full UserRequestDTO incl. `id`

| Case                           | Status  | Body                                                                                                               |
| ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------ |
| own edit, valid token          | **200** | `application/json` — echoes the updated UserRequestDTO; legacy PERSISTS firstName/lastName/phoneNumber/dateOfBirth |
| unknown body `id`, valid token | **404** | `text/plain` `User not found with id: <id>`                                                                        |
| no token                       | **403** | empty                                                                                                              |

### `PATCH /api/v1/user/changePassword` — body `{userId, oldPassword, newPassword}`

| Case                         | Status  | Body / ctype                                   |
| ---------------------------- | ------- | ---------------------------------------------- |
| success                      | **200** | empty, no content-type                         |
| **wrong old password**       | **401** | `text/plain` `Incorrect user's old password`   |
| new password == old          | **400** | `text/plain` `New password is the same as old` |
| newPassword fails validation | **400** | `application/json` (field-errors map)          |
| unknown userId               | **404** | `text/plain` `User not found with id: <id>`    |

**LANDMINE (load-bearing):** wrong-old-password is **401**, and **401 does NOT drive
sign-out — only 403 does**. If the shim routes a wrong-old-password through the bearer
wrapper's `denied → 403` path, the athlete is signed out on a mistyped password. The
wrapper authenticates the REQUEST (bad/missing token → 403); the business failures INSIDE
an authenticated changePassword (wrong old → 401, same → 400, validation → 400, unknown → 404) are handler-level outcomes that must emit their own status, never 403. Legacy
`changePassword` is `permitAll` so it returns 401 with or without a token — but our shim
REQUIRES the token (see hardening); the app always sends it, so this is invisible.

### UserRequestDTO shape (what GET and PUT return)

```json
{
  "dateOfBirth": null,
  "firstName": "Test",
  "id": 1001,
  "isEnabled": true,
  "lastName": "Athlete",
  "phoneNumber": null,
  "team": null,
  "trainingLevel": { "id": 2, "name": "Pro" },
  "userPlan": { "id": 1, "name": "General" },
  "userRole": { "id": 1, "name": "USER" },
  "username": "athlete@tdp.local"
}
```

- `id` = the LEGACY integer id (from `MobileLegacyIdentity.legacyUserId`).
- `username` = the platform `User.email` (legacy username IS the email).
- `userRole`/`userPlan` = `{id,name}` resolved from `legacyRoleId`/`legacyPlanId` + the
  P1.1 catalog constants. `trainingLevel` = from `legacyLevelId` + catalogs (NOT NULL per
  D-6, so always present, though the Swift model types it optional).
- `dateOfBirth` = `yyyy-MM-dd` or null. `phoneNumber` = string or null.
- **`team` is ALWAYS null** — legacy has zero teams; do not model a team. Serve null.
- iOS `User` decode (Models/User.swift): **required** = `id, isEnabled, username, userRole`;
  everything else optional → null is safe (verified). Never omit the four required.

## Deliverables

### 1) Schema: two columns on `MobileLegacyIdentity` (additive migration)

Add `phoneNumber String?` + `dateOfBirth DateTime? @db.Date`. Rationale: the athlete's
"Edit" (`PUT /user`) edits firstName/lastName/**phoneNumber/dateOfBirth**; without these
columns the edit is lossy. They are legacy-shaped profile data that belongs on the
identity table (D-6), and P2.1's import will populate them from the dump. Author offline
(`migrate diff`), apply to dev Neon (standing approval), NEVER prod. Prod stays empty
until P2.1.

### 2) api-server: the three services in `endpoints/mobile-compat/`

- `getUser`: resolve the identity from the bearer token (see hardening), assemble the
  UserRequestDTO from the identity row + `User.email` + catalog constants.
- `updateUser`: scope to the token's identity; PERSIST only firstName/lastName/phoneNumber/
  dateOfBirth (the athlete-editable fields); IGNORE body userRole/isEnabled/trainingLevel/
  userPlan/username (anti-privilege-escalation — see hardening); return the updated DTO.
- `changePassword`: an AUTH WRITE — verify oldPassword via `iamAuthService.comparePassword`
  against `User.password`; on match, set newPassword via `hashPassword`, and BUMP
  `tokenVersion` (D-20 — revoke other sessions, consistent with signin's token model);
  emit the live-verified failure statuses (401/400/400/404/200). Validate newPassword by
  the platform's own password policy (a violation → 400).
- REUSE `identity-resolver.ts` for the token→identity+user resolution (D-11 soft-delete
  safety: a soft-deleted user must resolve as denied, not leak).

### 3) api-routes: MOUNT the bearer wrapper

`GET /user/{id}` and `PUT /user` are the first endpoints to use the P1.1 bearer wrapper
(composed in `apps/platform/.../mobile-shim-auth.ts`). `changePassword` also requires the
token (hardening) but its wrong-old-password path must NOT collapse to 403 (the landmine).
Keep the single-mapping-site discipline from P1.1: 200 JSON / 403 empty (auth denial only)
/ 401 / 400 / 404 / 500 (infra fault via `withErrorHandling`), one place to adjust.

### 4) apps/platform: three route files

`src/app/api/v1/user/[id]/route.ts` (GET), `src/app/api/v1/user/route.ts` (PUT),
`src/app/api/v1/user/changePassword/route.ts` (PATCH). Thin delegates per the P1.1 pattern.
Note the path-mount test (P1.1's ungated fs assertion) must be updated to the new expected
route set.

### 5) Golden: extend (do NOT rewrite) + land the AS-8 warmup fix

- Extend `shim-golden.integration.test.ts` with the three endpoints. For **app-exercised**
  cases (own id, valid token) assert shim==legacy (status + canonical-JSON body for 200;
  status only for non-200 — the app never parses error bodies). For the **hardening
  deltas** (below) assert the shim's INTENDED divergence explicitly (do not assert
  equality — legacy leaks/allows where we deny).
- Case matrix minimum: GET own→200(+shape), GET unknown→404, GET no-token→403;
  PUT own-edit→200(+persisted firstName/lastName/phone/dateOfBirth echo), PUT unknown→404,
  PUT no-token→403; changePassword success→200, wrong-old→**401**, same→400, weak-new→400,
  unknown→404, no-token→(shim 403 delta). Extend the harness seed if a second user or a
  known-password fixture is needed (keep the fixed committed bcrypt hash constant — AS-8
  sibling; never htpasswd-random).
- **AS-8 fix (rides here):** the two bcrypt-success golden cases cold-start slow on the
  pooled dev-Neon connection and time out at 5s on a fresh connection. Add a `beforeAll`
  warmup query (wake the connection before the timed cases) and/or raise the live-diff
  `testTimeout`; a warm run must be green deterministically. Note the pooled-URL root cause
  in a comment pointer, not a fix to `.env.local`.

## Deliberate hardening deltas (documented, app-invisible — NOT bugs; do not "fix to match legacy")

The legacy user endpoints are IDOR-riddled; the shim is OUR code and must not reproduce
the holes. The app only ever acts on its OWN id with a valid token, so every delta below
is unreachable in production. Document each in the PR body (the P1.1 pattern).

1. **Scope-to-self on GET/PUT/changePassword.** Resolve the acting user from the TOKEN's
   `legacyUserId`, not the path/body id. If the path/body id ≠ the token's id, the shim
   does NOT serve/mutate another user (legacy leaks/allows it). Preferred rejection status
   = **404** (`not found`), NOT 403 — a spurious 403 would sign the athlete out; 404 is the
   honest "not yours / not found" and matches the unknown-id surface. Confirm the choice at
   the plan gate.
2. **PUT ignores privilege fields.** Only firstName/lastName/phoneNumber/dateOfBirth are
   persisted; body userRole/isEnabled/trainingLevel/userPlan/username are ignored (legacy
   would apply them → privilege escalation via self-edit).
3. **changePassword requires the token** (legacy is `permitAll` — a brute-force oracle) and
   scopes to the token's user (ignores body userId). The app always sends the token.

## Scope fence

- Serve ONLY the three athlete endpoints. **Do NOT serve** `GET /user` (list) or
  `GET /user?userPlanId=`, `PATCH /user/{id}/changeTrainingLevel`, `PATCH /user/{id}/changeUserPlan`,
  `POST /user`, `DELETE /user` — source-verified admin-only (reachable in the app ONLY
  behind `userRole == roleAdmin`: UsersControll, CreateProgram picker, "Change Private").
  They are the admin-authoring surface the platform superseded (charter's 9-endpoint compat
  decision). Consequence, owner-accepted: an ADMIN opening the app keeps profile view / edit
  / change-password; the UsersControll / CreateProgram / Change-Private screens 404. This is
  intended.
- NO `GET /program`, no publish-snapshot (step 1.3). NO users import (P2.1 — prod identity
  table stays empty). No legacy backend / iOS changes. No DNS/Vercel config. No UI work.
- Do not modify `initiatives/**` (this file included), `CLAUDE.md`, CI configs, or lockfiles.

## Wire traps (sacred — charter)

Raw `Authorization` (single leading `Bearer`/`bearer` strip, P1.1 behavior) · HTTP 200-only
success · `yyyy-MM-dd` dates (`dateOfBirth`) · **403 ONLY for an auth denial** (missing/bad
token) — it drives sign-out; NEVER for a business failure (401/400/404 for those) · integer
legacy ids as JSON numbers · array/object key order per the P1.1 golden's canonical-JSON
comparison.

## Acceptance gates (verify before opening the PR)

1. Golden green vs the live harness for the full matrix; the AS-8 warmup makes a cold run
   deterministically green.
2. Unit tests: getUser/updateUser assembly + scope-to-self (404 on mismatch); changePassword
   the full status ladder incl. the **401-not-403** landmine pinned by an explicit test;
   PUT privilege-field-ignore; identity-resolver soft-delete denial still holds.
3. `pnpm check-types`, `pnpm lint`, `pnpm dep:check` clean; the touched vitest slices green.
   Full serial api-server suite NOT required.
4. Migration applied to dev Neon; `db:generate` clean.
5. PR file list: zero `initiatives/`/`CLAUDE.md`/`.github/`; lockfile untouched (no new dep).
6. **No browser gate** — the shim is server-only; no platform UI changes. Say so in the PR
   body. The PR body STILL carries an owner checklist as `- [ ]` checkboxes (PR-body law):
   re-run the golden; curl the three endpoints against harness and shim side by side; confirm
   the prod `db-migrate` applies the additive migration; no Vercel env change this step.
   No signatures/attribution.

## Resource budget (WSL — hard law)

Heavy commands (build, full-package vitest, coverage) inside
`systemd-run --user --scope -q -p MemoryMax=4G -p MemorySwapMax=1G -- <cmd>`; vitest
`--maxWorkers=2`; turbo `--concurrency=2`; heavy steps strictly sequential; throwaway DB
containers `--memory=512m` (the legacy harness compose keeps its limits). If
`systemd-run --user` is unavailable, say so and fall back to diet + sequencing.

## Process

- Branch `feat/apex-shim-user-endpoints` off `main`; PR against `main`.
- Conventional commits, all-lowercase subjects, body lines ≤150, footer lines ≤100 (a
  `word:`-prefixed bullet >100 chars parses as a footer token and is rejected). No signatures.
- No comments in code; delete comments in any code you touch. Dev DB only, never prod.
- End every turn declaring tree state (branch, clean/dirty, last commit).
- At the plan gate report: schema field naming, the scope-mismatch rejection status
  (404 vs 403 — my lean is 404), the changePassword validation policy, golden seed
  additions, and any contract ambiguity — with a recommendation each, not option lists.
