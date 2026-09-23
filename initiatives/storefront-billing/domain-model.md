# storefront-billing — domain model (target)

The model the owner ratified on 2026-09-23 («модель заходит»), written as the source the P0.3 corpus and every later executor prompt quote. Step-level details are marked _(step)_ and are decided in the step that ships them — not here.

## 1. Entities (Prisma sketch, names indicative)

```prisma
enum BillingProvider { MONOBANK  MANUAL }            // APPLE reserved (ADR-0044)
enum PlanDelivery    { JOIN  COPY }                   // D-4
enum PeriodUnit      { DAY  WEEK  MONTH  YEAR }       // maps 1:1 to mono `interval` `{n}{d|w|m|y}`
enum SubscriptionStatus { ACTIVE  PAST_DUE  CANCELED  EXPIRED }   // TRIAL removed (no trials, D-11 Q10)
enum TransactionKind { INITIAL  RENEWAL  ONE_OFF  REFUND }

model Product     { …existing CMS facet… ; plans ProductPlan[] ; prices Price[] }   // stripeProductId removed
model ProductPlan { id ; productId ; planId ; delivery PlanDelivery ; @@unique([productId, planId]) }
model Price       { id ; productId ; amountCents Int ; currency Currency @default(UAH) ;
                    periodCount Int ; periodUnit PeriodUnit ; autoRenew Boolean ; isActive Boolean }   // stripePriceId + PriceInterval removed
model Subscription {
  id                     String @id @default(cuid())          // was an external Stripe id (ADR-0014) — now ours
  userId ; productId ; priceId
  provider               BillingProvider
  providerSubscriptionId String? @unique                       // mono subscriptionId on the native path (D-3)
  cardToken              String?                               // mono wallet token on the MIT path (D-3) — _(step: at-rest handling)_
  status                 SubscriptionStatus
  autoRenew              Boolean
  currentPeriodStart ; currentPeriodEnd
  graceEndsAt DateTime? ; canceledAt DateTime? ; endedAt DateTime?
  @@unique([userId, productId])                                // D-2 — replaces userId @unique (ADR-0008)
}
model PlanEnrollment { …existing… ; subscriptionId String? ; subscription Subscription? @relation(onDelete: SetNull) }
model Transaction  { …existing… ; provider BillingProvider ; kind TransactionKind ; periodStart? ; periodEnd? }   // providerTxId = mono invoiceId
model BillingWebhookEvent { id ; provider ; eventKey String @unique ; payload Json ; receivedAt ; processedAt? ; error? }   // idempotency ledger for inbound webhooks (RequestIdempotency is for client keys)
```

_(step 0.3)_: exact indexes, the mutation-invariant trace on `@@unique([userId, productId])` (planner-discipline (h)), whether `PlanEnrollment.subscriptionId` gets a partial unique.

## 2. Subscription FSM

```
(purchase paid)      ──► ACTIVE ──(renewal paid)──► ACTIVE (period rolls)
ACTIVE ──(renewal declined)──► PAST_DUE ──(paid within grace)──► ACTIVE
PAST_DUE ──(graceEndsAt passed)──► EXPIRED
ACTIVE ──(athlete cancels)──► CANCELED   (canceledAt set; provider canceled at once; access to currentPeriodEnd)
ACTIVE(one-off, autoRenew=false) ──(currentPeriodEnd passed)──► EXPIRED
CANCELED | EXPIRED ──(new purchase of the same product)──► ACTIVE (same row, new period)   // one row per (user, product)
MANUAL: created ACTIVE with currentPeriodEnd = the grant's end; expires like a one-off.
```

Access window = `currentPeriodEnd` (+ grace while PAST_DUE). Grace default 3 days (D-11 Q4).

## 3. Access resolution (D-7) — the only cross-context door

`authz/resolveEnrollmentAccess(enrollment) → OPEN | CLOSED`:

- enrollment not `ACTIVE` → CLOSED (existing LMS law).
- `subscriptionId = null` → OPEN (coach-granted; pre-cutover rows and explicit coach grants).
- subscription `ACTIVE` → OPEN · `PAST_DUE` and `now < graceEndsAt` → OPEN · `CANCELED` and `now < currentPeriodEnd` → OPEN · otherwise CLOSED.

