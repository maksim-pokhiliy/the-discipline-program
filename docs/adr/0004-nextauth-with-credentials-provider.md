# 0004. NextAuth v4 with credentials provider

- **Status:** Accepted
- **Date:** 2026-04-10
- **Tags:** `auth`, `security`, `session`

## Context

The project has three role types — ADMIN, COACH, USER (athlete) — and three apps that need authenticated sessions: `admin` (desktop back-office), `platform` (mobile-first coach/athlete app), and `marketing` (public, no auth). Requirements for the auth layer:

1. **Email + password login.** At launch, no OAuth. Coaches and athletes are onboarded through direct signup or coach invitation, not through Google/GitHub.
2. **Session-bound API calls from the same browser.** A cookie-based session that the Next.js route handlers can read on the server.
3. **Role check on every server call.** Handlers need to know who the user is and whether they have the right role (ADMIN for admin app, any authenticated user for platform).
4. **Zero server state if possible.** The deployment target (Vercel) runs on serverless functions. Database-backed sessions add a round-trip to every request. JWT sessions keep state in the cookie.
5. **Ports and adapters for the user lookup.** The auth layer must not directly import Prisma. User validation must go through an injected adapter so that `@repo/auth` has zero runtime deps on `api-server`.
6. **Same internal interface for admin and platform.** Both apps compose the NextAuth config from a shared factory and attach their own auth wrappers.

## Decision

We use **NextAuth v4** (`next-auth@4.24.11`, the pre-Auth.js name), configured through the `CredentialsProvider`, with JWT sessions.

The auth package exposes a **port-and-adapter pattern**:

```ts
// packages/auth/src/auth-options.ts
export type AuthServiceAdapter = {
  validateUser: (email: string, password: string) => Promise<AuthUser | null>;
  getUserById: (id: string) => Promise<{ role: UserRole } | null>;
};

export const createAuthOptions = (service: AuthServiceAdapter): NextAuthOptions => ({
  providers: [CredentialsProvider({ ... })],
  callbacks: { jwt, session },
  session: { strategy: "jwt", maxAge: AUTH_CONSTANTS.SESSION_MAX_AGE },
  secret: authEnv.NEXTAUTH_SECRET,
});
```

The adapter is provided by `api-server`'s `iamAuthService` (which owns the Prisma access). Each app calls `createAuthOptions(iamAuthService)` in its own `src/lib/server/auth.ts` and wires it into the NextAuth route handler.

Passwords are hashed with `bcryptjs` at salt rounds = 10. The JWT callback refreshes the user record from the adapter on every request (to invalidate sessions whose user was deleted), and the session callback copies token fields onto `session.user`.

## Consequences

**Positive:**

- `@repo/auth` has zero Prisma dependency. The port is `AuthServiceAdapter`, and Prisma access is owned by `api-server`. This is the reference port-and-adapter example in the codebase (see ADR 0001).
- JWT sessions are stateless: zero database reads to validate a session cookie. Serverless-friendly.
- The JWT callback still calls `service.getUserById(token.id)` on every refresh, so a deleted user invalidates the session at the next cookie refresh. We pay a DB lookup for the freshness guarantee, but not on every single request — only on JWT refresh.
- Credentials-only login keeps the surface area small. No OAuth consent screens, no external provider keys, no "sign in with Google but also have an account" ambiguity.
- `withAdminAuth` and `withPlatformAuth` wrappers in `@repo/api-routes` bind the session check to the handler factory layer, so forgetting to auth a route requires deliberate effort.

**Negative:**

