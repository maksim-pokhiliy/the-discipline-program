# `@repo/auth`

NextAuth (v4) configuration shared between the admin and platform apps. Each app mounts its own NextAuth instance ([ADR 0011](../../docs/adr/0011-two-independent-nextauth-instances.md)) but reuses the credentials provider, JWT callbacks, and session-shape extensions defined here.

## Public API

```ts
import {} from /* server-side helpers */ "@repo/auth";
import {} from /* client-side hooks/wrappers */ "@repo/auth/client";
import { authOptions } from "@repo/auth/config";
import type {} from /* session/jwt augmentations */ "@repo/auth/types";
```

The `/config` entry exports the `NextAuthOptions` object the apps' `app/api/auth/[...nextauth]/route.ts` mounts. The `/types` entry contains the `next-auth` module-augmentation file each app re-exports to keep `Session.user` shaped consistently.

## Layout

```
src/
  index.ts                        Server-side helpers (getSession, role guards)
  client.ts                       Client-side hooks (useSession wrapper)
  auth-options.ts                 NextAuthOptions — credentials provider, callbacks, JWT strategy
  types/next-auth-extensions.ts   Module augmentation for Session + JWT
```

## Conventions

- Session strategy is JWT-backed ([ADR 0012](../../docs/adr/0012-jwt-session-strategy.md)). Stateless. Each app signs with its own `NEXTAUTH_SECRET`.
- Role + tenant fields are added to the JWT and surfaced on `Session.user`. Type augmentations live here so apps stay typed.
- Credentials provider only — no third-party OAuth ([ADR 0004](../../docs/adr/0004-nextauth-with-credentials-provider.md)).

## Related ADRs

- [ADR 0004 — NextAuth with credentials provider](../../docs/adr/0004-nextauth-with-credentials-provider.md)
- [ADR 0011 — two independent NextAuth instances](../../docs/adr/0011-two-independent-nextauth-instances.md)
- [ADR 0012 — JWT session strategy](../../docs/adr/0012-jwt-session-strategy.md)
