# Billing context — placeholder

This directory is part of the bounded-context layout established in `docs/BOUNDED-CONTEXTS.md` (section 5). The Billing model is ADR-0044's, and its W0 schema is in place (migration `20260928120000_storefront_billing_w0`) with `ProductPlan`, `Price`, `Subscription`, `Transaction`, `BillingWebhookEvent` and `PlanEnrollment.subscriptionId`, but **no billing contract entity has been written yet**.

## Where the billing shapes live today

- **The product price** is the one billing shape with a live consumer (the admin product form and the storefront), so it lives in `cms/product/`. `priceSchema` carries `amountCents`, `currency`, `periodCount`, `periodUnit`, `autoRenew` and `isActive`; `createProductPriceSchema` fills a new price from `PRODUCT_PRICE_DEFAULTS` (UAH, 4 weeks, auto-renew offered), while `updateProductPriceSchema` requires all five terms, so an update never resets a stored currency or period to the defaults. `autoRenew` on a price means the auto-renewing form is offered besides the one-off paid period.
- **The period** is a shared value object in `src/common/`: `PeriodUnit` (`DAY`, `WEEK`, `MONTH`, `YEAR`), `PERIOD_CONSTANTS` (1 to 365, the same bounds as the database CHECK), `periodSchema`, `PERIOD_UNIT_LABELS` and `formatPeriod(period, locale)`. It sits in `common/` because CMS contracts may not import Billing contracts, and Billing contracts may not import CMS ones.

## What goes here, step by step

Step numbers follow `initiatives/storefront-billing/plan.md`. The layout below is indicative; the step that lands a folder settles its exact shape.

- **0.5**: the first entities, alongside the reshaped payment port and the Monobank adapter in api-server.
  - `subscription/` — `Subscription` schemas: provider (`MONOBANK`, `MANUAL`, `FREE`), status (`ACTIVE`, `PAST_DUE`, `CANCELED`, `EXPIRED`), current period, grace and cancel dates, and the form the buyer chose (`autoRenew`). One subscription per user and product.
  - `transaction/` — `Transaction` schemas: kind (`INITIAL`, `RENEWAL`, `ONE_OFF`, `REFUND`), status, amount and currency.
  - `price/` and `product-billing/` — the billing facet of `Product`: prices and the plan bindings with their delivery (`JOIN`, `COPY`). The CMS facet stays in `cms/product/`.
- **1.1 and 1.2**: request and response schemas for start purchase, cancel and my subscriptions. The subscription state machine and the webhook ledger run inside api-server; this folder only carries the shapes the apps exchange with them.
- **3.1 and 3.2**: the admin shapes (plan bindings, prices, `MANUAL` grants) and the payment state the coach roster reads.

Access, open or closed per enrollment, is resolved by the gate in `api-server/src/authz/` from step 1.1. LMS and Coaching contracts may not import from this folder, so any shape they share with Billing goes to `src/common/`, as the period did.

## Rules

- No schema here gets a `cardToken` field. The card token never enters a contract, a mapper or an API response. It can appear in the text of a database error, because Postgres prints the failing row, and from there in logs; how it is protected at rest and in logs is decided at step 0.5.
- Enums are TS string enums parsed with `z.nativeEnum`, mirrored from the Prisma enums by the api-server mappers (the `cms` convention). Money stays integer cents.

## Related work

- `docs/BOUNDED-CONTEXTS.md` (section 5) is the canonical record of the Billing model, its invariants and the dead columns step 0.3b drops.
- ADR-0044 sets the current product decisions and supersedes ADR 0008 and ADR 0014; ADR 0036 covers the `Idempotency-Key` every billing mutation carries.
- `initiatives/storefront-billing/domain-model.md` sketches the subscription state machine, access resolution and purchase flows the later steps build.

**Do not put non-Billing contracts here.** If you have a CMS product contract, it lives in `cms/product/`. If you have a user contract, it lives in `iam/user/`. Billing is exclusively payment-adjacent domain data.
