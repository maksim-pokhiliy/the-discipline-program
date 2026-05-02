# 0014. Stripe as the implicit payment provider (retroactive)

- **Status:** Accepted (retroactive — the decision exists in the schema, not yet in the code)
- **Date:** 2026-04-10
- **Tags:** `billing`, `payments`, `vendor-dependency`, `retroactive`

## Context

The database schema contains four billing-related models (`Product`, `Price`, `Subscription`, `Transaction`) and three enums (`Currency`, `PriceInterval`, `SubscriptionStatus`, `TransactionStatus`). None of these models have a corresponding endpoint in `packages/api-server`. None of them have a corresponding entity in `packages/contracts` as first-class billing entities (there is a `product` entity, but it is positioned as a marketing catalog concept, not as a billing artifact). There are no route handlers under `/api/.../billing/*`, and there is no `/api/webhooks/stripe` endpoint.

And yet, the schema already commits to a specific payment provider:

```prisma
model Product {
  ...
  stripeProductId String?  @unique
  ...
}

model Price {
  ...
  stripePriceId String?  @unique
  ...
}

model Subscription {
  id                 String             @id   // ← no @default(cuid()), stores Stripe sub_xxx
  userId             String             @unique
  ...
  graceEndsAt        DateTime?
  ...
}

model Transaction {
  ...
  providerTxId   String  @unique
  idempotencyKey String  @unique
  ...
}
```

The schema carries the fingerprint of Stripe:

- `stripeProductId` / `stripePriceId` name Stripe explicitly.
- `Subscription.id` has no default, meaning it is assigned externally. Stripe subscription IDs (`sub_xxx`) are the natural fit.
- `Transaction.providerTxId` is a unique external transaction ID — Stripe charges or payment intents.
- `Transaction.idempotencyKey` is the exact field Stripe's API requires on every mutation for safe retries.
- `graceEndsAt` on `Subscription` matches Stripe's "past due → grace period → canceled" lifecycle.

A new contributor reading this schema cold would conclude, correctly, that Stripe has been chosen. But the decision has never been documented. Any proposal to use Paddle, Chargebee, Lemon Squeezy, or a DIY payment layer would collide with database constraints and the decision would turn into "why is half our schema already Stripe-flavored?" without anyone being able to answer.

This ADR is **retroactive**. The decision exists in the schema. We are documenting it now so that the billing implementation, when it arrives, does not get derailed by a "wait, why Stripe?" conversation.

## Decision

**Stripe is the payment provider.** The billing implementation, whenever it lands, will integrate with Stripe through the `stripe` Node.js SDK. The database schema is already shaped around Stripe's data model (`stripeProductId`, `stripePriceId`, external subscription IDs, idempotency keys).

The decision is retroactive because:

1. The schema was written with Stripe in mind.
2. Changing providers now would require a schema migration, which we want to avoid before launch.
3. Stripe is the dominant choice for SaaS subscriptions in the relevant markets, and the schema decisions are already compatible with it.

When billing is implemented (see Big Tech audit, section 7 — billing bounded context does not yet exist), it will follow the same port/adapter pattern that ADR 0013 prescribes for storage:

- A `PaymentsPort` interface in `packages/api-server/src/infrastructure/payments/payments.port.ts`.
- A `StripeAdapter` in the same directory implementing the port.
- Billing endpoints depend on `PaymentsPort`, not on `stripe` directly.
- The `stripe` package is a dependency only of the adapter file, enforced via `dependency-cruiser`.

Webhook handling will live at `/api/webhooks/stripe` in whichever app ends up owning the billing domain (likely `admin` or a new dedicated `billing` surface — deferred decision). The webhook handler will verify Stripe's signature and route events to the billing service. `Transaction.idempotencyKey` is `NOT NULL` in the schema — was a known gap at the time of this ADR write and has since been tightened.

## Consequences

**Positive:**

