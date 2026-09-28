# Billing endpoints

This directory is the Billing context's place in the endpoint layout of `docs/BOUNDED-CONTEXTS.md` (section 5). The model is ADR-0044's: Monobank behind a provider-agnostic core, one subscription per user and product, and products bound to training plans. The W0 schema is in place (migration `20260928120000_storefront_billing_w0`), but **no billing endpoint has been written yet**.

## What is here today

`billing-schema.invariants.test.ts` proves the W0 constraints against a real database, each with the refused case and a legal neighbour for every column of a composite key: `(userId, productId)` and `providerSubscriptionId` on subscriptions, the two CHECKs (a price for every provider except `MANUAL`, a period of 1 to 365 units), `(provider, providerTxId, kind)` on transactions, `(provider, eventKey)` on webhook events, `(productId, planId)` on plan bindings and their cascade from a deleted plan, an enrollment keeping its row when its subscription is deleted, and the `Restrict` from a subscription to its product and to its price. The fixtures live in `src/test/billing-helpers.ts`.

The product price is the only billing shape with a live consumer, and the admin product form still writes it through `endpoints/cms/product/admin.ts` until the billing admin of step 3.1.

## The shapes

- `ProductPlan` binds a product to a training plan with a `delivery`: `JOIN` enrolls the buyer into that plan, `COPY` clones the plan for the buyer and enrolls them into the copy.
- `Price` is `amountCents` + `currency` + `periodCount` / `periodUnit` + `autoRenew`, where `autoRenew` means the auto-renewing form is offered besides the one-off paid period.
- `Subscription` is one row per `(userId, productId)`. `provider` is `MONOBANK`, `MANUAL` or `FREE`; `status` is `ACTIVE`, `PAST_DUE`, `CANCELED` or `EXPIRED` and changes in place; `autoRenew` is the form the buyer chose; `priceId` is null only for a `MANUAL` grant. The `id` is our own cuid, and the provider's id, when there is one, is `providerSubscriptionId`.
- `Transaction` is unique on `idempotencyKey` and on `(provider, providerTxId, kind)`. The kind is part of the key because a refund shares the invoice id of the payment it reverses.
- `BillingWebhookEvent` is the inbound ledger, unique on `(provider, eventKey)`.
- `PlanEnrollment.subscriptionId` points at the subscription behind an enrollment; null means coach-granted access.

Three columns and one enum of the previous schema stay in the database until step 0.3b; BOUNDED-CONTEXTS section 5 names them. The three fields are still declared in `schema.prisma` but carry `@ignore`, so no query the generated client builds selects or writes them, and the columns can leave in 0.3b without breaking a read.

## What lands here, step by step

Step numbers follow `initiatives/storefront-billing/plan.md`. Route handlers stay in the apps; this folder holds the logic they call.

- **0.5, payment port and adapter.** Not in this folder. The reshaped `PaymentPort` and the one Monobank adapter (HTTP calls and webhook signature verification) live in `src/infrastructure/payment/`, configured from `packages/env/src/monobank.ts`. Endpoints here will receive the port through a factory, the same DI seam `endpoints/storage/` uses.
- **1.1, the subscription state machine** and the first endpoints: start a purchase, cancel, my subscriptions.
- **1.2, the webhook path.** Record the event in `BillingWebhookEvent` first (a duplicate key means it was already received), write the `Transaction`, drive the state machine, then run the purchase side effects: `JOIN` enrolls, `COPY` clones and enrolls, a newcomer gets a pending account and an invite. A zero-price `FREE` purchase skips the provider.
- **1.3, renewals, grace and reconciliation.** Charge the stored card when a period ends, move a failed renewal to `PAST_DUE` and an expired grace to `EXPIRED`, and repair a missed webhook from the provider's status.
- **3.1 and 3.2, admin and coach.** Plan bindings, prices, the user billing panel and `MANUAL` grants; the payment state the coach roster reads through a billing-owned endpoint.

The access gate is not here. `resolveEnrollmentAccess` goes to `src/authz/` in step 1.1 and is the only reader of subscription state outside Billing; LMS, Coaching and the mobile-compat shim stay Billing-blind by convention (D-7): `.dependency-cruiser.cjs` stops them importing Billing code, but nothing stops a Prisma read of `PlanEnrollment.subscriptionId`, so reviews hold that line.

## Rules for the code that lands here

- `Subscription.cardToken` never enters a contract, a mapper or an API response. It can appear in the text of a database error, because Postgres prints the failing row when a constraint refuses it, and from there in logs. It is stored as plain text for now, because it only works together with our merchant token; how it is protected at rest and in logs is decided at step 0.5.
- The wallet id sent to Monobank is the platform `userId`; there is no wallet column.
- The admin product delete is a soft delete (`src/db/client.ts`), so it never meets the `Restrict` from `Subscription.productId`. Step 3.1 decides what deleting a product with subscriptions means.
- Every mutation takes an `Idempotency-Key` through the route factories (ADR 0036), and money stays integer cents.

**Do not put non-Billing endpoints here.** CMS, LMS, Coaching, and IAM each have their own folder.
