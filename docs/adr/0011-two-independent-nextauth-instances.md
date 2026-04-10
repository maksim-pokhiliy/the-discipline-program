# 0011. Two independent NextAuth instances (admin + platform)

- **Status:** Accepted (tech debt — planned for consolidation; see Consequences)
- **Date:** 2026-04-10
- **Tags:** `auth`, `tech-debt`, `under-review`

## Context

`apps/admin` and `apps/platform` each have their own NextAuth route handler at `src/app/api/auth/[...nextauth]/route.ts`, each importing a per-app `authOptions` from `src/lib/server/auth.ts`, each calling `createAuthOptions(authService)` from `@repo/auth`. The two `auth.ts` files are almost byte-for-byte identical:

```ts
// apps/admin/src/lib/server/auth.ts
import { createAuthWrappers } from "@repo/api-routes/auth";
import { authService } from "@repo/api-server/iam";
import { createAuthOptions } from "@repo/auth/config";

export const authOptions = createAuthOptions(authService);
export const { withAdminAuth } = createAuthWrappers(authOptions);
```

```ts
// apps/platform/src/lib/server/auth.ts
import { createAuthWrappers } from "@repo/api-routes/auth";
import { authService } from "@repo/api-server/iam";
import { createAuthOptions } from "@repo/auth/config";

export const authOptions = createAuthOptions(authService);
export const { withPlatformAuth } = createAuthWrappers(authOptions);
```

Two questions fall out of this:

1. **Is this duplication intentional or accidental?** Writing the same code twice with the same dependencies is a smell unless there is a reason.
2. **Are these two actually different NextAuth instances at runtime?** If `admin` and `platform` are deployed as separate Vercel projects on separate subdomains, each gets its own cookie jar and its own process — they are independent by virtue of the deploy topology, and the duplication is a necessary consequence. If they are deployed as one project, the duplication is pure waste.

Today the deploy topology is unclear (no `vercel.json` is checked in, see Big Tech audit section 1.5). The code behaves as if the two were independent. That is a decision that has been made by default, not by design.

## Decision

We **accept the duplication as tech debt** and document it here so that the debt is visible, not invisible. Specifically:

- Each app continues to create its own `authOptions` via `createAuthOptions(authService)`.
- Each app continues to mount its own `/api/auth/[...nextauth]/route.ts`.
- Each app continues to create its own auth wrappers (`withAdminAuth` in admin, `withPlatformAuth` in platform).

The reasons this is acceptable today:

- The code duplication is tiny (six lines per app). Consolidation does not save much.
- The two apps have **different auth wrappers** (`withAdminAuth` enforces `role === ADMIN`, `withPlatformAuth` only checks presence of a session). Consolidating into a single shared `authOptions` module would still leave the wrapper duplication.
- The deploy topology question is unresolved. If the apps end up on separate subdomains, independent NextAuth instances are not just acceptable — they are correct (cookies do not cross subdomain boundaries, sessions are scoped to the right surface).
- The two apps have **different user populations**. Admin is for ADMIN users. Platform is for COACH and USER (athlete). Keeping the NextAuth surface physically separate has a security upside: a misconfigured callback in admin cannot accidentally grant a session to an athlete, because the athlete never hits the admin NextAuth route.

The reasons this is still tech debt:

- The duplication is not **documented** anywhere a future engineer can find it. That is what this ADR fixes.
- The `marketing` app does not have its own auth instance (correctly — it is public) and a future engineer may ask "why do admin and platform have separate auth but not marketing?". The answer is "marketing has no auth at all", and that is worth writing down.
- The JWT secret (`NEXTAUTH_SECRET`) is the same across both apps (single env var). A session minted by one app is technically valid for the other. This is **not currently exploited**, but it means the "independent" framing is imperfect. If admin and platform ever end up on the same domain, a session cookie set by one could be replayed into the other.

## Consequences

**Positive:**

