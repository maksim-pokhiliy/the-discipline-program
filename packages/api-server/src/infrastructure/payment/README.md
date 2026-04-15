# Payment port

Hosted checkout URLs and webhook signature verification. Used to take a customer from the app into a vendor-hosted payment page and to verify that inbound webhook events are genuinely from the vendor.

## Why a port? (And why a _minimal_ one?)

Payment vendors diverge substantially in their data models — Stripe's `PaymentIntent` / `Subscription` / `Customer` / `Invoice` abstractions don't map cleanly to Lemon Squeezy's `Order` / `Subscription` or to Paddle's `Transaction` / `Customer`. An "honest" payment port cannot abstract over the full vendor surface without leaking. Attempts to do so end as either (a) a thick interface where most methods are Stripe-specific in spirit and the non-Stripe adapters throw `NotImplementedError`, or (b) a thin interface that wraps nothing — consumers bypass the port to reach the real vendor API.

This port commits only to the two operations that **every** hosted-checkout vendor supports in the same shape:

1. **Create a checkout URL**, given a product/price identifier, success/cancel return URLs, and optional customer email + metadata.
2. **Verify a webhook signature**, given the raw payload and the signature header.

That's it. Subscriptions, invoices, refunds, customer portals, disputes, payouts — all deferred to vendor-specific code paths that live next to the adapter, not on the port interface. If we need them as ports, they'll be separate, narrower ports (`SubscriptionPort`, `RefundPort`) whose shapes we know more confidently once the vendor is chosen.

## Shape

`createCheckout({ priceId, successUrl, cancelUrl, customerEmail?, metadata? })` returns `{ url, sessionId }`. The caller redirects the user to `url`. `sessionId` is kept for correlation with webhook events (e.g. `checkout.session.completed` → look up our internal order by `sessionId`).

`verifyWebhook({ payload, signature })` is **synchronous** and returns `boolean`. It only verifies the signature — it does NOT parse the event, dispatch handlers, or persist anything. The route handler is responsible for all of that; the port just answers "is this request genuinely from the vendor". Sync because signature verification is local cryptography (HMAC comparison), no I/O.

Why `metadata: Record<string, string>` and not `unknown`? Because every serious vendor limits metadata to a small number of string-keyed string values for compliance reasons (they log it, they don't want PII, they don't want arbitrary nested objects). Matching the lowest common denominator keeps adapters honest.

## Vendor candidates

| Vendor        | Hosted checkout | Subscription support | Webhook signing | Regions | Notes                                                                                           |
| ------------- | --------------- | -------------------- | --------------- | ------- | ----------------------------------------------------------------------------------------------- |
| Stripe        | Yes (Sessions)  | First-class          | HMAC SHA256     | Global  | Industry default; richest API; US-centric; requires merchant-of-record setup for many countries |
| Lemon Squeezy | Yes             | First-class          | HMAC SHA256     | Global  | Merchant of record handles VAT/sales tax worldwide; fewer low-level knobs than Stripe           |
| Paddle        | Yes             | First-class          | HMAC SHA256     | Global  | Merchant of record; strong for SaaS; slightly older DX than LS                                  |
| Polar         | Yes             | First-class          | HMAC SHA256     | Global  | Newer, OSS-friendly, solid DX; less battle-tested than the above                                |

Current lean: **Lemon Squeezy** or **Paddle** — because both are merchants of record, which removes the VAT / sales-tax compliance burden from us for global sales. Stripe is the default for a reason (cleanest API, largest ecosystem), but managing tax compliance ourselves is non-trivial and MoR is cheap insurance for a bootstrap-scale business. Final decision is a business call, not a technical one — flagged to founder. The port survives all four options unchanged.

## Open questions (deferred until vendor is chosen)

- **Subscription management.** Changing plans, pausing, cancelling, reactivating — all have different shapes across vendors. Will become a separate `SubscriptionPort` with a narrow API (maybe just `getPortalUrl(customerId)` which delegates to the vendor's hosted customer portal, same pattern as `createCheckout`).
- **Customer portal URL.** Stripe has `billing_portal.sessions.create`, Lemon Squeezy has customer portals out of the box, Paddle has a customer-facing dashboard. Shape is consistent: take a customer ID, return a URL. Will add `getCustomerPortalUrl(customerId): Promise<{ url }>` to the payment port when the first consumer needs it — non-breaking.
- **Webhook event parsing.** Once signature is verified, the route handler needs to interpret the event (`checkout.session.completed`, `customer.subscription.updated`, `invoice.paid`, etc.). Event type strings differ across vendors. The port returns raw `boolean` from `verifyWebhook` and leaves parsing to a vendor-specific event handler map in the adapter layer or a thin domain-level event translator. No common shape exists here.
- **Currency handling.** Related to §2 Money value object. Price IDs in Stripe/LS/Paddle are vendor-opaque — we pass a vendor-assigned ID, the vendor knows the currency and amount. We don't pass raw Money values to the port, so the port is currency-agnostic. This is deliberate: letting the vendor own the price list is simpler than mirroring it in our DB.
- **Idempotency.** Stripe supports `Idempotency-Key` header for retry safety on create operations. Will add `idempotencyKey?: string` to `CreateCheckoutInput` when needed — non-breaking.
- **Refunds / disputes / invoices.** None of these have common shapes. Deferred until we actually need them — likely §6 or §7 when billing is implemented.

## Adapter placement

When vendor is chosen:

1. `infrastructure/payment/stripe-adapter.ts` (or `lemon-squeezy-adapter.ts` etc.) — the ONLY file in the repo that imports the vendor SDK.
2. Register env vars in `packages/env/payment.ts` (create when adapter lands): API key, webhook secret.
3. Update `infrastructure/payment/index.ts` to re-export the adapter factory and expose `defaultPayment = createStripeAdapter()`.
4. Consumers inject via factory-DI: `createBillingAdminApi({ payment })`.
5. Webhook route handler lives at `apps/<app>/src/app/api/webhooks/<vendor>/route.ts` and calls `payment.verifyWebhook(...)` before parsing the body.

## Non-goals

- **Multi-vendor fan-out.** If we ever want to offer "pay with Stripe OR Lemon Squeezy at checkout", that's a higher-level concern and doesn't live on this port. The port is single-vendor per-instance; run multiple instances if needed.
- **Tokenization / saved payment methods in our DB.** Hosted checkout means the vendor owns the payment method — we don't touch card data. If we ever go fully off-hosted-checkout (raw Stripe Elements embedded in our UI), PCI scope explodes and this port is the wrong abstraction.
- **Fraud detection.** That's the vendor's job for hosted checkout. If we need additional signals (velocity checks, IP reputation), that's a separate `FraudPort`, not this one.
- **Tax calculation.** MoR vendors handle this. If we go Stripe + manual tax, we need `StripeTax` or `TaxJar`, and that's a separate port or a Stripe-adapter-internal concern.
