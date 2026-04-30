# Billing endpoints — placeholder

This directory is part of the bounded-context endpoint layout established in `docs/BOUNDED-CONTEXTS.md` (section 5). The Billing context exists in `packages/api-server/prisma/schema.prisma` (`Product`, `Price`, `Subscription`, `Transaction`) but **no billing endpoints have been written yet**.

The folder is kept empty so that:

- The five-context endpoint layout (`cms/`, `lms/`, `coaching/`, `iam/`, `billing/`) is complete and future readers see Billing as a recognized context, not a forgotten afterthought.
- When Billing endpoints land, they go here — `price/`, `subscription/`, `transaction/`, `webhook/`, and eventually a billing facet for `product/`. No naming or location debate at that point.

## What goes here when the time comes

Per BOUNDED-CONTEXTS.md §5 and §10, the target endpoints are:

- `subscription/` — create/read/cancel subscription flows.
- `transaction/` — transaction record reads (append-only, created via webhook).
- `webhook/stripe.ts` — inbound webhook handler with signature verification, idempotency via `providerTxId`, and transactional enrollment creation (see the `Purchase = Immediate Value` cross-context invariant).
- `product-billing/` — the commercial facet of `Product` (Stripe product ID, prices, active state). The CMS facet lives in `endpoints/cms/product/`.

## Pre-conditions before writing billing code

Tracked in ADR 0018 (security deferrals) and ADR 0019 (database strategy):

- `Transaction.idempotencyKey` must be `NOT NULL` (it is currently nullable).
- Webhook signature verification and rate limiting must exist as infrastructure.
- An idempotency middleware must accept `Idempotency-Key` headers on every payment mutation.
- `authz/guards.ts` or a future `authz/policies/` module must have a billing-aware access policy (subscription state gates platform access).

**Do not put non-Billing endpoints here.** CMS, LMS, Coaching, and IAM each have their own folder.
