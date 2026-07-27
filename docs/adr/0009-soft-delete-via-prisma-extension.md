# 0009. Soft delete via Prisma `$extends`

- **Status:** Accepted (with known gaps — see Consequences)
- **Date:** 2026-04-10
- **Tags:** `database`, `prisma`, `soft-delete`, `known-gaps`

## Context

Several models in the schema need **soft delete** semantics: a deleted record must be marked as deleted (with a timestamp) but remain in the database, so that:

- Referential integrity is preserved for historical records (a deleted coach's past action items still resolve to a valid `coachId`).
- Accidental deletion can be recovered without backups.
- Compliance (future GDPR flows) can distinguish "deleted for the user" from "actually purged from storage".
- Admin and support tools can inspect deleted records during investigations.

The models that require soft delete today (every model with a `deletedAt DateTime?` column in `schema.prisma`):

- `User`, `Product`, `TrainingPlan`, `CoachProfile`.
- Marketing CMS: `MarketingBlogPost`, `MarketingReview`, `MarketingContactSubmission`.

The models that are intentionally hard-deleted (cascade from parent, or domain does not require recovery):

- `PlanEnrollment` (cascade from `TrainingPlan` and `User`).
- `AthleteProfile` (cascade from `User`).
- `MarketingPage` and `MarketingPageSection` (cascade from the page).

The implementation requirement is that soft delete must be **transparent at the call site**. A developer writing `prisma.user.findMany({ where: { email: "foo" } })` should not have to remember to add `deletedAt: null`. If they forget, deleted users will silently appear in the result.

## Decision

Soft delete is implemented as a **Prisma client extension** in `packages/api-server/src/db/client.ts`. The extension is applied via `client.$extends({ query: { $allModels: {...} } })` and intercepts the relevant query operations for models listed in a hard-coded `SOFT_DELETE_MODELS` set:

```ts
const SOFT_DELETE_MODELS = new Set([
  "User",
  "Product",
  "TrainingPlan",
  "CoachProfile",
  "MarketingBlogPost",
  "MarketingReview",
  "MarketingContactSubmission",
]);
```

For these models, the extension rewrites the following read operations to implicitly filter `WHERE deletedAt IS NULL`:

- `findMany`, `findFirst`, `findFirstOrThrow`.
- `findUnique`, `findUniqueOrThrow` (rewritten internally to `findFirst` so the `WHERE deletedAt IS NULL` predicate composes with the unique selector — `findUniqueOrThrow` then re-applies the throw on missing).
- `count`, `aggregate`, `groupBy`.

It also rewrites destructive operations:

- `delete` → `update({ data: { deletedAt: new Date() } })`.
- `deleteMany` → `updateMany({ data: { deletedAt: new Date() } })`.

Operations the extension does **not** filter or rewrite (intentional — see the Consequences section):

- `update`, `updateMany`, `upsert`.

For a subset of models (`Product`, `MarketingBlogPost`) with unique fields like `slug`, the extension also rewrites the unique column on delete, appending a `_deleted_<timestamp>` suffix. This is so a user can re-create a post with the same slug after deleting the previous one, without hitting the unique constraint on the soft-deleted row.

The extended client is exported as `prisma` from `packages/api-server/src/db/client.ts` and is the only client used by production code. The test harness (`test/helpers.ts`) deliberately creates a raw `new PrismaClient()` to bypass the extension during cleanup — cleanup in tests should be hard delete, so that test state is actually gone.

## Consequences

**Positive:**

- Call sites stay clean. `prisma.user.findMany({ where: { role: "ADMIN" } })` returns only non-deleted admins, no extra `where` clause required.
- A centralized place to evolve the logic: adding a new soft-deleted model is (supposed to be) a one-line change to `SOFT_DELETE_MODELS`.
- The `_deleted_<timestamp>` suffix on unique fields lets users recreate slugs after deletion without the data shuffling that an archive-then-reuse pattern would require.
- Soft delete and hard delete use the same Prisma API (`prisma.user.delete(...)`). Consumers do not need to know which is which — the extension dispatches.
- All read paths that aggregate or count rows (`count`, `aggregate`, `groupBy`) participate in the filter, so dashboard metrics computed via `prisma.user.count()` or `prisma.product.aggregate({ _sum })` exclude soft-deleted rows automatically.

**Negative — the remaining known gaps:**

- **`update` / `updateMany` / `upsert` are not filtered.**

  - `update` and `updateMany` are intentionally unfiltered: they are the restoration path. To revive a soft-deleted user the call site writes `prisma.user.update({ where: { id }, data: { deletedAt: null, email: original } })`. Symmetric counterpart to the suffix-on-delete trick — the consumer must un-suffix the unique field manually. There is no `restore`/`undelete` helper anywhere in the codebase yet; if one lands, it must live next to the extension and reverse both `deletedAt` and the suffix in one step.
  - `upsert` is unfiltered: an `upsert` against a soft-deleted unique row may re-activate it. The suffix-on-delete trick partially protects this (the live row's email is now `original_deleted_<ts>`, so a new signup with `original` does not collide and a fresh row is created instead of accidentally touching the deleted one). Audit any new `upsert` introduction in soft-deleted models — the protection is structural, not enforced by the extension.

  Every consumer that wants to update or upsert against a soft-deleted model and explicitly skip deleted rows must add `where: { deletedAt: null }` manually. The reads side does not need this.

- **`SOFT_DELETE_MODELS` is hand-maintained.** If a new model is added with a `deletedAt` column but the developer forgets to add it to the set, the extension silently does nothing. Prisma does not cross-check. Verify on schema changes by reading every `model X { ... deletedAt DateTime? ... }` block and confirming the model name is in the set.

- **Soft delete is not transitive across relations.** `Product` is in the set, but `Price` is not. A soft-deleted product still has active prices from the database's point of view. A checkout that walks `Product → Price` can return a `Price` whose parent product has been soft-deleted, because the `Price` query does not apply the `Product` filter.

  The sharper form of this, found 2026-07-27: **the extension only intercepts top-level operations.** A soft-deleted row reached through a relation `include`/`select` on some _other_ model is never filtered, because the extension's hook simply does not run for nested reads. `User` is in the set, yet `prisma.coachAthleteAssignment.findMany({ where: { coachId }, include: { athlete: true } })` happily projects soft-deleted athletes. The correct hand-written pattern — `where: { coachId, athlete: { deletedAt: null } }` — exists at `endpoints/coaching/coach-athletes/list.ts`, and its siblings (`coach-dashboard.ts`, `coach-action-item.ts`, `coach-athletes/detail.ts`) all missed it.

  **This reaches an authorization path.** `verifyAthleteBelongsToCoach` (`packages/api-server/src/authz/role-guards.ts`) checks only that the assignment row exists and never consults `athlete.deletedAt`, so a surviving assignment lets a soft-deleted athlete pass a coach's ownership guard. Latent rather than live today, because the admin delete path runs `applyRoleExit`, which hard-deletes assignments first — but any path that soft-deletes a user without that lifecycle (notably the raw-SQL `deleteMany` branch of the extension itself) re-opens it. Treat "is this read nested?" as the first question when reasoning about whether soft delete protects a given query.

- **The extension uses reflection-style type gymnastics.** `const getDelegate = (client, model) => Reflect.get(client, key)` plus `isModelDelegate` type predicate. This is the cost of writing a generic extension that covers all models — Prisma's type system does not express "any model delegate" cleanly. The price is that adding a new operation to the extension is careful work.

- **`test/helpers.ts` bypasses the extension.** Cleanup in tests uses a raw `new PrismaClient()` with hard deletes via a universal `(rawPrisma as unknown as Record<...>)` cast, which is a violation of the "no `as` casts" rule (`CLAUDE.md`). The cast is scoped to test infrastructure and is annotated, but it is still an escape hatch that must not leak into production code.

**Neutral:**

- Soft delete does not recover the row's unique field values automatically. Restoring a soft-deleted product requires manually renaming the slug back (`_deleted_<timestamp>` suffix) and clearing `deletedAt`. There is no "undelete" method in the extension today — a fix would involve moving restoration logic into the extension too.

## Alternatives considered

**Manual `where: { deletedAt: null }` at every call site.** Maximum explicitness. Zero magic. Also maximum forgetting. Rejected because the point of soft delete is that it be invisible to callers — the mental overhead of remembering the filter on every query is what the extension is there to remove.

**`updatedAt` semantics instead of `deletedAt`** (e.g., an `isActive` boolean). Simpler, but loses the "when was this deleted" information that compliance and debugging need. Rejected.

**A separate "deleted" table per model** (archive-on-delete). More work, more joins, more drift risk. Rejected.

**Prisma middleware (`prisma.$use(...)`).** The pre-`$extends` equivalent. Deprecated in Prisma 5. Rejected because we are on Prisma 6 and the extension API is the current supported path.

**A hand-rolled wrapper class around `PrismaClient`.** Would give us typed, explicit methods for every soft-delete operation. Rejected because it doubles the surface area (`prisma.user.findManyAlive()` in addition to `prisma.user.findMany()`), and because losing Prisma's auto-generated types for the custom methods costs more than the explicitness is worth.

**Tombstone rows with a `deleted_at` view.** A Postgres view that filters soft-deleted rows, queried instead of the base table. Elegant at the database level, but Prisma does not model Postgres views as first-class entities — we would have to hand-write raw queries for every "alive" operation. Rejected as incompatible with the ORM choice.

**Different soft delete on a per-model basis** (e.g., `Product.deletedAt` vs `User.status = 'DELETED'`). More flexible, much higher cognitive load. Rejected.

## References

- `packages/api-server/src/db/client.ts` — the extension implementation.
- `CLAUDE.md` — the "Soft-delete through the Prisma extension only" anti-pattern that says manual `deletedAt` filters are forbidden in call sites.
- ADR 0003 — Prisma as the ORM.
- ADR 0007 — Prisma client isolation to `api-server`.