Callers: `plan-timetable` (per enrollment: CLOSED enrollments render as a wall entry, not omitted), `session-detail` / `session-access` (CLOSED → the wall reason, not 404), the iOS shim `GET /program` (link → plan → this identity's enrollment → OPEN: the real day · CLOSED: the text day (D-8) · no enrollment on the linked plan: OPEN until the 4.1 grant, SB-11). Coaches / head coaches / admins are never gated.

## 4. Purchase flows

**Auto-renew (autoRenew = true).** Checkout → invoice (or `subscription/create`, per D-3) with the fiscal basket → mono page → `success` webhook → `Transaction(INITIAL)` → `Subscription ACTIVE` (period = price period from the payment date) → side effects (§5) → emails. Each period: renewal charge per D-3 → `RENEWAL` transaction → period rolls; declined → `PAST_DUE` + email + grace.

**One-off period (autoRenew = false).** Same first leg, no card stored; `Subscription ACTIVE` with `currentPeriodEnd = paid + period`; reminder email 3 days before the end with a renew link; at the end → `EXPIRED` → wall with the same renew link.

**MANUAL.** Head coach / admin action "grant access until <date>" → `Subscription(MANUAL, ACTIVE, currentPeriodEnd = date)` + enrollment if missing. No charge, no email unless asked.

**Cancel.** Athlete action → provider cancel (`subscription/edit cancel` or dropping the token, per D-3) → `CANCELED`, access to `currentPeriodEnd`, confirmation email. No refund from the platform (D-11 Q5).

## 5. Purchase side effects (D-4) — one transaction

For each `ProductPlan` of the product:

- **JOIN**: upsert `PlanEnrollment(planId, athleteId)` → `ACTIVE`, `boardedAt = today` on first creation (an existing `PAUSED` row → `ACTIVE`, `boardedAt` unchanged), `subscriptionId` set.
- **COPY**: create a new `TrainingPlan` (creator = the source plan's creator, name = source + athlete, status `ACTIVE`), clone every week of the source re-anchored to the boarding Monday + k·7 days (existing `deepCloneSessionsInto` per day), then enroll as JOIN. _(step 1.2: what a second purchase of the same COPY product does — a fresh copy vs re-activating the previous one; lean: re-activate if the previous copy still exists and the athlete is its only rider.)_
- Ensure `CoachAthleteAssignment(coach = plan creator, athlete)` exists.
- Newcomer: `createPendingUser(ATHLETE)` at checkout (or on the webhook if the email is new) + `issueInviteAndSendEmail` — the existing invite flow; the actor for system-issued invites is a fixed system admin id _(step 1.2)_.

## 6. Provider seam

`PaymentPort` (reshaped, 0.5): `createPurchase(price, buyer, form) → { redirectUrl, providerRef }` · `chargeStored(subscription) → providerTxId` (MIT path) · `cancel(subscription)` · `fetchStatus(ref)` · `verifyWebhook(rawBody, signature) → event`. One adapter file imports mono HTTP; env from `packages/env/src/monobank.ts` (`MONOBANK_API_URL`, `MONOBANK_MERCHANT_TOKEN`, `MONOBANK_WEBHOOK_PUBLIC_KEY?` cache); dep-cruiser rule: only the adapter may import the vendor client, mirroring `api-server-storage-is-leaf`.

## 7. Cron (platform app, `CRON_SECRET` pattern from admin retention)

Daily: expire `PAST_DUE` past grace → `EXPIRED` + email · expire one-off / MANUAL past `currentPeriodEnd` · send one-off reminders (T-3 days) · reconcile: for every `ACTIVE` provider subscription, confirm with mono (`invoice/status` / `subscription/status`) and repair a missed webhook · (MIT path) issue due renewals. Every action idempotent; every skip logged with a reason.

## 8. Surfaces (what each role sees)

- **Athlete (web):** profile "Subscription" card per product: status, next charge / period end, amount, cancel, renew, one-off renew; the wall replaces the timetable entry / session when CLOSED, with the reason and the renew button.
- **Athlete (iOS):** the real day, or the text day (D-8). Never a link.
- **Coach:** roster chip paid / grace / closed per athlete and plan, filter, drawer detail; head coach: "grant access until <date>" (MANUAL). Data via a billing-owned endpoint (SB-7).
- **Admin:** product form: plan bindings with delivery, prices (UAH, period, auto-renew); user page: subscriptions, transactions, grant / extend / revoke; subscriptions list with status filters.
- **Public:** storefront (`en` + `uk`) → checkout on the platform (`/subscribe/<product>`; existing email → sign in first) → mono page → return page.

## 9. Rollout (D-9, plan 4.1–4.3)

Grant script (dry-run → apply, idempotent): for every existing athlete, on every plan they ride — a `MANUAL` subscription until X and the enrollment link; imported iOS athletes without any enrollment get one on the plan behind their level's GENERAL link (SB-11). Announcement by Denys with X. At X the grants expire; the gate closes non-payers; the coach sees them as "closed"; nobody edits anything by hand.

## 10. Constraints the executor must honor

Sacred list in `charter.md` · dep-cruiser boundaries · no `Idempotency-Key`-less mutations (ADR-0036) · money is integer · every webhook 200-fast + ledger-first · no Stripe shapes survive W0 (SB-8) · Apple 3.1.1: no CTA in the iOS DTO.
