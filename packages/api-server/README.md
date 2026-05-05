# `@repo/api-server`

Server-only business logic + Prisma client. The **sole** package that talks to Postgres ([ADR 0007](../../docs/adr/0007-prisma-client-isolated-in-api-server.md)). Owns the Prisma schema, the soft-delete extension, the seed script, and all domain endpoints + services.

## Public API

Subpath exports per bounded context — consumers must import from a subpath, not from the root. Boundaries documented in [`docs/BOUNDED-CONTEXTS.md`](../../docs/BOUNDED-CONTEXTS.md).

```ts
import {} from /* CMS endpoints */ "@repo/api-server/cms";
import {} from /* LMS endpoints */ "@repo/api-server/lms";
import {} from /* coaching endpoints */ "@repo/api-server/coaching";
import {} from /* IAM endpoints */ "@repo/api-server/iam";
import {} from /* storage endpoints */ "@repo/api-server/storage";
import {} from /* ops endpoints */ "@repo/api-server/ops";
import {} from /* monitoring */ "@repo/api-server/infrastructure/monitoring";
```

## Layout

```
src/
  endpoints/<context>/  Per-context endpoint modules; barrel re-exports each entity API
  services/<context>/   Cross-entity orchestration helpers
  infrastructure/       Cache, email port, monitoring, payment, queue ports
  db/                   Prisma client + soft-delete extension (client.ts)
prisma/                 schema.prisma + seed.ts + seed-pages.ts
scripts/                apply-sql-checks.ts (DB-level CHECK constraints)
```

## Key files

- `src/db/client.ts` — Prisma client + soft-delete `$extends` ([ADR 0009](../../docs/adr/0009-soft-delete-via-prisma-extension.md)).
- `prisma/schema.prisma` — single source of truth for the data model.
- `prisma/seed.ts` — non-prod seed entry point (DB is non-prod per project memory).

## Scripts

- `pnpm db:generate` / `db:push` / `db:reset` / `db:seed` (proxied from the root via `pnpm --filter @repo/api-server <script>`).
- `pnpm db:apply-checks` — applies hand-written SQL CHECK constraints after `db:push`.

## Related ADRs

- [ADR 0003 — Prisma as ORM](../../docs/adr/0003-prisma-as-orm.md)
- [ADR 0007 — Prisma client isolated in api-server](../../docs/adr/0007-prisma-client-isolated-in-api-server.md)
- [ADR 0009 — soft delete via Prisma extension](../../docs/adr/0009-soft-delete-via-prisma-extension.md)
- [ADR 0017 — Anemic domain model acceptable pre-product](../../docs/adr/0017-anemic-domain-model-acceptable-pre-product.md)
- [ADR 0037 — plan editor and library rollback](../../docs/adr/0037-plan-editor-and-library-rollback.md)
