# Billing context — placeholder

This directory is part of the bounded-context layout established in `docs/BOUNDED-CONTEXTS.md` (section 5). The Billing context exists in `packages/api-server/prisma/schema.prisma` today — `Product`, `Price`, `Subscription`, `Transaction` — but **no contract entities have been written yet**.

The folder is kept empty so that:

- The five-context directory layout (`cms/`, `lms/`, `coaching/`, `iam/`, `billing/`) is complete and future readers see Billing as a recognized context, not a forgotten afterthought.
- When Billing contracts land, they go here — `price/`, `subscription/`, `transaction/`, and eventually a billing facet of the currently-CMS-shared `product/`. No naming or location debate at that point.

## What goes here when the time comes

Per BOUNDED-CONTEXTS.md §5, the target entities are:

- `price/` — `Price` schemas: amount in cents, currency, interval, Stripe price ID.
- `subscription/` — `Subscription` schemas: status, current period, grace period. Singleton per user (see ADR 0008).
- `transaction/` — `Transaction` schemas: append-only payment records keyed by `providerTxId` and `idempotencyKey`.
- `product-billing/` — the commercial facet of `Product` (Stripe product ID, `isActive`, prices relation, training plan link). The CMS facet lives in `cms/product/`.

## Related work

- `docs/BOUNDED-CONTEXTS.md` (section 5) is the canonical record of the bounded-context layout that places this folder here.
- Pre-conditions before Billing code lands are tracked in ADR 0018 (security deferrals) and ADR 0019 (database strategy): `Transaction.idempotencyKey` should become `NOT NULL`, webhook signature verification must exist, rate limiting on public endpoints, idempotency middleware on every payment mutation.
- ADRs 0008 (singleton subscription), 0013 (Vercel Blob for storage — unrelated but part of the same backfill), and 0014 (Stripe as implicit provider) set the current product decisions.

**Do not put non-Billing contracts here.** If you have a CMS product contract, it lives in `cms/product/`. If you have a user contract, it lives in `iam/user/`. Billing is exclusively payment-adjacent domain data.
