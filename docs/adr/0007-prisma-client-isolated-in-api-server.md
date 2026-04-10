# 0007. Prisma client is isolated to `@repo/api-server`

- **Status:** Accepted
- **Date:** 2026-04-10
- **Tags:** `architecture`, `dependency-inversion`, `bounded-contexts`

## Context

Prisma is the ORM (see ADR 0003). The Prisma client has two properties that make it dangerous to spread across the monorepo:

1. **It is a server-only runtime.** Bundling `@prisma/client` into a browser build crashes: the Rust query engine binaries, the native `@prisma/engines` downloads, and the connection management code all assume a Node.js runtime.
2. **Its generated types leak database shape into domain code.** A handler that imports `import { User } from "@prisma/client"` has a type that includes `password` and `deletedAt` and every other column, without the mapping layer that marks those as secrets or drops them for external consumers.

Without a hard isolation rule, two failure modes appear:

- A careless client-side import — say, an `@app/lib/hooks/use-user.ts` that imports `User` from `@prisma/client` for "just the type" — drags the Prisma runtime into the browser bundle. `next build` might warn; it might not; the cold-start penalty is real.
- Business logic spreads into the apps. An endpoint-like file in `apps/admin/src/lib/server/users.ts` ends up doing `prisma.user.findMany()` directly, bypassing the `api-server` package and the mapper layer. The boundary rots invisibly.

The rule we want is simple: **one package, and only one package, imports `@prisma/client`**. Everything else consumes typed, mapped, validated contracts.

## Decision

`@prisma/client` and `@prisma/engines` are dependencies **only** of `packages/api-server`. No other package in `packages/` and no app in `apps/` may import from `@prisma/client`.

Enforcement is currently by convention and code review. Automatic enforcement will be added when `dependency-cruiser` ships in commit 1.3.A (Big Tech audit, section 1.3) with the rule:

```js
{
  name: "no-prisma-outside-api-server",
  severity: "error",
  from: { pathNot: "^packages/api-server/" },
  to: { path: "^@prisma/client" },
}
```

Consumers outside `api-server` get domain data through three layers:

1. **Contract types** from `@repo/contracts` (runtime + static). Inferred from Zod schemas, Prisma-free.
2. **Mapped DTOs** produced by `packages/api-server/src/mappers/*.mapper.ts` (server-side only). Convert Prisma model instances to contract types, dropping internal fields like `password`, converting `Decimal` to `number`, mapping Prisma enums to contract enums.
3. **HTTP API** exposed through route handlers in `apps/*/api/`, consumed by clients via `@repo/api-client`.

The test infrastructure in `packages/api-server/src/test/helpers.ts` is a deliberate exception: it instantiates its own `PrismaClient` to bypass the soft-delete extension during cleanup. This exception is scoped to the test harness and is annotated.

## Consequences

**Positive:**

- Bundle safety: a careless client-side Prisma import is an immediate build failure (even by convention today — the TypeScript project graph surfaces it fast).
- Domain purity: UI code never sees `password`, `deletedAt`, or `emailVerified` columns unless a mapper explicitly exposes them.
- Clear owner for schema changes: a new field in Prisma requires an explicit decision about whether to expose it, and where — mapper + contract + API schema — not an implicit leak via shared types.
- Prisma upgrades are a one-package problem: only `@repo/api-server` needs to rebuild.
- The boundary forces the mapper pattern to exist, which in turn creates the right place for field-level access control (e.g., `mapToAdminUser` can return fields that `mapToPublicUser` does not).

**Negative:**

- **Every entity needs a mapper.** For a twenty-something-entity domain, that is a lot of boilerplate. Some of it is mechanical: `id → id`, `createdAt → createdAt`, `role → ROLE_MAP[role]`. The boilerplate is the cost of the boundary.
- **Enum mapping is especially verbose.** Each Prisma enum needs a paired contract enum and a `Record<Prisma, Contract>` + `Record<Contract, Prisma>` map in `enum-maps.ts`. Anti-pattern in `CLAUDE.md` explicitly forbids `as` casts here, which keeps the boundary honest at the cost of two extra lines per enum value.
- **Drift risk at the mapper layer.** A new field added to Prisma is not automatically exposed in the contract — which is the point, but it also means a new field can be silently dropped from the API because nobody updated the mapper. Mapper unit tests partially mitigate this (`training-plan.mapper.test.ts`, `user.mapper.test.ts`, `enum-maps.test.ts`).
- **Automatic enforcement is pending.** Today the rule is "code review catches it". One motivated developer pushes a PR with `import { User } from "@prisma/client"` in `packages/ui` and it takes a human to notice. Dep-cruiser will close this gap (audit section 1.3).

**Neutral:**

- `@repo/api-routes` does not import Prisma either, even though it is a server-only package. This is deliberate: the route helper layer is about HTTP concerns (auth wrappers, error handling, response parsing), not data access. Enforcing "no Prisma outside api-server" is cleaner than "no Prisma except in api-server and api-routes".
- `packages/api-server/prisma/seed.ts` uses `new PrismaClient()` directly instead of the singleton from `db/client.ts`. This is acceptable because seed is a one-shot dev-time script, not part of the runtime codebase. The ESLint `max-lines` rule is disabled for seed for the same reason.

## Alternatives considered

**No rule — let any package import Prisma.** The natural state. Short-term productive. Long-term poisonous. Rejected from the outset because the bundle safety guarantee alone justifies the rule.

**Allow Prisma in "server-only" packages** (e.g., `api-server`, `api-routes`, any future `workers` package). Slightly looser. Rejected because the exception list would grow, and every new package would relitigate the question. One package, one owner, is simpler.

**Re-export Prisma types from `@repo/contracts`.** Would mean `@repo/contracts` imports `@prisma/client` for types only. Rejected for two reasons. First, `import type` in TypeScript is erased at compile time, but the type-only import still pulls the package into `node_modules` and into the dependency graph, creating the appearance of a runtime dep. Second, it would re-create the shape leak: contract consumers would know that `password` exists on `User`, and the mapper layer loses its purpose.

**Accept the leak and rely on `next build` tree-shaking.** Rejected. Tree-shaking is best-effort, and Prisma's generated client has side effects (binary download, connection pool initialization) that are not safely tree-shakeable.

**Use `type`-only Prisma imports where needed.** Rejected as a slippery slope. Even type-only imports couple consumers to the physical schema. The mapper layer is the correct boundary.

## References

- `packages/api-server/package.json` — the only package with `@prisma/client` in `dependencies`.
- `packages/api-server/src/mappers/` — the mapping layer.
- `packages/api-server/src/db/client.ts` — the singleton `prisma` instance.
- ADR 0003 — Prisma as the ORM.
- ADR 0005 — contracts as the API boundary type.
- ADR 0009 — the soft-delete extension, and why the test harness gets an exception.
- Big Tech audit, section 1.3 — pending enforcement via dependency-cruiser.
