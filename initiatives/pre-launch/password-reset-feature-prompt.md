# pre-launch item #5 — Password reset / recovery (forgot-password flow) — `/feature` (full) prompt

**For the executor session.** A self-service forgot-password flow end-to-end: a user requests a reset by email → gets a reset link → sets a new password → can log in. This is **pre-launch scope item #5** (`docs/roadmap.md`, Block 1) and it also carries the **password-reset email** half of item #4 (the only remaining email template — invite + lead-notify already ship).

**This is security-sensitive auth infra.** The proven analog is the **invite-token flow** (`iamInviteTokenApi` + `UserInviteToken` + `/(auth)/invite/[token]` + `/api/invite/[token]`): a hashed single-use token, validate + consume, that already sets a password. **Mirror it exactly** — the security mechanics are non-negotiable. Reset differs from invite in exactly two ways: it is **self-issued** (a public request step, where invite is admin-issued) and therefore must **not leak which emails are registered**.

Wrap via **`/feature` (full)** — it spans a Prisma model + a contract entity + an api-server service + an email template + three routes + two pages + a login link + gated tests.

---

## 0. Two SSOTs — security mechanics vs visual language (governs the whole build)

- **The invite-token flow is the SSOT for the SECURITY MECHANICS** — token hashing, generation, single-use atomic consume, generic-Gone errors, `tokenVersion` bump, bcrypt, rate-limit tier. Mirror `iamInviteTokenApi` precisely; do not invent a weaker scheme.
- **The existing auth pages are the SSOT for the VISUAL LANGUAGE** — `LoginForm` / `Logo` (`@repo/ui`), the `(auth)` route group, the invite claim views (`InviteView` / `InviteInvalidView`). Build the forgot/reset pages **native** in that idiom (MUI 7 + `@repo/ui` + theme tokens; **NO hex**). **No Claude Design prototype is assumed** — match the existing login/invite look. _(If the owner supplies a mockup, follow it; otherwise the existing auth idiom is the gate.)_
- **Conflict rule:** security wins over everything. Never relax a mirrored guard (no-enumeration, single-use, expiry, session-kill) to simplify the UI.

---

## 1. What this slice is

1. **Forgot password** — a user clicks "Forgot password?" on login, enters their email, submits. The response is **always the same generic success** ("if that email is registered, we've sent a link") — it never reveals whether the email exists.
2. **Reset email** — if the email maps to a real user, a reset link (a hashed single-use token, short TTL) is emailed (Resend, mirror the invite email).
3. **Reset page** — the link opens a page that validates the token (invalid/expired → a friendly "link no longer valid" view), shows a new-password form, submits.
4. **Consume** — sets the new password (bcrypt), invalidates the token (single-use), and **bumps `tokenVersion` to kill all existing sessions**, then sends the user to login to sign in with the new password.

Applies to platform users (athlete / coach / head-coach — one shared `User.password`). Mobile-first.

---

## 2. Read FIRST — verbatim anchors (quoted from current `main`)

### 2.1 The invite-token service — THE mechanics to mirror (`endpoints/iam/invite-token.ts`)

```
hashToken(plain) = sha256(plain).hex            // tokens stored HASHED; plaintext only in the URL/email
generatePlainToken() = crypto.randomBytes(32).base64url
TTL: baseEnv.INVITE_TOKEN_TTL_HOURS             // reset uses its OWN short TTL — see D5-TTL
checkTokenValidity -> NOT_FOUND | CONSUMED | EXPIRED | DELETED_USER
throwGenericGone -> logs the reason, throws GoneError("This invite link is no longer valid")  // NEVER leaks the reason
issue: $transaction -> updateMany({userId, consumedAt:null} -> consume) THEN create   // one live token per user
validate(plain): hash -> findUnique({tokenHash}) -> checkValidity -> user exists & not deleted -> map
consume(plain, {password,...}): hash -> hashPassword -> $transaction:
    updateMany({tokenHash, consumedAt:null, expiresAt:{gt:now}} -> consumedAt:now)   // ATOMIC single-use
    if count===0 -> throwGenericGone                                                  // already used / expired / gone
    set user.password = hash, emailVerified = now, tokenVersion: {increment:1}        // <-- tokenVersion bump kills sessions
```

