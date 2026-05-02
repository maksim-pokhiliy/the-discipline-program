# 0008. Singleton subscription invariant enforced at the database

- **Status:** Accepted
- **Date:** 2026-04-10
- **Tags:** `invariants`, `billing`, `domain-model`

## Context

The product concept is a single coaching business with a small team of coaches and their athletes. Each athlete has access to the platform through an active subscription. The billing domain has four entities (`Product`, `Price`, `Subscription`, `Transaction`) in the database, but the subscription layer intentionally carries one strong invariant:

> **One user has at most one subscription record at any time.**

This is a deliberate simplification of the usual SaaS model. We are not selling plans that a user can stack (no "Plan A + Plan B" for one athlete). We are not carrying subscription history as parallel records (the previous subscription is overwritten or replaced, not appended). The subscription is a singleton because the product does not support multi-subscription athletes.

The question is not whether to have this invariant — the product requires it. The question is **where to enforce it**. Candidate layers:

1. **Database constraint.** A `UNIQUE` index on `Subscription.userId`. Violation is a Postgres error.
2. **Domain / service layer.** A hand-written check in the code that creates subscriptions (`prisma.subscription.findFirst(...)` before `prisma.subscription.create(...)`).
3. **Application layer.** The UI refuses to show a "subscribe" button to a user who already has a subscription.
4. **All of the above.**

The failure mode of "check in the code only" is a classic race condition: two concurrent subscribe requests both see no existing subscription, both pass the check, both insert. Now the user has two subscriptions. The invariant has been violated, and the error is indistinguishable from normal behavior until a downstream query asks "which subscription is the active one?" and finds two.

The failure mode of "UI only" is even worse: anyone who can bypass the UI (script, API call, race) can violate the invariant. The UI is a UX enhancement, not an enforcement mechanism.

The database is the only layer that can prevent the race, because the database is the only layer that sees all concurrent writes.

## Decision

We enforce "one user = one subscription" at the database level through a `UNIQUE` index on `Subscription.userId`:

```prisma
model Subscription {
  id                 String             @id
  userId             String             @unique            // ← the invariant
  user               User               @relation(...)
  priceId            String
  price              Price              @relation(...)
  status             SubscriptionStatus
  ...
}
```

The service layer may additionally check for an existing subscription before attempting to create one — but only for better error messages (`ConflictError("User already has a subscription")`), not for correctness. The database is the source of truth. If the service-layer check is wrong, the database will reject the insert with `P2002` (unique constraint violation), and `handlePrismaError` maps that to `ConflictError`.

This is explicitly a **domain invariant**, not a schema accident. Future contributors must not remove the unique constraint on `Subscription.userId` without a new ADR that supersedes this one.

## Consequences

**Positive:**

- The invariant cannot be violated by a race, a bug, a careless batch script, or a direct SQL edit. Postgres will reject any insert that would produce two rows with the same `userId`.
- The error path is well-defined: a unique constraint violation becomes `ConflictError` through `handlePrismaError(error, { entity: "Subscription" })`.
- Query planners treat `UNIQUE` as an optimization hint: `WHERE userId = ?` on the subscriptions table uses the index and returns at most one row, which is what the application always wants anyway.
- The invariant is self-documenting: a reader of `schema.prisma` sees `@unique` on `userId` and knows the rule. No guessing, no tribal knowledge.

**Negative:**

- **A future product decision to support multiple concurrent subscriptions per user is a migration.** Dropping a unique constraint in production requires a thought-out plan (read replica impact, index rebuild time, application-level handling of the new multi-row case). This is the intended trade-off: we are choosing simplicity now over flexibility later.
- **Grace period edge cases need care.** `Subscription.graceEndsAt` allows `PAST_DUE` subscriptions to retain access for a window. When a user with a grace-expired subscription tries to resubscribe, the existing row must be updated (status transition `PAST_DUE → CANCELED → ACTIVE`), not deleted and recreated. A naive "delete old, create new" sequence would race against the unique constraint in the window between the delete and the create.
- **The invariant does not cover subscription history.** If the product later wants an audit trail of past subscriptions, the current schema has no place to put it. A separate `SubscriptionHistory` table (append-only) would be needed. Out of scope for this ADR.

**Neutral:**

- `Subscription.id String @id` (no `@default(cuid())`) is a related decision: the subscription ID is externally provided, specifically the Stripe subscription ID (`sub_xxx`). See the implicit decision to use Stripe; a future ADR may separate the "external ID as PK" decision from the "Stripe provider" decision.
- The unique constraint is on `userId` alone, not `(userId, status)`. A `CANCELED` subscription still occupies the slot. This is intentional: a user who has canceled and wants to resubscribe should reuse the existing row via status transition, not create a second one.
- `Transaction.subscriptionId` is nullable with `onDelete: SetNull`. This preserves transaction history even if a subscription row is removed (which should never happen in practice — we soft-status transitions, not hard deletes of subscription rows).

## Alternatives considered

**Enforce only in the application layer.** Rejected. Race conditions guarantee eventual violation under real concurrency.

**Allow multiple subscriptions but mark one as active** (`isActive Boolean` column + partial index `WHERE isActive`). More flexible for future features (upgrade/downgrade with overlap, trials running alongside paid). Rejected because the partial unique index in Postgres (`CREATE UNIQUE INDEX ... WHERE is_active`) is not expressible in Prisma's schema.prisma DSL — it would require a raw SQL migration. The schema gains flexibility but loses its self-documenting clarity. Out of scope now; revisit when the product actually needs overlapping subscriptions.

**Keep subscription history as a linked table from day one.** Would require `CurrentSubscription` (singleton per user) and `SubscriptionHistory` (append-only). Two tables, two places to update, higher complexity. Rejected as premature — we do not yet need history.

**No singleton invariant at all.** Allow N subscriptions per user and always query `findFirst` on the active one. Rejected because it makes every query more complex and every invariant weaker. The product does not need the flexibility, and the cost of the flexibility is paid on every read.

## References

- `packages/api-server/prisma/schema.prisma` model `Subscription` — the `@unique` constraint on `userId`.
- `packages/api-server/src/utils/prisma-error-handler.ts` — `P2002` handling that turns the constraint violation into a domain error.
- CLAUDE.md section "Global Invariants" — the codified list of system laws.
