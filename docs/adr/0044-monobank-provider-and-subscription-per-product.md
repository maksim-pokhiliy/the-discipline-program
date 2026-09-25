# 0044. Monobank as the payment provider; subscriptions per product on a provider-agnostic billing core

- **Status:** Accepted (supersedes ADR-0008 and ADR-0014)
- **Date:** 2026-09-23
- **Deciders:** Owner (product input from Denys; the Apple-IAP counter-proposal by Vladyslav considered)
- **Tags:** `billing`, `payments`, `vendor-dependency`, `invariants`, `domain-model`

## Context

Billing has existed only as a schema fingerprint since April 2026: `Product / Price / Subscription / Transaction` shaped around Stripe (`stripeProductId`, `stripePriceId`, an externally-assigned `Subscription.id`; ADR-0014, retroactive) and a "one user, one subscription" invariant enforced by `Subscription.userId @unique` (ADR-0008). No endpoint, contract or UI was ever written against it; `packages/api-server/src/endpoints/billing/` and `packages/contracts/src/entities/billing/` are README placeholders. The roadmap parked billing behind a "second paying coach" trigger.

The trigger that actually fired was the first coach. On 2026-09-22 Denys asked for payment through the site, tired of chasing non-payers by hand; his athletes are all in Ukraine; he wants 4-week billing periods; and his pricing is a hybrid — group programming, personal design, specialized programs — that an athlete can buy in combination (CrossFit plus a separate weightlifting track). Three premises of the old ADRs no longer hold:

1. **Stripe.** No Ukrainian FOP can onboard on Stripe. The provider must be a Ukrainian acquirer paying out to a FOP account in UAH.
2. **One subscription per user.** ADR-0008 rested on "we are not selling plans that a user can stack". Denys stacks them.
3. **Apple IAP as the mobile rail** (raised by the legacy iOS author on 2026-09-22: "give Apple 15% and sell worldwide"). Verified against sources: App Store subscription periods are 1w/1m/2m/3m/6m/1y — no 4 weeks; the App Store listing is delisted (the developer membership lapsed, apex-sunset AS-1) so there is nothing to sell IAP through; IAP serves iOS only while the athlete surface is web + iOS; Apple's guideline 3.1.3(b) lets a web-bought subscription be honored in the app as long as no in-app CTA points outside. Apple's genuine strengths — merchant of record for global VAT, one-tap purchase — matter only for an English-market push that does not exist yet.

Monobank's acquiring API (verified 2026-09-22/23) offers hosted checkout, card tokenization, merchant-initiated charges by token, and native "regular payments" with an `interval` of the form `{n}{d|w|m|y}`; ECDSA-signed webhooks; a test mode open to any mono client; 1.3% on Ukrainian cards, 2% on foreign ones, next-day settlement. It does not offer amount or interval edits on a native subscription (only `cancel`), and its recurring webhook shapes are only readable in a browser — hence the initiative's W0 spike.

## Decision

1. **Monobank internet acquiring is the payment provider.** It is reached through a `PaymentPort` in `packages/api-server/src/infrastructure/payment/` with exactly one adapter file importing the vendor HTTP client, configured from `packages/env/src/monobank.ts` and injected by factory DI — the same seam ADR-0013 prescribes for storage. `Subscription.provider` is a discriminator: `MONOBANK | MANUAL | FREE` today (`MANUAL` = comp access and the cohort cutover grant; `FREE` = zero-price products such as the 3-day trial, which skip the provider entirely), `APPLE` reserved for a later IAP adapter. Whether recurring charges use Monobank's native subscriptions or the platform's own scheduler over tokenized merchant-initiated charges is a step-level decision (`initiatives/storefront-billing/decisions.md` D-3) taken after the spike; the port hides it.
2. **A subscription is per product, not per user.** `Subscription` is unique on `(userId, productId)`; a `Product` binds one or more training plans through `ProductPlan` rows that carry a `delivery` of `JOIN` (enroll into that plan) or `COPY` (clone the plan for the buyer); a `PlanEnrollment` carries `subscriptionId`. "Everything included" is a product with several plans. Row lifetime follows ADR-0008's spirit — one row per (user, product), status transitions in place, `Transaction` rows as the history.
3. **Access = subscription state, resolved per enrollment in `authz/`.** `resolveEnrollmentAccess` is the only reader of billing state outside the Billing context; LMS, Coaching and the mobile-compat shim stay Billing-blind (the existing dependency-cruiser rules are the enforcement). A lapse never edits the enrollment; an enrollment without a subscription is coach-granted access.
4. **A price is `amountCents + currency + (periodCount, periodUnit) + autoRenew`.** Every price is sold both as an auto-renewing subscription and as a one-off paid period; `PriceInterval.ONE_TIME` and `SubscriptionStatus.TRIAL` are removed.
5. **Every invoice carries a fiscal basket** (`merchantPaymInfo`) from day one, so turning on mono's ПРРО is a merchant-cabinet switch, not a code change.

