# Billing endpoints

This directory is the Billing context's place in the endpoint layout of `docs/BOUNDED-CONTEXTS.md` (section 5). The model is ADR-0044's: Monobank behind a provider-agnostic core, one subscription per user and product, and products bound to training plans. The W0 schema is in place (migration `20260928120000_storefront_billing_w0`) and the payment port with its Monobank adapter exists in `src/infrastructure/payment/`, but **no billing endpoint has been written yet**.

## What is here today

`billing-schema.invariants.test.ts` proves the W0 constraints against a real database, each with the refused case and a legal neighbour for every column of a composite key: `(userId, productId)` and `providerSubscriptionId` on subscriptions, the two CHECKs (a price for every provider except `MANUAL`, a period of 1 to 365 units), `(provider, providerTxId, kind)` on transactions, `(provider, eventKey)` on webhook events, `(productId, planId)` on plan bindings and their cascade when a plan is hard-deleted, an enrollment keeping its row when its subscription is deleted, and the `Restrict` from a subscription to its product and to its price. The cascades and restricts fire on hard deletes only: the application soft-deletes plans, users and products, so their deletes never reach these foreign keys. The fixtures live in `src/test/billing-helpers.ts`.

`card-token-cipher.ts` is the card-token cipher of D-20: an instance of `createTokenCipher` (`src/utils/token-cipher.ts`, AES-256-GCM with a random 12-byte IV and a 16-byte tag) keyed by `BILLING_ENCRYPTION_KEY`, a key of its own and never `MOBILE_PUBLISH_ENCRYPTION_KEY`. It exports `encryptCardToken(cardToken, userId)` and `decryptCardToken(payload, userId)`: the token is bound to the platform `userId` as associated data, so a ciphertext copied to another user's row does not decrypt. Decryption throws on a tampered payload, on one sealed under another key and on one sealed for another user. The cipher is built when the module is imported, so a key that does not decode to 32 bytes fails the import instead of the first charge (fail-closed, as the mobile-publish cipher does). Its key-identity test proves the instance uses its own key: a token it seals opens under the billing test key and not under the mobile-publish one. Nothing but that test imports the module yet.

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

- **0.5, payment port, adapter and card-token cipher: done.** Only the cipher is in this folder. `src/infrastructure/payment/` holds `PaymentPort` and its one Monobank adapter (`createMonobankAdapter`, and `defaultPayment` configured from `@repo/env/monobank`); the billing contracts are in `packages/contracts/src/entities/billing/` and their mappers in `src/mappers/billing/`. Endpoints here receive the port through a factory, the DI seam `endpoints/storage/` uses. Their tests pass a fake port to the factory and import the port type the way `src/infrastructure/payment/README.md` ("Files and wiring") says.
- **1.1, the subscription state machine** and the first endpoints: start a purchase, cancel, my subscriptions.
- **1.2, the webhook path.** Record the event in `BillingWebhookEvent` first (a duplicate key means it was already received), write the `Transaction`, drive the state machine, then run the purchase side effects: `JOIN` enrolls, `COPY` clones and enrolls, a newcomer gets a pending account and an invite. A zero-price `FREE` purchase skips the provider. The D-20 rules apply here: the ledger stores a body only after `verifyWebhook` accepted its raw bytes, and stores it with `walletData.cardToken` replaced by a fixed marker, while the token itself reaches `Subscription.cardToken` only through `encryptCardToken`, bound to the subscription's `userId`. Parsing a redacted ledger body yields a `STORED` card whose `cardToken` is the marker, so a replay never takes `cardToken` from a ledger body: it skips the write when the token equals the marker. `BillingWebhookEvent.error` and log lines carry our own message and codes, never the text of a Prisma or Postgres error.
- **1.3, renewals, grace and reconciliation.** Charge the stored card when a period ends, move a failed renewal to `PAST_DUE` and an expired grace to `EXPIRED`, and repair a missed webhook from the provider's status.

  The decline shape of a charge is unverified (SB-1 item 6), so 1.3 decides the mapping after a test-mode observation or the first production decline; until then a 4xx on a charge is an `InternalServerError` and the outcome of the charge is unknown (`src/infrastructure/payment/README.md`).

- **3.1 and 3.2, admin and coach.** Plan bindings, prices, the user billing panel and `MANUAL` grants; the payment state the coach roster reads through a billing-owned endpoint.

The access gate is not here. `resolveEnrollmentAccess` goes to `src/authz/` in step 1.1 and is the only reader of subscription state outside Billing; LMS, Coaching and the mobile-compat shim stay Billing-blind (D-7): `.dependency-cruiser.cjs` refuses their imports of Billing's endpoints and mappers, of `src/infrastructure/payment/` and of the `billing` and `monobank` env modules, for the imports it sees (type-only ones escape it, see the payment README). Nothing stops a Prisma read of `PlanEnrollment.subscriptionId`, so reviews hold that line. `apps/platform` may not import `src/infrastructure/payment/` either, so its routes reach the adapter only through this folder; the carve-out of `platform-no-cms-billing` that lets them import this folder is 1.1's.

## Rules for the code that lands here

- `Subscription.cardToken` never enters a contract, a mapper or an API response. It is stored encrypted with `encryptCardToken` and decrypted only where the card is charged or forgotten (D-20), and the plaintext must never reach a log line, a stored error or Sentry. `forgetStoredCard` gets no caller until Sentry stops recording its query: the payment README ("Transport") has the mechanism and the change carried forward from 0.5.
- The wallet id sent to Monobank is the platform `userId`; there is no wallet column.
- The admin product delete is a soft delete (`src/db/client.ts`), so it never meets the `Restrict` from `Subscription.productId`. Step 3.1 decides what deleting a product with subscriptions means.
- Every mutation takes an `Idempotency-Key` through the route factories (ADR 0036), and money stays integer cents.

**Do not put non-Billing endpoints here.** CMS, LMS, Coaching, and IAM each have their own folder.
