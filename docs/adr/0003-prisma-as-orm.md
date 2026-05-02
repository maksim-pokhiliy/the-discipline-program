# 0003. Prisma as the ORM

- **Status:** Accepted (with known gaps — see Consequences)
- **Date:** 2026-04-10
- **Last revised:** 2026-05-02 (Negative consequences synced with ADR-0009 — soft-delete extension now covers `count` / `aggregate` / `groupBy` / `findFirstOrThrow` / `findUniqueOrThrow`; see Revision history)
- **Tags:** `database`, `orm`, `typescript`

## Context

The project persists a PostgreSQL database with 23 entities spanning four bounded contexts (IAM, CMS, LMS, Coaching) and a billing layer that exists in the schema but not yet in the API. The data access requirements are:

1. **Full TypeScript type-safety end to end.** A field rename in the schema must fail `check-types` in every consumer — no string-based query paths.
2. **Relational queries with nested includes.** Training plans fetch nested workouts, workout logs fetch nested set logs, coach dashboards fetch athletes with their plans and enrollments. The ORM must generate correct SQL for multi-level nested loads without N+1.
3. **Migrations as code.** Schema changes live in the repository and are reviewable. (Note: this requirement is not yet met — see ADR 0009 and ADR 0019.)
4. **Soft delete semantics.** Several models (`User`, `Product`, `TrainingPlan`, `Workout`, `CoachProfile`, `MarketingBlogPost`, `MarketingReview`, `MarketingContactSubmission`) must support soft delete with filtering transparent to query callers.
5. **Single-place Prisma ownership.** Only `packages/api-server` may import `@prisma/client`. The rest of the monorepo consumes domain types through `@repo/contracts`, never Prisma types.

## Decision

We use Prisma (`@prisma/client` 6.1.0, `prisma` CLI 6.1.0) as the ORM. The schema lives at `packages/api-server/prisma/schema.prisma`. The client is instantiated once in `packages/api-server/src/db/client.ts` as a singleton with a `$extends` soft-delete extension, and exported as `prisma`. Every endpoint and mapper in `api-server` imports this singleton, never creates its own instance.

Conventions:

- Prisma-generated enums and models are **never** re-exported. They cross the boundary into contracts via mapper functions (`packages/api-server/src/mappers/`) and type-safe enum maps (`enum-maps.ts`).
- Domain code uses the singleton `prisma`. The test harness in `packages/api-server/src/test/helpers.ts` uses a raw `new PrismaClient()` to bypass the soft-delete extension during cleanup — an acknowledged exception that is scoped to test infrastructure.
- Schema changes are applied through `prisma db push` in development (see ADR 0009 for the known gap: production-grade migrations are not yet set up).

## Consequences

**Positive:**

- The Prisma client is fully typed against the schema. A rename of `TrainingPlan.name` would fail compilation in every endpoint, mapper, and test that touches it.
- `include` / `select` generate correct SQL with a single query for nested loads. N+1 is avoided by construction for relational reads.
- The Prisma `$transaction` API works for both interactive transactions (`$transaction(async tx => ...)`) and batched arrays. We use it inconsistently today (flagged as a database-strategy gap in ADR 0019); the tooling is there.
- Prisma enforces a single source of truth for the physical schema. No hand-written SQL types, no drift.
- `prisma generate` is wired into `postinstall` via `turbo run db:generate`, so a fresh clone is one `pnpm install` away from a working client.

**Negative:**

