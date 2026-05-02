# 0004. NextAuth v4 with credentials provider

- **Status:** Accepted (with known gaps — see Consequences)
- **Date:** 2026-04-10
- **Last revised:** 2026-05-02 (Consequences updated to reflect role-aware wrappers and IAM strict-actor guard; see Revision history)
- **Tags:** `auth`, `security`, `session`

## Context

The project has four role types — `ATHLETE`, `COACH`, `HEAD_COACH`, `ADMIN` (per `UserRole` enum in `packages/contracts/src/entities/iam/auth/auth.constants.ts`) — and three apps that need authenticated sessions: `admin` (desktop back-office, `ADMIN` only), `platform` (mobile-first coach / athlete app, `COACH` / `HEAD_COACH` / `ATHLETE`), and `marketing` (public, no auth). Requirements for the auth layer:

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
- The role-aware wrappers in `@repo/api-routes` (`withAdminAuth`, `withCoachAuth`, `withAthleteAuth`, `withAuthenticated`) bind both the session check and the role allow-list to the handler factory layer, so forgetting to auth or misclassifying a route requires deliberate effort.

**Negative:**

- **Role enforcement now lives at the wrapper layer.** `createAuthWrappers` (in `packages/api-routes/src/auth-wrappers.ts:64-69`) emits `withAdminAuth` (`ADMIN | HEAD_COACH`), `withCoachAuth` (`COACH | HEAD_COACH | ADMIN`), `withAthleteAuth` (`ATHLETE | COACH | HEAD_COACH`), and `withAuthenticated` (any authenticated role) — each composed by `buildWrapper(authOptions, allowed)` and gated by `isRoleAllowed(role, allowed)`. Per-resource ownership guards (`verifyPlanOwnership`, `verifyAthleteBelongsToCoach`, `resolveCoachId`) still live in the endpoints — those are the second hop, not the first. For IAM mutations that must reject HEAD_COACH because the role allow-list of `withAdminAuth` is intentionally broader, `requireAdminStrict` (in `packages/api-server/src/authz/guards.ts:29-38`) tightens to `role === ADMIN` exactly; it is invoked at the top of `iamUserAdminApi.updateUser`, `updateRole`, and `deleteUser` (committed in `f3a13709`). The remaining gap is the absence of a declarative policy layer (CASL / oso / OPA) — the wrappers cover entry-level role gating, but cross-resource policies are still hand-coded.
- **Password floor — `MIN_PASSWORD_LENGTH = 12`**, tightened from the original `6` to meet OWASP's 12-character recommendation. Per-email login rate-limiting and MFA remain deferred (ADR 0018).
- **Session window — `SESSION_MAX_AGE = 7 * 24 * 60 * 60`** (7 days, tightened from the original 30 days). Per-user revocation now exists via the `tokenVersion` JWT claim (see ADR 0012) — bumped on logout, role change, soft-delete, and invite acceptance — so a leaked JWT can be invalidated for that user without rotating `NEXTAUTH_SECRET`. Access-token / refresh-token split, per-cookie JTI revocation, and a standalone admin "revoke session" endpoint remain deferred.
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
- `packages/api-routes/src/auth-wrappers.ts` — `createAuthWrappers` factory + role-aware wrappers (`withAdminAuth`, `withCoachAuth`, `withAthleteAuth`, `withAuthenticated`).
- `packages/api-server/src/authz/guards.ts` — `requireAdminStrict` (strict `role === ADMIN` actor guard for IAM mutations), `requireAdmin` (admin-or-head-coach), `requireCoachLikeRole`, `verifyPlanOwnership`, `verifyAthleteBelongsToCoach`, `resolveCoachId`.
- `packages/api-server/src/endpoints/iam/auth-service.ts` — the adapter implementation (`iamAuthService`), exposing `validateUser`, `getUserById`, `incrementTokenVersion`.
- ADR 0011 — two independent NextAuth instances.
- ADR 0012 — JWT session strategy.
- ADR 0018 — security deferred decisions (declarative authz policy layer, timing-attack mitigation, password-policy upgrade rationale).

## Revision history

- **2026-05-02** — Consequences and References updated to match current code. The Negative bullet about `withPlatformAuth` not checking role was rewritten because role-aware wrappers landed in `packages/api-routes/src/auth-wrappers.ts` (no `withPlatformAuth` symbol exists; the four exported wrappers are `withAdminAuth`, `withCoachAuth`, `withAthleteAuth`, `withAuthenticated`, all role-gated via `isRoleAllowed`). Added a pointer to `requireAdminStrict` (commit `f3a13709`), the actor-role guard now invoked at the top of `iamUserAdminApi.updateUser`, `updateRole`, and `deleteUser` to reject HEAD_COACH for IAM mutations. References repointed at the canonical files (`endpoints/iam/auth-service.ts`, `authz/guards.ts`). Context updated to four-role `UserRole` enum (was "three role types"). Negative bullets for `MIN_PASSWORD_LENGTH` (6 → 12) and `SESSION_MAX_AGE` (30d → 7d) updated to current values; the original-value framing moved into a short historical note.
- **2026-04-10** — original draft.
