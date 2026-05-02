# 0012. JWT session strategy with 30-day max age

- **Status:** Accepted (with known weakness — see Consequences)
- **Date:** 2026-04-10
- **Tags:** `auth`, `security`, `session`, `known-gaps`

## Context

NextAuth supports two session strategies:

1. **Database sessions.** Every session is a row in the `Session` table. Every request reads the table to look up the user. Revocation is instant (delete the row). Cost: one database round-trip per authenticated request.
2. **JWT sessions.** Session data is encoded into a signed JWT stored in a cookie. Every request decodes and verifies the JWT locally. Revocation is hard: a valid JWT is valid until it expires. Cost: near-zero per request.

The deploy target is Vercel serverless. On serverless, database round-trips are the single biggest variable-latency cost on a request. An extra `Session` read on every page view compounds across the three apps (`admin`, `platform`, `marketing` — though marketing does not do session reads because it is public).

NextAuth defaults to JWT sessions when no database adapter is configured. Our `createAuthOptions` factory in `@repo/auth` explicitly sets `session: { strategy: "jwt", maxAge: AUTH_CONSTANTS.SESSION_MAX_AGE }`, where `SESSION_MAX_AGE = 30 * 24 * 60 * 60` (30 days).

## Decision

We use **JWT session strategy** with a **30-day max age**. The JWT is signed with `NEXTAUTH_SECRET` (shared between admin and platform — see ADR 0011) and carries the following claims:

- `id` — user ID
- `email` — user email
- `name` — display name
- `image` — avatar URL
- `role` — user role (refreshed from the database on JWT callback)

The JWT callback in `createAuthOptions` reads the user record from the `AuthServiceAdapter` on every refresh and overwrites `token.role` with the current database value. This is not per-request — NextAuth caches the JWT between refreshes. But it means a role change in the database propagates on the next JWT refresh (hours, not days), not on session expiry (30 days).

If the `getUserById` lookup fails, the JWT callback throws `UnauthorizedError`, which NextAuth treats as a failed session and forces re-login.

## Consequences

**Positive:**

- **Zero database round-trips per authenticated request.** Every page view, every API call, every server component render reads the session from the cookie and moves on. At scale this is the difference between feasibility and not on a serverless deploy.
- **Role changes propagate within the JWT refresh window.** A user whose role is upgraded from USER to COACH sees the new role on their next session refresh, not on re-login. Similarly, a deleted user is forcibly logged out at the next refresh because `getUserById` returns null.
- **Stateless scaling.** JWT sessions scale horizontally without any session affinity or shared session store. One less piece of infrastructure.
- **Simple secret rotation story.** Rotating `NEXTAUTH_SECRET` invalidates every active session, which is exactly what you want in a security incident.

**Negative (known security gaps — see ADR 0018):**

- **30-day JWT with no revocation is a long blast radius.** A leaked token is valid for a month. There is no way to invalidate a specific JWT short of rotating the shared secret (which logs everyone out). This is the industry-standard reason for splitting sessions into a short-lived access token (minutes) and a long-lived refresh token (days or weeks). We do not have that split. A stolen laptop, a phishing victim, a compromised browser extension — all of these have up to 30 days of access before the token naturally expires.
- **Cookie size.** JWTs are larger than session IDs. NextAuth chunks large cookies automatically, but every request carries the JWT bytes in the `Cookie` header. Not a problem at the current session payload size, but a watch-list item if we ever want to cram more state into the token.
- **Role change lag.** A user demoted from ADMIN to USER sees the old role in `session.user.role` until the next JWT refresh. For security-critical role changes (firing an admin), this means the admin retains admin permissions for up to the refresh interval. In practice the refresh happens within minutes of the next request, but "within minutes" is not "instantly".
- **`MIN_PASSWORD_LENGTH = 6`** combined with 30-day JWTs is a bad pair. A weak password plus a month-long valid token is more risk than either alone. See ADR 0018 for the password-policy deferral.
- **JWT contents are readable (just not forgeable).** Anyone with the cookie can decode the JWT payload in one line of JavaScript and read the user's ID, email, name, avatar URL, and role. No sensitive secrets should ever land in the token. Today they do not — but a future contributor adding "convenience" fields to the session object could accidentally expose PII.

**Neutral:**

- NextAuth provides the `getToken()` helper that the `@repo/auth/proxy` uses to check the session in middleware. Works with JWT sessions; would not work as cleanly with database sessions in Next.js middleware (which runs in edge runtime where database drivers are awkward).
- The JWT is encrypted by default in NextAuth v4 (A256GCM via `jose`). Even though the contents are accessible to the cookie holder, they are opaque to an attacker who only sees the cookie over the wire and does not have the secret.

## Alternatives considered

**Database sessions.** The obvious alternative. Fresh revocation, smaller cookie, no JWT gymnastics. Cost: a database round-trip on every authenticated request. On Vercel serverless with warm instances, that is ~5-20ms of added latency per request. On cold starts, much worse (the cold function + cold database connection). Multiply by every page load × every session-checked API call. Rejected as too expensive at the deploy target.

**Hybrid: JWT access token (15 min) + database refresh token (30 days).** The industry-standard pattern. Short access token minimizes leak window. Long refresh token avoids daily re-login. Requires a refresh endpoint, client-side refresh logic, and a refresh token table in the database. NextAuth v4 does not support this pattern out of the box; implementing it means writing a custom flow that diverges from the NextAuth abstractions we are relying on. **This is the right long-term direction, but it is a non-trivial implementation and is deferred.** A future ADR will supersede this one when the refresh-token flow is built. Tracked in ADR 0018.

**Shorter JWT max age.** Reduce the 30-day window to, say, 7 days. Reduces blast radius without adding infrastructure. Also annoys users — anyone who does not log in weekly gets kicked out. A middle ground is 14 days. Deferred: the right number depends on product data we do not have yet (how often do coaches actually use the platform?). When we have usage data, revisit.

**Database sessions with Edge middleware via Prisma Data Proxy.** Uses Prisma's HTTP-based data proxy to make database queries from the Vercel edge runtime. Technically possible. Rejected because it adds another piece of infrastructure (the data proxy) for a problem JWT solves without infrastructure.

**Session token in a localStorage instead of a cookie.** Rejected: localStorage-based auth is vulnerable to XSS in a way that httpOnly cookies are not. Not a serious alternative for a production application.

**No sessions, API tokens only.** Rejected: this is a browser-based web application. Sessions are the appropriate primitive.

## References

- `packages/auth/src/auth-options.ts` — the `session: { strategy: "jwt", maxAge: AUTH_CONSTANTS.SESSION_MAX_AGE }` declaration.
- `packages/contracts/src/entities/auth/auth.constants.ts` — `SESSION_MAX_AGE = 30 * 24 * 60 * 60`.
- `apps/platform/src/proxy.ts` — the middleware that reads the JWT via `getToken()`.
- ADR 0004 — NextAuth + credentials (this ADR is the session half of that decision).
- ADR 0011 — two independent NextAuth instances (sharing the same `NEXTAUTH_SECRET`).
- ADR 0018 — security deferred decisions (password policy, long session, refresh tokens).