- **`withPlatformAuth` does not check role**, only session presence. Any authenticated user — athlete, coach, admin — can call any `/api/platform/*` endpoint. Role enforcement is delegated to manual guards inside each endpoint (`verifyAthleteBelongsToCoach`, `verifyPlanOwnership`, etc.). This is an "open door + manual bouncer" pattern, and a forgotten guard is a data leak. Flagged as a security gap; a policy layer is the long-term fix.
- **`MIN_PASSWORD_LENGTH = 6`** is weak by 2026 standards (NIST recommends ≥ 8, OWASP ≥ 12). Flagged as a known security gap.
- **`SESSION_MAX_AGE = 30 * 24 * 60 * 60`** (30 days) with JWT means a leaked token is valid for a month. There is no revocation path for an in-flight JWT short of rotating `NEXTAUTH_SECRET` (which logs out everyone). Access token / refresh token split is the standard mitigation; we do not have it.
- **Timing attack on user enumeration.** `validateUser` returns `null` immediately if the user does not exist, without running `bcrypt.compare`. Existing vs non-existing users have distinguishable response times. Flagged as a known security gap.
- **Two NextAuth instances** (admin and platform apps each build their own `authOptions` and mount their own `/api/auth/[...nextauth]/route.ts`). See ADR 0011 for the separate decision on why this is acceptable.
- **Credentials-only means no OAuth recovery path.** A forgotten password requires an email reset flow, which does not exist yet.
- NextAuth v4 is the pre-rename release. Auth.js v5 is the current name. We have not migrated because v5 has breaking changes and the upgrade is scheduled for when ADR 0011 (dual instances) is revisited.

**Neutral:**

- `bcryptjs` is a pure-JS bcrypt implementation. Slower than native `bcrypt` but works on every runtime including serverless cold starts. Trade-off: ~100ms extra on cold start vs broken native bindings on some deploys.
- Email is not normalized on login (`where: { email }` is used as-is). Postgres string comparison is case-sensitive by default, so `FOO@example.com` and `foo@example.com` are different users. Flagged as a known security gap.

## Alternatives considered

**NextAuth v5 / Auth.js.** The successor. Cleaner API, better middleware support, native Next.js 14+ integration. Rejected for now only because v4 works and the upgrade cost is non-zero. Planned for a later sprint when we also revisit the dual-instance question (ADR 0011).

**Clerk.** Managed auth. Excellent developer experience, strong security defaults (MFA, magic links, rate limiting, account lockout out of the box), handles everything we would otherwise build by hand. Rejected for two reasons. First, it adds a third-party dependency to every user login path — a hard vendor lock-in for the most critical UX. Second, coaching platforms can involve sensitive data (athlete medical info in `AthleteProfile.healthStatus`, `healthNote`, `weightKg`), and sending that lookup through Clerk puts an external vendor on the PII path. Worth reconsidering if we outgrow the DIY auth before we outgrow the privacy budget.

**Auth0 / Okta / AWS Cognito.** Same shape as Clerk. Same rejection reasons, plus higher price and less favorable DX.

**Supabase Auth.** Tied to Supabase as the database. We use Prisma on plain Postgres, so Supabase Auth would mean running two auth systems (theirs for login, ours for session enrichment). Rejected on coupling grounds.

**Custom JWT + bcrypt from scratch.** Maximum control, maximum bug surface. NextAuth is boring infrastructure; reimplementing it is a poor use of engineering time. Rejected.

**Session-backed auth with database lookup on every request.** More secure (revocation is instant: delete the session row). More expensive (DB round-trip per request). Not considered seriously because the user-lookup-per-JWT-refresh pattern gives us 90% of the revocation benefit at 10% of the cost.

**Passwordless / magic link only.** Nice UX for marketing-facing signups. Worse for coaching contexts where a coach wants to log in from a phone mid-session and cannot afford to wait for an email. Not aligned with the platform's usage pattern. Rejected.

## References

- `packages/auth/src/auth-options.ts` — the config factory and `AuthServiceAdapter` port.
- `packages/auth/src/providers/session-guard.tsx` — client-side session enforcement.
- `packages/api-routes/src/auth-wrappers.ts` — `withAdminAuth` and `withPlatformAuth`.
- `packages/api-server/src/services/auth.ts` — the adapter implementation.
- ADR 0011 — two independent NextAuth instances.
- ADR 0012 — JWT session strategy with 30-day max age.
- ADR 0018 — security deferred decisions (password policy, role-check policy layer, timing-attack mitigation).