- The schema is already Stripe-shaped, so the implementation work is reduced — no migration, no field renames.
- Stripe's tooling (dashboard, webhooks, test mode, API keys) is mature and well-documented. Integration time is manageable.
- `Transaction.idempotencyKey` and `Transaction.providerTxId` are already in place as unique constraints, providing database-level guarantees on idempotency — the same guarantees Stripe's API requires from clients.
- Stripe supports all three currencies (`USD`, `EUR`, `UAH`) that the `Currency` enum declares.
- Stripe's subscription state machine (`TRIAL` → `ACTIVE` → `PAST_DUE` → `CANCELED`) matches the `SubscriptionStatus` enum in the schema.
- The decision is documented **before** the first line of billing code is written, so the port/adapter pattern can be established correctly from day one, not retrofitted later.

**Negative:**

- **Vendor lock-in starting from the database layer.** Changing providers later is not just a code change; it is a schema migration. Moving from Stripe to Paddle would mean renaming `stripeProductId` to `paddleProductId` or introducing a generic `providerProductId` column. Not impossible, but not cheap.
- **Schema drift if Stripe changes their data model.** Stripe occasionally introduces new product types (usage-based billing, one-time payments with subscriptions, etc.) that do not fit cleanly into `Product → Price → Subscription`. Each such change is a schema migration.
- **Webhook security is critical from day one.** Stripe's webhook signature verification must be correct or attackers can forge billing events. The adapter layer must get this right on the first try — there is no "we'll harden it later" path for something that awards subscriptions.
- **Retroactive documentation risk.** This ADR captures a decision that has already been made implicitly. The risk is that there is reasoning we are not aware of and cannot document because it is in someone's head or in an old chat log. Future contributors should treat this ADR's "reasoning" with appropriate skepticism.

**Neutral:**

- Stripe's preferred integration pattern (Stripe Checkout, Stripe Elements, or raw API) is not yet decided. That is a separate question for when billing is built. This ADR only commits to the provider, not the integration surface.
- Grace period logic (`Subscription.graceEndsAt`) is our own field, not a Stripe-provided one. Our code decides whether a user in `PAST_DUE` status still has access based on `now < graceEndsAt`. This gives us flexibility independent of Stripe's dunning settings.

## Alternatives considered

**Paddle.** Merchant of record — handles EU VAT, sales tax, compliance across jurisdictions. Attractive for a company without an international finance team. Rejected because the schema was already Stripe-shaped before this evaluation happened, and because Paddle's API is less rich for subscription lifecycle events. If we had started from scratch today with "merchant of record" as a priority, Paddle would be a serious candidate.

**Chargebee.** Subscription-focused billing with strong catalog management, quotes, dunning. Overkill for our current pricing model (a handful of products, simple monthly/yearly plans). Rejected on complexity grounds.

**Lemon Squeezy.** Newer, merchant-of-record, simpler than Paddle. Same rejection reason as Paddle — schema is already Stripe-shaped. Worth revisiting if international tax compliance becomes painful.

**Braintree / PayPal.** Mature, well-known. Weaker subscription primitives than Stripe, weaker developer experience. Rejected.

**DIY billing.** Build our own subscription state machine, integrate directly with a payment processor (Adyen, a regional processor). Maximum control, maximum responsibility, maximum PCI scope. Only makes sense at very large scale where the Stripe fees become material. Absolutely wrong call for a pre-launch coaching platform.

**Multiple providers simultaneously.** A `provider` column on `Transaction` that identifies which processor the record came from. Useful if different regions use different processors. Overkill for launch. If it ever becomes necessary, it is a schema migration on top of the Stripe-only foundation — manageable but not free.

## References

- `packages/api-server/prisma/schema.prisma` — the models containing Stripe-flavored fields.
- ADR 0008 — singleton subscription invariant (which shapes how Stripe data lands in the database).
- ADR 0013 — storage port / adapter pattern (which the billing adapter will mirror).
- Big Tech audit, section 3 — `idempotencyKey` is now `NOT NULL` (was a known gap at the time of ADR write).
- Big Tech audit, section 7 — billing as an architectural risk on the six-month horizon.
- https://stripe.com/docs/api — Stripe API reference (provider documentation).