- **Prisma types cannot be used across the monorepo boundary.** The rule "only `api-server` imports `@prisma/client`" is a hard constraint that requires a mapper layer for every entity. This is extra code, and every mapper is a place to introduce drift between the physical schema and the contract.
- **The soft-delete extension intentionally leaves `update` / `updateMany` / `upsert` unfiltered.** ADR 0009 is the authoritative spec: read coverage now includes `findMany`, `findFirst`, `findFirstOrThrow`, `findUnique`, `findUniqueOrThrow`, `count`, `aggregate`, `groupBy`; destructive coverage is `delete` and `deleteMany` (rewritten to set `deletedAt`). The remaining gap is by design — `update`/`updateMany` are the restoration path, and `upsert` is partially protected by the suffix-on-delete trick. Verified in `packages/api-server/src/db/client.ts:102-268`.
- **Prisma has historically been heavy at query time** due to its Rust-based query engine. Cold start on serverless is measurable. We accept this because we are running on Vercel with warm instances, but it is a watch-list item.
- **Raw SQL escape hatches exist** (`$queryRaw`, `$executeRaw`) and are untyped. Code review must catch any use of them that bypasses the mapper layer.
- **`Decimal` columns return as a `Decimal` instance**, not a number, and mappers must explicitly convert (`Number(p.weightKg)` in `user.mapper.ts`). Precision loss is possible if a developer forgets.

**Neutral:**

- Enum mapping is a deliberate boilerplate layer (`mappers/enum-maps.ts`). Both directions (`PRISMA_TO_CONTRACT` and `CONTRACT_TO_PRISMA`) are declared as `Record<...>` so that TypeScript catches missing keys. This is by design, not accidental verbosity.
- Prisma schema is one file. At 532 lines and 23 models, it is still readable. Splitting is unnecessary until it crosses ~1000 lines or multiple bounded contexts have wildly different update frequencies.

## Alternatives considered

**Drizzle ORM.** The most credible alternative in 2026. Lighter, closer to raw SQL, no code generation step, no query engine binary. Stronger performance on cold starts. The trade-off is that Drizzle's query builder is more verbose for nested relational reads — the kind of queries we do constantly in coach dashboards and training plans. Drizzle also has weaker migration ergonomics at the time of writing. Rejected for now because Prisma's relational query ergonomics win at this workload. Worth revisiting if we ever migrate off Vercel (Prisma's cold-start tax becomes worse on non-warm runtimes).

**Kysely.** A query builder rather than an ORM. Excellent type safety, very close to SQL, no runtime overhead. Migration and schema management is bring-your-own. Rejected because we want the schema to be the source of truth, not hand-maintained types. Kysely would work well if we had a DBA-driven workflow; we do not.

**TypeORM.** Legacy. Decorators-heavy, weak inference, spotty Postgres support, well-known footguns around entity relations. Rejected: not competitive in 2026.

**MikroORM.** Credible DDD-flavored ORM with an identity map and unit of work. Richer semantics than Prisma. Rejected because the identity map does not compose well with serverless execution (every request is a new context), and because the conceptual weight is higher than what we need at this stage.

**Raw `pg` with hand-written queries.** Maximum flexibility, zero ORM overhead. Unthinkable at 23 models and growing. Rejected on productivity grounds.

**Supabase / PlanetScale / Neon SDKs directly.** Vendor SDKs abstract the transport but not the query layer. Would still need an ORM or query builder on top. Orthogonal decision; we use the Postgres driver via `DATABASE_URL`.

## References

- `packages/api-server/prisma/schema.prisma` — the schema.
- `packages/api-server/src/db/client.ts` — Prisma singleton + soft-delete extension.
- `packages/api-server/src/mappers/` — Prisma → contracts mapper layer.
- ADR 0009 — the soft-delete extension as a separate, explicit decision (authoritative for the operation coverage list).
- ADR 0019 — database-strategy deferred decisions (production migrations, transaction discipline).

## Revision history

- **2026-05-02** — Negative consequences synced with ADR-0009 to remove the contradiction. The "extension does not cover `count` / `aggregate` / `groupBy` / `findFirstOrThrow` / `findUniqueOrThrow`" claim was outdated as of ADR-0009's 2026-04-30 revision (matching the `client.ts` implementation since then). Remaining gaps narrowed to `update` / `updateMany` / `upsert`, all intentional per ADR-0009.
- **2026-04-10** — original draft.