### 2.2 The token model to mirror (`prisma` ~477) — reset needs its own

```
model UserInviteToken { id, userId, user(Cascade), tokenHash @unique, expiresAt, consumedAt?,
  createdByAdminId, createdBy(Restrict), createdAt; @@index([userId,consumedAt]); @@index([expiresAt]); @@map(app_user_invite_tokens) }
```

A reset token is **self-issued** → it has **no `createdByAdminId`**. Add a new model `PasswordResetToken { id, userId, user(Cascade), tokenHash @unique, expiresAt, consumedAt?, createdAt; @@index([userId,consumedAt]); @@index([expiresAt]); @@map("app_password_reset_tokens") }`. `db:reset` world (ADR-0019) — **no migration files**.

### 2.3 The routes to mirror (`apps/platform/src/app`)

```
GET  /api/invite/[token]          -> withPublicRoute(withRateLimit(validate, AUTH))           // validate
POST /api/invite/[token]/consume  -> withPublicRoute(withRateLimit(consume, AUTH))            // set password
(auth)/invite/[token]/page.tsx    -> server component: iamInviteTokenApi.validate -> InviteView | InviteInvalidView (GoneError)
```

### 2.4 The contract shapes to mirror (`contracts/iam/invite-token`)

```
inviteTokenSchema = { email, recipientName: string|null, expiresAt: date }
tokenParamSchema  = { token: string min(MIN_TOKEN_LENGTH) max(MAX_TOKEN_LENGTH) }   // invite-token.constants
consumeInviteRequestSchema = { password: string min(AUTH.MIN_PASSWORD_LENGTH=12) max(128), timezone? }
consumeInviteResponseSchema = { email, redirectTo: string.startsWith("/") }
```

### 2.5 Password hashing + login (`endpoints/iam/auth-service.ts`)

```
iamAuthService.hashPassword(pw) = bcrypt.hash(pw, AUTH_CONSTANTS.BCRYPT_COST_FACTOR=12)   // REUSE this
validateUser(email, pw): normalizes email (lowercase+trim), bcrypt.compare, DUMMY_BCRYPT_HASH timing-guard
//  reset just sets user.password to a new bcrypt hash -> login works unchanged
```

### 2.6 The login page (where "Forgot password?" goes)

```
apps/platform/src/app/(auth)/login/page.tsx -> <PlatformLoginPage/> (apps/platform/src/modules/auth/index.tsx)
//  uses <LoginForm onSubmit ...> from @repo/ui; the forgot link belongs by that form
```

### 2.7 The email send pattern (`endpoints/iam/send-invitation-email.ts` + `@repo/email`)

```
resolveInviteEmailConfig(): emailEnv.RESEND_API_KEY / EMAIL_FROM / EMAIL_REPLY_TO
sendInvitationEmail(input): resolve -> renderInvitationEmail({inviteUrl,...}) -> service.send(...); try/catch logs (never throws)
// packages/email/src/templates/invitation.{tsx,render.ts} -> mirror for the reset template (React Email, inline styles incl. hex OK in email)
```

---

## 3. Build decisions (ratified — build to these; surface a counter only with a contentful reason)

