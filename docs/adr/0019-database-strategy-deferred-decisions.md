# 0019. Database strategy — deferred decisions

- **Status:** Accepted
- **Date:** 2026-04-13
- **Deciders:** Lead Architect
- **Tags:** `database`, `prisma`, `migrations`, `soft-delete`

## Context

A database strategy audit surfaced multiple database-level concerns. The project has no production data — the database is empty, recreatable via `db:push` + `db:seed`. Several decisions make sense to defer until a concrete trigger (first production deployment with real traffic, first external consumer, etc.) rather than pay for now.

This ADR captures 6 deferred decisions with explicit triggers, so they are tracked and not forgotten.

## Decisions

### 1. `db:push` until first production deployment, then switch to `prisma migrate`

The project uses `prisma db push` exclusively. There is no `prisma/migrations/` directory. This is acceptable while the database is empty and development-only. When production data exists, schema changes must be versioned, reversible, and reviewable.

**Trigger:** First production deployment with real user data.
**Action:** Run `prisma migrate dev --name init` to create the baseline migration, switch all scripts from `db:push` to `prisma migrate deploy`, add `migrations/` to version control.

### 2. `Subscription.id` uses external Stripe ID as primary key

`Subscription.id String @id` has no `@default(cuid())`. This is intentional — the ID comes from Stripe (`sub_xxx`). The subscription is created by a Stripe webhook, not by application code. Using the Stripe ID as PK avoids a mapping table and simplifies webhook reconciliation.

**Trade-off:** If the payment provider changes, all subscription IDs change. Acceptable because provider migration rewrites the entire billing context anyway.

### 3. Soft-delete write operations (`update`, `updateMany`, `upsert`) intentionally unfiltered

The soft-delete extension filters read operations (`findMany`, `findFirst`, `findUnique`, `count`, `aggregate`, etc.) but intentionally does NOT filter write operations. Reasons:

- Restoration requires `update({ where: { id }, data: { deletedAt: null } })` — filtering would prevent this.
- `upsert` on a soft-deleted record should update it (effectively restoring), not create a duplicate.
- Application-level guards (e.g., `findOrThrow` before update) already prevent accidental writes to deleted records in all existing endpoints.

### 4. Test helpers use raw `PrismaClient` intentionally

`test/helpers.ts` creates `new PrismaClient()` without the soft-delete extension. This is correct for test infrastructure:

- `cleanup()` needs hard-delete to actually remove test data, not soft-delete it.
- Test setup may need to create specific states (e.g., a soft-deleted record) that the extension would prevent.
- Tests verify business logic against the extended client in the code under test, not in the test harness.

### 5. CHECK constraints deferred to `prisma migrate` switch

`MarketingReview.rating` has no database-level CHECK constraint for valid range (1–5). Prisma does not support CHECK constraints declaratively. Adding one requires a raw SQL migration step, which is only possible with `prisma migrate`, not `db:push`.

**Current mitigation:** Zod schema validates rating at the API boundary.
**Trigger:** Same as decision 1 — first `prisma migrate` adoption.
**Action:** Add `ALTER TABLE marketing_reviews ADD CONSTRAINT chk_rating CHECK (rating >= 1 AND rating <= 5)` as a raw SQL migration step.

### 6. Unbounded admin queries deferred to pagination implementation

Multiple admin endpoints (`findMany` without `take`) return all records. With seed data this is fine. With real data, these will degrade. Tracked as §10 (Frontend) audit items — pagination is a UI + API joint concern.

**Trigger:** First admin entity exceeds ~100 records in production.
**Affected endpoints:** `users-admin.ts`, `review/admin.ts`, `contact/admin.ts`, `blog/admin.ts`, `product/admin.ts`, `training-plans.ts`, `cms/pages/public.ts`.

## Consequences

- **Positive:** No speculative infrastructure. Each decision has a concrete trigger and action plan.
- **Negative:** Until triggers fire, the project operates without migration history, without DB-level constraints, and with unbounded queries. All acceptable for current scale (zero production data).
- **Neutral:** This ADR must be revisited at first production deployment. Add a checklist item to the deploy runbook.

## References

- ADR 0018: Security deferred decisions (same pattern of trigger-based deferral)
- Prisma docs: [db push vs migrate](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/mental-model#the-difference-between-db-push-and-prisma-migrate)
