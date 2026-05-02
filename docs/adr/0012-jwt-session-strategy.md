# 0012. JWT session strategy with token-version revocation

- **Status:** Accepted (with known weakness — see Consequences)
- **Date:** 2026-04-10
- **Last revised:** 2026-05-02 (Context, Decision, Consequences updated to reflect `tokenVersion` revocation and 7-day max age; see Revision history)
- **Tags:** `auth`, `security`, `session`, `known-gaps`

## Context

NextAuth supports two session strategies:

1. **Database sessions.** Every session is a row in the `Session` table. Every request reads the table to look up the user. Revocation is instant (delete the row). Cost: one database round-trip per authenticated request.
2. **JWT sessions.** Session data is encoded into a signed JWT stored in a cookie. Every request decodes and verifies the JWT locally. Revocation is hard: a valid JWT is valid until it expires. Cost: near-zero per request.

The deploy target is Vercel serverless. On serverless, database round-trips are the single biggest variable-latency cost on a request. An extra `Session` read on every page view compounds across the three apps (`admin`, `platform`, `marketing` — though marketing does not do session reads because it is public).

NextAuth defaults to JWT sessions when no database adapter is configured. Our `createAuthOptions` factory in `@repo/auth` explicitly sets `session: { strategy: "jwt", maxAge: AUTH_CONSTANTS.SESSION_MAX_AGE }`, where `SESSION_MAX_AGE = 7 * 24 * 60 * 60` (7 days; declared in `packages/contracts/src/entities/iam/auth/auth.constants.ts`).

## Decision

We use **JWT session strategy** with a **7-day max age** and **per-user `tokenVersion` revocation**. The JWT is signed with `NEXTAUTH_SECRET` (shared between admin and platform — see ADR 0011) and carries the following claims:

- `id` — user ID
- `email` — user email
- `name` — display name
- `image` — avatar URL
- `role` — user role (refreshed from the database on JWT callback)
- `tokenVersion` — monotonically incrementing integer (`User.tokenVersion`, default `0`); the cookie is invalidated when this drifts from the database value.

The JWT callback in `createAuthOptions` (verified in `packages/auth/src/auth-options.ts:69-85`) reads the user record from the `AuthServiceAdapter` on every refresh and:

1. Throws `UnauthorizedError("User no longer exists")` if `getUserById` returns `null` — a deleted user is forcibly logged out at the next refresh.
2. Throws `UnauthorizedError("Session invalidated")` if `token.tokenVersion !== dbUser.tokenVersion` — any path that bumps `User.tokenVersion` instantly revokes every JWT minted before the bump (the JWT becomes uncacheable; the next request fails the version check and the cookie is dropped).
3. Overwrites `token.role` and `token.tokenVersion` with the current database values for the next refresh window.

`User.tokenVersion` is incremented today by:

