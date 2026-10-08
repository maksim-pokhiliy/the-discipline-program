# Billing context contracts

The Billing context's shapes, in the bounded-context layout of `docs/BOUNDED-CONTEXTS.md` (section 5). The model is ADR-0044's and its W0 schema is in place (migration `20260928120000_storefront_billing_w0`). Three entities live here, each in the `cms/product` layout: `<entity>.constants.ts` for the enums, `<entity>.schema.ts`, `<entity>.types.ts` for the inferred types, and an `index.ts` barrel behind its own subpath export.

## The entities

- **`subscription/`**, imported from `@repo/contracts/billing/subscription`. `BillingProvider` (`MONOBANK`, `MANUAL`, `FREE`) and `SubscriptionStatus` (`ACTIVE`, `PAST_DUE`, `CANCELED`, `EXPIRED`), parsed by `billingProviderSchema` and `subscriptionStatusSchema`. `subscriptionSchema` and its type `Subscription` carry `id`, `userId`, `productId`, `priceId` (nullable: a `MANUAL` grant has no price), `provider`, `status`, `autoRenew` (the form the buyer chose), `currentPeriodStart`, `currentPeriodEnd`, the nullable `graceEndsAt`, `canceledAt` and `endedAt`, `createdAt` and `updatedAt`.
- **`transaction/`**, imported from `@repo/contracts/billing/transaction`. `TransactionKind` (`INITIAL`, `RENEWAL`, `ONE_OFF`, `REFUND`) and `TransactionStatus` (`PENDING`, `SUCCEEDED`, `FAILED`), parsed by `transactionKindSchema` and `transactionStatusSchema`. `transactionSchema` and `Transaction` carry `id`, `userId`, the nullable `subscriptionId`, `provider` (the subscription's `billingProviderSchema`), `kind`, `amountCents`, `currency`, `status`, `providerTxId`, the nullable `periodStart` and `periodEnd`, `createdAt` and `updatedAt`.
- **`product-plan/`**, imported from `@repo/contracts/billing/product-plan`. `PlanDelivery` (`JOIN` enrolls the buyer into the bound plan, `COPY` clones the plan for the buyer and enrolls them into the copy), parsed by `planDeliverySchema`. `productPlanSchema` and `ProductPlan` carry `id`, `productId`, `planId`, `delivery`, `createdAt` and `updatedAt`.

Ids are cuids and dates are `Date` objects. The schemas are response shapes: they strip any key they do not declare instead of refusing the object.

## Rules

- **No `cardToken` and no `providerSubscriptionId` on the subscription.** The card token never enters a contract, a mapper or an API response; it stays on the server, stored encrypted (D-20). `subscription/subscription.schema.test.ts` pins the rule: the shape has neither key, and a row that carries them parses without them.
- **No `idempotencyKey` on the transaction.** `transaction/transaction.schema.test.ts` pins that the shape has no such key.
- **Enums mirror Prisma.** They are TS string enums parsed with `z.nativeEnum`, and the api-server billing mappers (`packages/api-server/src/mappers/billing/`) map every Prisma value to its contract twin. A test there pins the parity in both directions, so a value added or removed on either side fails it.
- **Money is integer cents.** `amountCents` is an integer. Its sign is left open, because the sign of a refund amount is not decided yet.
- **Monobank's wire shapes are not contracts.** They stay private to `packages/api-server/src/infrastructure/payment/`, behind the payment port.

## Where the other billing shapes live

- **The product price** stays in `cms/product/` until the billing admin of step 3.1, because the admin product form and the storefront are its live consumers. `priceSchema` carries `amountCents`, `currency`, `periodCount`, `periodUnit`, `autoRenew` and `isActive`; `createProductPriceSchema` fills a new price from `PRODUCT_PRICE_DEFAULTS` (UAH, 4 weeks, auto-renew offered), while `updateProductPriceSchema` requires all five terms, so an update never resets a stored currency or period to the defaults. `autoRenew` on a price means the auto-renewing form is offered besides the one-off paid period.
- **`Currency` and the period** are value objects in `src/common/`, because CMS contracts may not import Billing contracts and Billing contracts may not import CMS ones. `Currency` (`USD`, `EUR`, `UAH`) types the CMS price and the billing transaction alike. The period is `PeriodUnit` (`DAY`, `WEEK`, `MONTH`, `YEAR`), `PERIOD_CONSTANTS` (1 to 365, the same bounds as the database CHECK), `periodSchema`, `PERIOD_UNIT_LABELS` and `formatPeriod(period, locale)`.

## What comes next

Step numbers follow `initiatives/storefront-billing/plan.md`.

- **1.1 and 1.2**: request and response schemas for start purchase, cancel and my subscriptions. The subscription state machine and the webhook ledger run inside api-server; this folder only carries the shapes the apps exchange with them.
- **3.1 and 3.2**: the admin shapes (plan bindings, prices, `MANUAL` grants) and the payment state the coach roster reads.

Access, open or closed per enrollment, is resolved by the gate in `api-server/src/authz/` from step 1.1. LMS and Coaching contracts may not import from this folder, so any shape they share with Billing goes to `src/common/`, as the period and `Currency` did.

## Related work

- `docs/BOUNDED-CONTEXTS.md` (section 5) is the canonical record of the Billing model and its invariants.
- ADR-0044 sets the current product decisions and supersedes ADR 0008 and ADR 0014; ADR 0036 covers the `Idempotency-Key` every billing mutation carries.
- `packages/api-server/src/infrastructure/payment/README.md` describes the payment port and its Monobank adapter, and `packages/api-server/src/endpoints/billing/README.md` the endpoints that will use them.
- `initiatives/storefront-billing/domain-model.md` sketches the subscription state machine, access resolution and purchase flows the later steps build.

**Do not put non-Billing contracts here.** If you have a CMS product contract, it lives in `cms/product/`. If you have a user contract, it lives in `iam/user/`. Billing is exclusively payment-adjacent domain data.