- **D5-MIRROR-INVITE** — the reset service mirrors `iamInviteTokenApi`: `hashToken` (sha256), `generatePlainToken` (`crypto.randomBytes(32).base64url`), `checkTokenValidity`, `throwGenericGone` (generic message, log the real reason), **atomic single-use consume** (`updateMany` with `consumedAt:null` + `expiresAt:{gt:now}` → `count===0` → Gone), `iamAuthService.hashPassword`, **`tokenVersion:{increment:1}`** on consume. Rate-limit `AUTH` tier on every reset route.
- **D5-NEW-MODEL** — a new `PasswordResetToken` model (§2.2), self-issued (no `createdByAdminId`). `issue` invalidates prior unconsumed reset tokens for that user, then creates one (one live reset token per user — mirror invite `issueInTx`). `db:reset`, no migration files.
- **D5-NO-ENUMERATION** — the **request-reset** endpoint **always returns the same generic success**, whether or not the email exists. Find the user by normalized email (lowercase+trim, mirror `validateUser`); if found → issue token + send email; if not → do nothing. Same response shape, same status, both paths. **Do not** add an "email not found" branch anywhere the client can see. (This is the one security concern invite didn't have — invite is admin-issued.)
- **D5-TTL-SHORT** — reset TTL is short: a `RESET_TOKEN_TTL_HOURS` constant defaulting to **1 hour** (security convention; shorter than the invite TTL). Keep it a const in the service for now (no new required env). Flag: promote to `emailEnv`/`baseEnv` if the owner wants it tunable.
- **D5-CONSUME-THEN-LOGIN** — on successful consume, set the password + bump `tokenVersion` (killing all sessions), then **redirect to `/login`** with a success message (the user signs in with the new password). Do NOT auto-login (reset deliberately re-authenticates; simpler + safer than minting a session here). `emailVerified` is already set for existing users — don't touch it.
- **D5-RESET-EMAIL** — a new `packages/email/src/templates/password-reset.{tsx,render.ts}` (+ templates barrel), mirroring `invitation.{tsx,render.ts}`; the reset URL = `${baseEnv.NEXT_PUBLIC_PLATFORM_URL}/reset-password/${plainToken}`. Send via the Resend service, mirroring `sendInvitationEmail` (try/catch, logged-not-thrown). If the send fails the request STILL returns the generic success (no enumeration) — the error is logged, the user can retry. Inline styles incl. hex are correct in the email template (not app UI).
- **D5-CONTRACT** — a new `contracts/iam/password-reset` entity (mirror `invite-token`): `requestPasswordResetRequestSchema = { email: z.string().email() }` + a generic `{ success: true }`-style response; `tokenParamSchema` (reuse the token bounds); `consumePasswordResetRequestSchema = { password: min(12) max(128) }` (NO timezone — existing users have one); `consumePasswordResetResponseSchema = { email, redirectTo }` (redirectTo = `/login`). Barrel-wire into `contracts/iam`.

---

## 4. Scope (the vertical slice)

### A. [PRISMA] `PasswordResetToken` model (§2.2, D5-NEW-MODEL) — `db:reset`, no migration files; `db:generate` after.

### B. [CONTRACT] `contracts/iam/password-reset` (D5-CONTRACT) — request / validate-param / consume shapes + barrel.

### C. [SERVER] `endpoints/iam/password-reset.ts` — `iamPasswordResetApi`:

- `request(email)`: normalize email → find user → if found: issue token (tx: invalidate prior + create) + `sendPasswordResetEmail`; always return void/generic (D5-NO-ENUMERATION).
- `validate(plainToken)`: mirror invite `validate` (hash → find → checkValidity → user exists/not-deleted → a minimal shape, e.g. `{ email }`; generic Gone otherwise).
- `consume(plainToken, {password})`: mirror invite `consume` (atomic single-use; set password + `tokenVersion++`; return `{ email, redirectTo: "/login" }`).
- `sendPasswordResetEmail(...)`: mirror `sendInvitationEmail` (resolve config, render, send, logged-not-thrown).
- Export from the iam barrel. Reuse `iamAuthService.hashPassword`.

### D. [EMAIL] `packages/email` reset template (D5-RESET-EMAIL) — `password-reset.{tsx,render.ts}` + barrel.

### E. [ROUTES] three public routes (rate-limit `AUTH`):

- `POST /api/auth/password-reset/request` → `request(email)` (generic success).
- `GET  /api/auth/password-reset/[token]` → `validate(token)`.
- `POST /api/auth/password-reset/[token]/consume` → `consume(token, {password})`.

### F. [PAGES] two `(auth)` pages + the login link:

- `(auth)/forgot-password/page.tsx` — email form → request; on submit, show the generic "if that email is registered…" confirmation (same message always).
- `(auth)/reset-password/[token]/page.tsx` — server-validate the token (→ a valid view with the new-password form, or an "invalid/expired link" view, mirroring `InviteView` / `InviteInvalidView`); the form posts consume → on success redirect to `/login` with a success toast.
- **Login link** — add "Forgot password?" by the `LoginForm` in `apps/platform/src/modules/auth` → links to `/forgot-password`.

### G. [TESTS] gated api-server tests for the service: hashed-token round-trip, expiry, single-use (second consume → Gone), no-enumeration (unknown email → same generic success, no token created, no email sent), `tokenVersion` bump on consume, password actually updated (login works after).

---

## 5. Sacred / constraints

- **§0 governs:** mirror invite security mechanics exactly; reset adds only the no-enumeration request step. Security wins over UI simplicity.
- **No email enumeration** (D5-NO-ENUMERATION) — the request endpoint never reveals whether an email exists; identical response on both paths.
- **Single-use + expiry + hashed storage** — atomic consume (`count===0` → Gone), short TTL (1h), tokens stored as sha256 hashes (plaintext only in the URL/email). Generic `GoneError` message; the real reason is logged, never returned.
- **`tokenVersion` bump on consume** — kills existing sessions (compromised-account recovery). Don't skip it.
- **Rate-limit `AUTH`** on all three routes (mirror invite); flag a per-email throttle as optional hardening (email-bomb resistance).
- **Reuse** `iamAuthService.hashPassword` (bcrypt cost 12), the `@repo/email` Resend service, and the `(auth)` + `@repo/ui` `LoginForm`/`Logo` idiom. **No new auth dependency.**
- **Theme tokens / no-hex / floating labels / one-component-per-file / mobile-first** for the pages. The email template is the one place inline-hex is correct.
- **Password rules** = `AUTH_CONSTANTS` (min 12, max 128) — reuse, don't redefine.

---

## 6. Out of scope (other waves — do NOT build here)

- **Admin-app reset pages** — platform hosts the reset flow; a head-coach resets via platform (shared `User.password`) and it works for admin login too. Optionally the admin login can link to the platform `/forgot-password` URL (cross-app) — flag, don't build unless trivial.
- **Email-change / account-settings password change** (logged-in "change my password") — a separate authenticated flow; this is the logged-OUT recovery path only.
- **MFA / 2FA** — explicitly out of MVP (`docs/roadmap.md`).
- **Per-email rate throttle, CAPTCHA** — optional hardening; flag, the `AUTH` tier rate-limit is the MVP floor.
- **Tunable TTL via env** — a const (1h) suffices; promote to env later if wanted.

---

## 7. Acceptance

- A user clicks "Forgot password?" on login, enters an email, and sees a generic confirmation **regardless of whether the email exists** (verified: unknown email → same message, no token row, no email sent).
- A registered email receives a reset link; opening it shows the new-password form; an invalid/expired/used link shows the friendly "no longer valid" view.
- Setting a new password works; the user is sent to login and **can sign in with the new password**; **old sessions are invalidated** (`tokenVersion` bumped).
- A token is **single-use** (second consume → Gone) and **expires** (TTL 1h). Tokens are stored hashed.
- `check-types`, `lint`, `pnpm dep:check` clean. The reset service is covered by the **gated** api-server suite (owner-gated run — `api-server-serial-tests`); green on reseed. Close-out docs land **in** the feature PR (`closeout-before-pr`); ratify the D5-\* decisions.

---

## 8. Process

`/feature` (full). `db:reset` world — the new `PasswordResetToken` model applies via `db:reset` + `db:generate` (no migration files, ADR-0019). Orchestrator reviews every implement wave via `git diff` (never agent self-report). Worktree run — heed `worktree-feature-run-gotchas` (format-lint hook cwd misfire; api-server tests need a manual `.env` copy + `DATABASE_URL`). Land close-out IN the PR. ≤1 full `/feature` per session.