- `iamAuthService.incrementTokenVersion(userId)` — called by `createLogoutHandler` (in `packages/auth/src/logout-handler.ts:14-16`) on logout. There is no separate "revocation endpoint"; logout is the only user-initiated trigger.
- `iamUserAdminApi.updateUser` and `iamUserAdminApi.updateRole` (in `packages/api-server/src/endpoints/iam/users-admin.ts`) bump `tokenVersion: { increment: 1 }` whenever a user's role changes — admin demotion / promotion is enforced on the next request, not after the 7-day session expiry.
- `iamUserAdminApi.deleteUser` bumps the increment as part of the soft-delete update — combined with `getUserById` returning `null`, the deleted user's session dies at the next refresh.
- `iamUserInviteTokenApi` bumps the increment when an invite token is consumed (the invited user's pre-acceptance session is invalidated).

JWT refresh-token rotation (the access-token / refresh-token split) is **not implemented**. Per-user revocation via `tokenVersion` is the only kill-switch; there is no per-cookie revocation (no JTI list / blacklist), and no path to revoke "this specific browser" without revoking every session for that user.

## Consequences

**Positive:**

- **Zero database round-trips per authenticated request.** Every page view, every API call, every server component render reads the session from the cookie and moves on. At scale this is the difference between feasibility and not on a serverless deploy.
- **Role changes propagate within the JWT refresh window.** A user whose role is upgraded from USER to COACH sees the new role on their next session refresh, not on re-login. Similarly, a deleted user is forcibly logged out at the next refresh because `getUserById` returns null.
- **Stateless scaling.** JWT sessions scale horizontally without any session affinity or shared session store. One less piece of infrastructure.
- **Simple secret rotation story.** Rotating `NEXTAUTH_SECRET` invalidates every active session, which is exactly what you want in a security incident.

**Negative (known security gaps — see ADR 0018):**

- **Per-user revocation, not per-cookie.** A `tokenVersion` bump invalidates every JWT for that user — every device, every browser, every active session. There is no path to revoke "this specific stolen cookie" without forcing re-login on the user's other devices. JTI-list / blacklist patterns are the standard fix; we do not have one. Acceptable today (the only revocation triggers — logout, role change, delete, invite acceptance — are all "kill all sessions" semantics by intent), but a future "log out other devices" feature would need a JTI list.
- **No standalone revocation endpoint.** A leaked token cannot be revoked by an admin without going through one of the existing trigger paths (force a role change, soft-delete the user, or have the user log out themselves). An "admin revokes user X's sessions" admin action is on the deferred list — see ADR 0018.
- **No refresh-token rotation.** The access-token / refresh-token split (short-lived access + longer-lived refresh) is the industry-standard mitigation for the "leaked token blast radius" problem. We do not have it. The current 7-day max age combined with the `tokenVersion` kill-switch covers the same threat model less precisely: a leaked cookie is valid for up to 7 days unless one of the bump triggers fires.
- **Cookie size.** JWTs are larger than session IDs. NextAuth chunks large cookies automatically, but every request carries the JWT bytes in the `Cookie` header. Not a problem at the current session payload size, but a watch-list item if we ever want to cram more state into the token.
- **Role change lag is bounded by the JWT refresh window, not zero.** A user demoted from ADMIN sees the old role in `session.user.role` until the next JWT refresh. The `tokenVersion` bump on role change converts this into a forced re-login at the next refresh (the version mismatch throws and the cookie is dropped) — but the refresh itself is still NextAuth-cadenced (every few minutes during active use, not on every request).
- **JWT contents are readable (just not forgeable).** Anyone with the cookie can decode the JWT payload in one line of JavaScript and read the user's ID, email, name, avatar URL, role, and `tokenVersion`. No sensitive secrets should ever land in the token. Today they do not — but a future contributor adding "convenience" fields to the session object could accidentally expose PII.

**Neutral:**

- NextAuth provides the `getToken()` helper that the `@repo/auth/proxy` uses to check the session in middleware. Works with JWT sessions; would not work as cleanly with database sessions in Next.js middleware (which runs in edge runtime where database drivers are awkward).
- The JWT is encrypted by default in NextAuth v4 (A256GCM via `jose`). Even though the contents are accessible to the cookie holder, they are opaque to an attacker who only sees the cookie over the wire and does not have the secret.

## Alternatives considered

**Database sessions.** The obvious alternative. Fresh revocation, smaller cookie, no JWT gymnastics. Cost: a database round-trip on every authenticated request. On Vercel serverless with warm instances, that is ~5-20ms of added latency per request. On cold starts, much worse (the cold function + cold database connection). Multiply by every page load × every session-checked API call. Rejected as too expensive at the deploy target.

**Hybrid: JWT access token (15 min) + database refresh token (30 days).** The industry-standard pattern. Short access token minimizes leak window. Long refresh token avoids daily re-login. Requires a refresh endpoint, client-side refresh logic, and a refresh token table in the database. NextAuth v4 does not support this pattern out of the box; implementing it means writing a custom flow that diverges from the NextAuth abstractions we are relying on. **This is the right long-term direction, but it is a non-trivial implementation and is deferred.** A future ADR will supersede this one when the refresh-token flow is built. Tracked in ADR 0018.

**Shorter JWT max age.** The 7-day window we ship today is the result of pulling this lever once already (the original draft used 30 days). Reduces blast radius without adding infrastructure. Re-tightening to 24h or 12h is on the table when we have usage data showing how often coaches actually use the platform — until then, 7 days is the conservative default.

**Per-cookie JTI blacklist.** Issue every JWT with a unique `jti` claim, store revoked `jti`s in Redis or Postgres, check on every request. Per-cookie revocation is precise (kill one stolen session without forcing the user to re-login on the other six). Cost: a Redis lookup per request and storage proportional to `jti × max_age`. Rejected for now because (a) `tokenVersion` covers the threat model we actually have today (admin force-logout, role change, soft-delete) and (b) the per-request lookup undoes the "zero DB round-trips" win that motivated JWT in the first place. Worth revisiting if a "log out my other devices" product feature lands.

**Database sessions with Edge middleware via Prisma Data Proxy.** Uses Prisma's HTTP-based data proxy to make database queries from the Vercel edge runtime. Technically possible. Rejected because it adds another piece of infrastructure (the data proxy) for a problem JWT solves without infrastructure.

**Session token in a localStorage instead of a cookie.** Rejected: localStorage-based auth is vulnerable to XSS in a way that httpOnly cookies are not. Not a serious alternative for a production application.

**No sessions, API tokens only.** Rejected: this is a browser-based web application. Sessions are the appropriate primitive.

## References

- `packages/auth/src/auth-options.ts` — the `session: { strategy: "jwt", maxAge: AUTH_CONSTANTS.SESSION_MAX_AGE }` declaration and the `tokenVersion`-aware JWT callback (`auth-options.ts:69-85`).
- `packages/auth/src/logout-handler.ts` — `createLogoutHandler` (calls `incrementTokenVersion` on session-bearing logout).
- `packages/contracts/src/entities/iam/auth/auth.constants.ts` — `SESSION_MAX_AGE = 7 * 24 * 60 * 60`.
- `packages/api-server/src/endpoints/iam/auth-service.ts` — `iamAuthService.incrementTokenVersion` (the bump primitive).
- `packages/api-server/src/endpoints/iam/users-admin.ts` — admin role-change / delete paths that bump `tokenVersion`.
- `apps/platform/src/proxy.ts` — the middleware that reads the JWT via `getToken()`.
- ADR 0004 — NextAuth + credentials (this ADR is the session half of that decision).
- ADR 0011 — two independent NextAuth instances (sharing the same `NEXTAUTH_SECRET`).
- ADR 0018 — security deferred decisions (refresh tokens, JTI blacklist, admin "force logout user" endpoint).

## Revision history

- **2026-05-02** — synced ADR with current implementation. Title and Decision rewritten: the session strategy carries `tokenVersion` as a first-class claim, and the JWT callback throws `UnauthorizedError("Session invalidated")` on version mismatch. The "no revocation path short of rotating `NEXTAUTH_SECRET`" framing was wrong — per-user revocation has been live since `tokenVersion` shipped on `User` (default `0`); the bump triggers are logout (via `createLogoutHandler` → `incrementTokenVersion`), role change (`iamUserAdminApi.updateUser`/`updateRole`), soft-delete (`deleteUser`), and invite acceptance. Updated `SESSION_MAX_AGE` from the original 30-day value to the current 7 days. Refresh-token rotation, per-cookie JTI revocation, and a standalone admin "revoke user X" endpoint remain on the deferred list.
- **2026-04-10** — original draft (30-day max age, no `tokenVersion`).