The Stripe columns (`stripeProductId`, `stripePriceId`), the externally-assigned `Subscription.id`, and the `userId @unique` constraint are removed by the initiative's W0 migration. **ADR-0008 and ADR-0014 are superseded in full.**

## Consequences

- **Positive:** the provider that can actually pay a Ukrainian FOP, at 1.3% instead of 15%; Denys's 4-week periods and per-product pricing map 1:1 onto the model and onto the provider; one gate in `authz/` serves the web and the unchanged App-Store app; the seam keeps an Apple IAP adapter (or any second acquirer) a bolt-on with no schema change; the fiscal switch costs nothing later.
- **Negative:** the platform owns more of the billing lifecycle than a Stripe-Billing integration would (grace, dunning, reconciliation, possibly the renewal scheduler itself); Monobank cannot change a subscription's amount, so price changes reach existing auto-renew subscribers only through cancel + re-subscribe (one-off buyers absorb them naturally); no merchant-of-record — selling to EU consumers would need our own VAT handling; the per-product model puts several charge dates on one athlete.
- **Neutral:** billing endpoints and contracts finally populate `endpoints/billing/` and `contracts/billing/`; a webhook route and a daily cron join the platform app; coach and admin surfaces read payment state through billing-owned endpoints; `docs/BOUNDED-CONTEXTS.md` §5/§8 are updated in step with the W0 migration.

## Alternatives considered

- **Apple IAP now (the 2026-09-22 proposal).** Rejected for launch on facts: no 4-week period, no live listing, iOS-only, 15% of a base that is entirely Ukrainian. Kept as a reserved provider for a later English-market push.
- **Keep Stripe (ADR-0014).** A Ukrainian FOP cannot open a Stripe account; the "schema is already Stripe-shaped" argument buys nothing once the columns must go anyway.
- **One subscription → many plans (a membership).** Rejected: the first athlete who adds a second product forces cancel + new bundle + new charge date, and a product cannot be priced on its own; the bundle case is covered by a product with several plans.
- **Merchant-of-record services (Paddle, Lemon Squeezy).** Global tax handling is attractive for a global product; irrelevant for a Ukrainian base and doubtful for FOP onboarding. Revisit with the English-market push, where Apple IAP is the more natural rail anyway.
- **A GROUP / PERSONAL product kind.** Rejected by the owner: personal vs group is the coach's mental model; plans differ only by how many athletes ride them. What differs is what a purchase does — hence `delivery` on the binding.
- **LiqPay / WayForPay / Fondy.** Comparable Ukrainian acquirers with tokenization; Monobank chosen for the coach's banking (a mono FOP account is a ten-minute in-app open), the lowest fee on the relevant cards, and a native subscription primitive as a fallback path.

## References

- `initiatives/storefront-billing/` — charter, `domain-model.md`, `monobank-notes.md` (verified endpoint facts and sources), decisions D-1..D-12.
- ADR-0008 (superseded), ADR-0014 (superseded), ADR-0013 (port/adapter pattern mirrored), ADR-0036 (idempotency keys), ADR-0043 (the App-Store app is served by the platform shim; its wire contract is sacred).
- `docs/BOUNDED-CONTEXTS.md` §8 "Access = Subscription State"; `.dependency-cruiser.cjs` context rules.
- Apple App Store Review Guidelines 3.1.1 / 3.1.3; monobank acquiring docs (`monobank.ua/api-docs/acquiring`).