- Blast radius: a misconfiguration in admin auth does not leak into platform and vice versa. They are separate physical routes.
- Deploy flexibility: the two apps can live on separate subdomains, separate Vercel projects, separate cookies without any code change.
- Per-app wrappers (`withAdminAuth`, `withPlatformAuth`) are colocated with the per-app `authOptions`, which is the natural place for them.
- No shared state: debugging an auth issue in one app does not require understanding the other.

**Negative:**

- Six lines of duplication × two apps = the code is copy-pasted. Changes to auth behavior (callback logic, session shape, maxAge) must be made in `@repo/auth`'s `createAuthOptions` — which is how it works today — but the _wrapper_ code in each app can drift.
- Audit debt: the Big Tech audit section 1.5 flags this as an item to resolve (either with an ADR or with consolidation). This ADR is the first half of the resolution; the second half is a decision on whether to consolidate.
- The shared `NEXTAUTH_SECRET` means the "independent" claim is topological, not cryptographic. If the apps ever share a domain, the independence disappears.
- Two `/api/auth/[...nextauth]/route.ts` files is two places to forget an update. If NextAuth v5 migration happens, both files need to be updated in lockstep.

**Neutral:**

- The factory pattern (`createAuthOptions(authService)`) is already in place and already handles most of the "keep it DRY" work. The per-app files are thin enough that consolidation would save a handful of lines, not a design pattern.
- The `marketing` app intentionally has no NextAuth instance. If marketing ever gains a "sign up for a newsletter that requires auth" flow, this ADR will need to be revisited — marketing would need its own instance, and we would have three.

## Alternatives considered

**Consolidate into a shared root app.** Merge admin, platform, and marketing into one Next.js app with three route groups. Share NextAuth, share session, share deploy. Rejected because the three apps have different UX requirements (admin desktop-first, platform mobile-first PWA, marketing public with custom visuals), different optimization profiles (admin okay to be dynamic, marketing must be static), and different deploy cadences (marketing changes daily for content; admin and platform change weekly for features). Monolithic deploy is the wrong direction.

**Put `authOptions` and the route handler in `@repo/auth`** as a shared factory + shared route. Both apps re-export the same route. Saves the six lines per app. Rejected because NextAuth route handlers are tightly coupled to the Next.js routing layer — exporting them from a package and re-importing them in each app would require workarounds that cost more than the duplication saves.

**Keep two instances, share the wrapper code.** Move `withAdminAuth` and `withPlatformAuth` to `@repo/auth` or `@repo/api-routes`. This is actually close to the current state: both wrappers are in `@repo/api-routes/auth-wrappers.ts`, created by `createAuthWrappers(authOptions)` which takes the per-app options. The per-app file just picks which wrapper to re-export. This is acceptable — it is the pattern we already have.

**Use a single NextAuth instance on a shared domain with role-based routing.** One `authOptions`, one route handler, one session cookie, routing logic decides which app the user lands on based on their role. Rejected because it couples the three apps into a single deploy unit, which the product strategy explicitly wants to avoid.

**Introduce Auth.js v5 and its new middleware pattern.** v5 has a cleaner shared-config story. Possibly the right move in a future ADR that supersedes this one. Deferred: the upgrade is non-trivial and should be its own decision.

## References

- `apps/admin/src/lib/server/auth.ts` and `apps/platform/src/lib/server/auth.ts` — the duplicated files.
- `apps/admin/src/app/api/auth/[...nextauth]/route.ts` and `apps/platform/src/app/api/auth/[...nextauth]/route.ts` — the duplicated route handlers.
- `packages/auth/src/auth-options.ts` — the `createAuthOptions` factory.
- `packages/api-routes/src/auth-wrappers.ts` — `createAuthWrappers` and the per-app wrapper logic.
- ADR 0004 — the NextAuth + credentials decision.
- Big Tech audit, section 1.5 — this item is flagged for resolution.
