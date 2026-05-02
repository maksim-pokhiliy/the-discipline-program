# `@repo/auth`

NextAuth (v4) configuration shared between the admin and platform apps. Each app mounts its own NextAuth instance ([ADR 0011](../../docs/adr/0011-two-independent-nextauth-instances.md)) but composes its options from the same factory and the same module-augmented session shape defined here.

## Public API

The package ships four entry points, declared in `package.json#exports`:

```ts
import {
  AUTH_ROUTES,
  PUBLIC_ROUTES,
  PUBLIC_ROUTE_PREFIXES,
  SESSION_COOKIES,
  AuthProvider,
  SessionGuard,
  createLogoutHandler,
  hasSessionCookie,
  isPublicRoute,
  validateCallbackUrl,
  getToken,
} from "@repo/auth";

import { signIn, signOut, useSession } from "@repo/auth/client";

import { type AuthServiceAdapter, createAuthOptions } from "@repo/auth/config";

import "@repo/auth/types";
```

- **`@repo/auth`** (server-side default) — route constants, session-cookie list, logout-handler factory, route-classification helpers, NextAuth's `getToken` re-export, plus the React tree providers that need a server boundary today (`AuthProvider`, `SessionGuard`).
- **`@repo/auth/client`** — pure re-export of `signIn`, `signOut`, `useSession` from `next-auth/react` (a `"use client"` shim).
- **`@repo/auth/config`** — `createAuthOptions(service: AuthServiceAdapter): NextAuthOptions` plus the `AuthServiceAdapter` type. Each app constructs its own `NextAuthOptions` by passing in its own service adapter (today both admin and platform pass `iamAuthService` from `@repo/api-server/iam`).
- **`@repo/auth/types`** — side-effect import that augments `next-auth` and `next-auth/jwt` to carry `id`, `email`, `name`, `image`, `role`, and `tokenVersion` on `Session.user` and the JWT.

## Layout

```
src/
  index.ts                         Server-side barrel (constants, providers, utils, logout-handler, getToken re-export)
  client.ts                        "use client" — re-exports signIn/signOut/useSession from next-auth/react
  auth-options.ts                  createAuthOptions factory + AuthServiceAdapter port + AuthUser shape
  logout-handler.ts                createLogoutHandler — bumps tokenVersion + clears session cookies + redirects to /login
  constants/index.ts               AUTH_ROUTES, PUBLIC_ROUTES, PUBLIC_ROUTE_PREFIXES, SESSION_COOKIES
  providers/auth-provider.tsx      <AuthProvider> — wraps next-auth/react SessionProvider
  providers/session-guard.tsx      <SessionGuard> — useSession({ required: true }) + auto-signOut on unauthenticated
  utils/has-session-cookie.ts      hasSessionCookie(req) — request-side cookie probe (no validation)
  utils/is-public-route.ts         isPublicRoute(pathname) — match against PUBLIC_ROUTES + PUBLIC_ROUTE_PREFIXES + /api/auth*
  utils/validate-callback-url.ts   validateCallbackUrl(raw, options) — strict callback-URL allow-listing for sign-in redirects
  types/next-auth-extensions.ts    Module augmentation for Session.user + JWT
```

## Conventions

- Session strategy is JWT-backed with per-user `tokenVersion` revocation ([ADR 0012](../../docs/adr/0012-jwt-session-strategy.md)). `SESSION_MAX_AGE` (in `packages/contracts`) is currently 7 days; a `tokenVersion` mismatch in the JWT callback throws `UnauthorizedError("Session invalidated")` and forces re-login at the next refresh.
- The JWT secret (`NEXTAUTH_SECRET`) is **shared across admin and platform** (single env var; see [ADR 0011](../../docs/adr/0011-two-independent-nextauth-instances.md) §Decision). Independence between the two apps is topological (separate Vercel projects, separate cookie jars on separate subdomains), not cryptographic.
- The package has **zero Prisma dependency**. `AuthServiceAdapter` (`validateUser` + `getUserById`) is the only contract the auth layer asks of the data layer; today it is satisfied by `iamAuthService` in `@repo/api-server/iam`.
- `createLogoutHandler` is the canonical sign-out path: it calls `incrementTokenVersion(userId)` before clearing the cookie names listed in `SESSION_COOKIES` and redirecting to `AUTH_ROUTES.LOGIN`. Use it instead of hand-rolled `signOut` flows on the server side.
- Credentials provider only — no third-party OAuth ([ADR 0004](../../docs/adr/0004-nextauth-with-credentials-provider.md)).
- Role enforcement at the route-handler layer lives in `@repo/api-routes` (`createAuthWrappers` emits `withAdminAuth` / `withCoachAuth` / `withAthleteAuth` / `withAuthenticated`). For IAM mutations that must reject `HEAD_COACH`, the strict actor-role check `requireAdminStrict` lives in `packages/api-server/src/authz/guards.ts`.

## Related ADRs

- [ADR 0004 — NextAuth with credentials provider](../../docs/adr/0004-nextauth-with-credentials-provider.md)
- [ADR 0011 — two independent NextAuth instances](../../docs/adr/0011-two-independent-nextauth-instances.md)
- [ADR 0012 — JWT session strategy with token-version revocation](../../docs/adr/0012-jwt-session-strategy.md)
- [ADR 0018 — security deferred decisions (refresh tokens, JTI blacklist, admin force-logout endpoint)](../../docs/adr/0018-security-deferred-decisions.md)
