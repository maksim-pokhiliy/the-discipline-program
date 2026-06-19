# Close-out — pre-launch #5: Password reset / recovery

Shipped on `feat/password-reset` (this PR). Self-service forgot-password flow end-to-end + the password-reset email (the last half of pre-launch #4). Greenfield, a faithful mirror of the invite-token flow with the self-issued (public-request) divergences. See `password-reset-feature-prompt.md` for the full brief.

## What shipped (vertical slice, 28 files, purely additive)

- **PRISMA** `PasswordResetToken` model (self-issued — no `createdByAdminId`) + `User.passwordResetTokens` back-relation. `db:reset` world (ADR-0019), no migration files.
- **CONTRACT** `@repo/contracts/iam/password-reset` (request / validate-param / consume schemas + `PasswordResetInfo`). New `package.json` subpath.
- **SERVER** `endpoints/iam/password-reset.ts` (`iamPasswordResetApi` — request/validate/consume) + `send-password-reset-email.ts`. Reuses `iamAuthService.hashPassword`.
- **EMAIL** `@repo/email` `password-reset.{tsx,render.ts}` template (Resend).
- **ROUTES** 3 public routes under `/api/auth/password-reset/*` (rate-limit `AUTH`).
- **PAGES/MODULE** `(auth)/forgot-password`, `(auth)/reset-password/[token]`, `modules/password-reset/**`, "Forgot password?" login link.
- **AUTH GATE** `@repo/auth` `PUBLIC_ROUTES`/`PUBLIC_ROUTE_PREFIXES` whitelisted for the reset pages + an `isPublicRoute` unit test (the QA-001 fix — see below).
- **TESTS** gated api-server suite `password-reset.test.ts`.

## Decisions ratified (D5-\*, from the prompt — built as specified)

- **D5-MIRROR-INVITE** — sha256 `hashToken`, `randomBytes(32).base64url`, `checkTokenValidity`, generic `throwGenericGone` (reason logged-only), atomic single-use consume (`updateMany consumedAt:null+expiresAt:{gt:now}` → `count===0` → Gone), `tokenVersion:{increment:1}`, `AUTH` rate-limit on every route.
- **D5-NEW-MODEL** — `PasswordResetToken`, self-issued; `issue` invalidates prior unconsumed (one live token/user).
- **D5-NO-ENUMERATION** — request returns identical generic `{success:true}` 200 on both paths (found / not-found).
- **D5-TTL-SHORT** — `RESET_TOKEN_TTL_HOURS = 1` service const (no new env).
- **D5-CONSUME-THEN-LOGIN** — consume sets password + `tokenVersion++`, returns `redirectTo:"/login"`; NO auto-login.
- **D5-RESET-EMAIL** — Resend, URL `${NEXT_PUBLIC_PLATFORM_URL}/reset-password/${token}`, logged-not-thrown.
- **D5-CONTRACT** — request `{email}` + generic `{success:true}`; consume `{password}` (no timezone); response `{email, redirectTo}`.

## Orchestrator-derived divergences from a pure invite-mirror (verified in Review + QA)

- **D-NOTHROW** (the security catch) — `sendInvitationEmail` resolves config OUTSIDE its try/catch (throws on missing RESEND). For a PUBLIC reset endpoint that is a found-path-only 500 = **email-enumeration oracle**. `sendPasswordResetEmail` is fully non-throwing (config-resolve inside the try/catch) + `request()` wraps the whole found-path so even a DB failure returns the identical generic success. Closed and test-guarded (`password-reset.test.ts` #13).
- **D-LOGIN** — reset does not auto-login (deliberate re-auth); redirect `/login`.
- **D-NO-EMAILVERIFIED** — consume does NOT touch `emailVerified` (existing verified users; login doesn't gate on it). Test-guarded (#6).
- **D-NO-TIMEZONE** — consume request is `{password}` only.
- **D-DUP** — token helpers + the new-password form are duplicated (not extracted) to avoid touching the tested invite flow and to respect module boundaries. See Deferred.

## Verification

- `check-types` + `lint` + `pnpm dep:check` — clean (re-run by orchestrator + Review agent; dep:check 0 violations).
- Independent Review (Staff-Engineer, 0 CRITICAL) + hostile QA (1 CRITICAL, fixed) on the diff.
- `@repo/auth` unit suite green (21 tests incl. the new `isPublicRoute` reset-route guard).
- Gated api-server suite — `password-reset.test.ts` (15 Must-Test scenarios). Owner-gated run on the applied Neon table.

## QA-001 (CRITICAL, FIXED in this PR)

The platform proxy auth gate (`@repo/auth` `PUBLIC_ROUTES`) whitelisted `/invite` but NOT the reset pages → logged-out users (the only audience) were redirected to `/login` before the pages rendered. Silent-green (type-check/lint/dep:check all passed). Fixed: whitelisted `/forgot-password` + `/reset-password/` + added an `isPublicRoute` regression test. API routes were never affected (the proxy matcher excludes `/api`, and `/api/auth/` is already public).

## Deferred (carry-forwards — fast-follow, NOT in this PR)

- **QA-002 — per-email throttle on `/request`.** Currently IP-only (`withRateLimit`). A motivated attacker who knows a victim's email can spam their inbox and, sharper, repeatedly invalidate the victim's in-flight reset link (`issueInTx` gases the prior token) — recovery griefing. Fix: swap to `withAuthCredentialsRateLimit` (buckets on the email; already exists). Prompt §6 deferred this as optional hardening; the griefing angle is the reason to not defer past launch.
- **QA-003 — bcrypt before token check on `/consume`** (CPU-amplification). Parity with invite (same ordering); fixing only reset diverges. Fold into the D-DUP `token-utils.ts` extraction (apply to both flows).
- **D-DUP extraction (rule-of-three trigger)** — when a 3rd token type appears, extract `endpoints/iam/token-utils.ts` (`hashToken`/`generatePlainToken`/`checkTokenValidity`/generic-Gone) and a `@repo/ui` new-password-fields component; invite + reset adopt. Dedicated refactor PR with an invite re-test.
- **Timing side-channel on `/request`** (found = DB write + in-band email; not-found = one SELECT) — accepted MVP residual. Natural fix = fire-and-forget the send (also narrows QA-002).

## ⚠️ Launch gate (deployment, not code)

`withRateLimit` / `withAuthCredentialsRateLimit` are a **noop unless `UPSTASH_REDIS_REST_*` is configured** on platform. Without it, NO AUTH-tier rate-limit fires on ANY route (invite included), and the reset routes — public + self-issued — have the highest abuse exposure (QA-002/003 become unbounded). **Confirm Upstash is configured on the platform prod env before launch.** (Tracks with the pending prod env-vars work.)
