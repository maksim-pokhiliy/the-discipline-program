# storefront-billing — decisions

D-numbered ratified decisions. Step-level calls that don't merit a full ADR live here;
cross-initiative architecture calls go to `docs/adr/` (ADR-0044 is this initiative's).
**Promote here at every gate.** This file is the SSOT for "why."

**Status legend:** `RATIFIED` · `OPEN` · `SUPERSEDED`.

## Index

| ID   | Topic                                                                                           | Status   |
| ---- | ----------------------------------------------------------------------------------------------- | -------- |
| D-1  | Monobank is the provider; the billing core is provider-agnostic (ADR-0044)                      | RATIFIED |
| D-2  | Subscription per PRODUCT, not per user; product binds 1..N plans; enrollment carries the sub    | RATIFIED |
| D-3  | Recurring mechanism: own scheduler + merchant-initiated charges on the tokenized card (b)       | RATIFIED |
| D-4  | Delivery lives on the product↔plan binding: JOIN or COPY; plans have no "kind"                 | RATIFIED |
| D-5  | Two purchase forms per price (auto-renew, one-off period); cash is not a flow; MANUAL = comps   | RATIFIED |
| D-6  | No pause                                                                                        | RATIFIED |
| D-7  | Access is resolved per enrollment in `authz/`; a lapse never edits the enrollment               | RATIFIED |
| D-8  | iOS soft wall = a synthetic program DTO with text, no link; sign-in stays open                  | RATIFIED |
| D-9  | Cohort rollout: launch-day MANUAL grant until date X (default launch + 4 weeks)                 | RATIFIED |
| D-10 | Fiscal basket in every invoice payload from day one; the fiscalization switch is Denys's        | RATIFIED |
| D-11 | Coach-side defaults (12 items sent to Denys 2026-09-23) stand unless he objects                 | RATIFIED |
| D-12 | Ukrainian buyer-facing pages + an offer/requisites page are an acquiring precondition           | RATIFIED |
| D-13 | Trial = a zero-price 3-day product (provider `FREE`) bound COPY to a trial template plan        | RATIFIED |
| D-14 | Every local run targets the Docker stack; dev Neon is a read-only reference                     | RATIFIED |
| D-15 | `Price.autoRenew` = the auto-renew form is offered; `Subscription.autoRenew` = the buyer's form | RATIFIED |
| D-16 | The W0 migration refuses rather than guesses; a production-snapshot rehearsal gates the merge   | RATIFIED |
| D-17 | No `walletId` column, plain `cardToken`, nullable `priceId` with a CHECK for non-MANUAL         | RATIFIED |
| D-18 | W0 ships as expand (0.3) then contract (0.3b); production apply is dispatched before merge      | RATIFIED |
| D-19 | While a migration is authored, the executor's databases live in a throwaway container           | RATIFIED |
| D-20 | `cardToken`: ciphertext under its own key, redacted from the ledger, never in stored error text | RATIFIED |

---

### D-1 — Monobank is the provider; the billing core is provider-agnostic

- **Status:** RATIFIED (owner 2026-09-22; reaffirmed 2026-09-23 after Vladyslav's global-market argument; Denys 2026-09-23: every athlete is in Ukraine).
- **Decision.** Monobank internet acquiring (`api.monobank.ua/api/merchant/*`) is the payment provider. The core (subscription FSM, access resolution, ledger) never imports the vendor: a reshaped `PaymentPort` in `infrastructure/payment/`, exactly one adapter file speaks Mono HTTP, config comes from `packages/env/src/monobank.ts` via DI. `Subscription.provider` is `MONOBANK | MANUAL` today; `APPLE` is reserved for a later IAP adapter.
- **Rationale.** 1.3% vs Apple's 15% on a base that is 100% Ukrainian today; Mono's `interval` takes `4w`, App Store periods cannot; no App Store listing exists to sell IAP through (apex-sunset AS-1); Mono's hosted page serves every device incl. iOS, IAP serves iOS only. Vladyslav's real point — global reach through Apple as merchant of record — is honored as a seam, not a launch requirement.
- **Links.** ADR-0044 (supersedes ADR-0014); `monobank-notes.md`; journal 2026-09-22.

### D-2 — Subscription per PRODUCT; product binds 1..N plans; enrollment carries the subscription

- **Status:** RATIFIED (owner 2026-09-23 — «модель заходит»).
- **Decision.** `Subscription` is unique per `(userId, productId)`, not per user. A `Product` binds one or more plans through `ProductPlan`. A `PlanEnrollment` carries `subscriptionId` (nullable = coach-granted access, see D-7). An athlete who does CrossFit and separately Olympic lifting holds two subscriptions with two charge dates. A "everything included" offer is just a product with several plans.
- **Rationale.** Mirrors how Denys sells (each product has its own price) and how Mono charges (one subscription = one amount + one interval). The alternative "one subscription → many plans" turns the first athlete who adds a second product into cancel + new bundle + new charge date, and forbids pricing a product on its own. ADR-0008's premise ("we are not selling plans a user can stack") no longer holds; it demanded a superseding ADR — that is ADR-0044.
- **Links.** ADR-0044 (supersedes ADR-0008); `domain-model.md`; journal 2026-09-23.

### D-3 — Recurring mechanism: own scheduler + merchant-initiated charges on a tokenized card

- **Status:** RATIFIED (b) — owner 2026-09-25 after the spike and the page facts («по списаниям всё ок. по контуру ок»); P1.3 is specced against (b), the renewal trigger stays pluggable (our cron today, a provider event for a future adapter).
- **Fork.** (a) Mono native subscriptions (`POST /api/merchant/subscription/create` → Mono schedules the charges; `edit` supports only `cancel` with an optional refund; `remove` only before the first payment). (b) Own scheduler: the first payment tokenizes the card (`saveCardData`), each period the platform cron issues `POST /api/merchant/wallet/payment` with `initiationKind: merchant`; every charge is an ordinary invoice (carries `merchantPaymInfo`), retries / grace / 4-week math are ours.
- **Decision.** (b). The spike proved the whole (b) loop in test mode: invoice with `saveCardData` → `walletData.cardToken` → three merchant-initiated charges, each a synchronous 200 `status: "success"` and an ordinary invoice afterwards; the token outlived a native subscription that had shared it. The D-3 lean condition for (a) («native subscriptions carry a fiscal basket AND expose retry semantics AND run in test mode») fails on two of three: (a) does run in test mode, but nothing documents or exposes its retry behaviour on a declined charge (only `summary.totalFailed` exists), and the create payload has no verified place for a fiscal basket. (a) also cannot change amount or interval, has no pause, and one-off periods would need invoices anyway — two charge paths for one product.
- **Consequences.** P1.3 = a cron (admin `vercel.json` already hosts one) that, per ACTIVE auto-renew subscription whose `currentPeriodEnd` has passed, issues one `wallet/payment` under a `RequestIdempotency`-style key, records the `Transaction`, and drives the FSM on the synchronous result (`success` → new period; anything else → PAST_DUE + grace per D-11 Q4); the webhook for the same invoice is a confirmation, not the trigger. Card lifecycle (expiry, `DELETE wallet/card` on cancel-at-period-end) is ours. `initiationKind: "client"` (3DS `tdsUrl`) is reserved for a customer-present "pay now" button, not for renewals. Native `subscription/*` stays a reference in `monobank-notes.md`; no adapter method wraps it.
- **Checkout consequences (page facts, 2026-09-25).** Auto-renew purchase = invoice with `saveCardData: { saveCard: true, walletId }` and WITHOUT `allowTokenizationChoice` (the page would show a toggle the athlete can switch off); the recurring-charge consent is stated on our checkout page and in the offer. One-off purchase = the same invoice without `saveCardData`. The card form and the mono app both tokenize (verified, notes item 7) — the two channels Ukrainian athletes actually use; Apple Pay / Google Pay are a production check, and if they do not tokenize the auto-renew invoice is restricted with `paymentMethods: ["pan", "mono", "monopay"]` (verified API parameter) rather than by UI copy; renewals need no 3DS (`merchant` kind), a `processing` + `tdsUrl` reply is handled as a failed renewal.
- **Captured 2026-09-25 (SB-14 tunnel):** the invoice webhook body + `x-sign` (`spike/fixtures/`), and a merchant-initiated charge's webhooks (`processing` → `success`, plain invoice shape). Still unknown: a declined-charge simulation in test mode (notes open item 6) — the FSM branch for it is table-tested, not provider-tested, until prod soak.
- **Links.** `monobank-notes.md` §0.2 spike; `spike/mono-spike.mjs`; deferred SB-1, SB-14; plan 0.2 / 1.3.

### D-4 — Delivery lives on the product↔plan binding: JOIN or COPY

- **Status:** RATIFIED (owner 2026-09-23 — rejected a GROUP/PERSONAL plan kind).
- **Decision.** `ProductPlan.delivery ∈ { JOIN, COPY }`. JOIN: the purchase enrolls the athlete into THAT plan (a shared train on real dates). COPY: the purchase clones the bound plan into a new plan for this athlete (weeks re-anchored to the boarding Monday + k weeks), enrolls them, assigns them to the plan's coach. Plans carry no kind; "personal" is only a plan with one enrollment; a "template" is just a plan Denys keeps in `DRAFT` so nobody enrolls into it directly. "Personal design from scratch" = COPY of an empty plan; "personal from a template" = COPY of a filled one; a self-paced specialized program = COPY with a one-off price.
- **Rationale.** The owner's model: plan entities differ only by how many athletes ride them; a personal/group label is the coach's mental model and must not leak into the schema. What genuinely differs is what a purchase DOES, and that is a property of the binding. Deriving JOIN/COPY from plan status was rejected as magic a coach cannot read. COPY is buildable on existing primitives: `Week.startDate` is an absolute `@db.Date`, `lmsWeekApi.cloneFrom` + `deepCloneSessionsInto` already clone a week's subtree.
- **Links.** `domain-model.md`; athlete-core deferred "auto-create an empty plan on a personal-product purchase" (absorbed); journal 2026-09-23.

### D-5 — Two purchase forms per price; cash is not a flow; MANUAL only for comps and the cohort grant

- **Status:** RATIFIED (owner 2026-09-23 — «не делать второй Excel»).
- **Decision.** Each price is sold two ways at the same amount and period: auto-renew (card stored, charged each period) and one-off period (no card stored; access ends at period end; a reminder email 3 days before with a renew button; the wall afterwards with the same button). In-person athletes pay from their own phone on Mono's hosted page (card, Apple Pay, Google Pay, mono app). `provider = MANUAL` exists only for comp access (the coach's own account, testers, a sponsored athlete — a head-coach action with an end date) and for the launch-day cohort grant. `PriceInterval.ONE_TIME` dies: a price is amount + period + `autoRenew`.
- **Rationale.** "Cash → the coach extends by hand every month" is the Excel this product exists to kill. The one-off form is the honest replacement for cash and also serves athletes who distrust auto-charge; Mono cannot edit a subscription's amount, so one-off buyers also absorb price changes cleanly.
- **Links.** `domain-model.md`; coach-side Q3/Q8 (D-11); journal 2026-09-23.

### D-6 — No pause

- **Status:** RATIFIED (owner 2026-09-23 — moved from Denys's question list into "our decisions").
- **Decision.** There is no paused subscription state. Stopping = cancel (access to the end of the paid period); coming back = a new purchase, which re-boards the same plan via `PAUSED → ACTIVE` on the enrollment. The stored card token makes the return one click.
- **Rationale.** The train does not wait (persona §5.1–5.2); Mono has no pause primitive; a pause state adds an FSM branch for a UX the cancel + renew pair already delivers.
- **Links.** persona open question "pause vs unsubscribe" — closed by this decision; journal 2026-09-23.

### D-7 — Access is resolved per enrollment in `authz/`; a lapse never edits the enrollment

- **Status:** RATIFIED (owner 2026-09-23).
- **Decision.** `resolveEnrollmentAccess` lives in `authz/` (the cross-cutting layer dep-cruiser exempts) and is the ONLY reader of subscription state outside Billing. Rule: enrollment `ACTIVE` AND (no subscription → coach-granted, OPEN · subscription `ACTIVE` → OPEN · `PAST_DUE` with `now < graceEndsAt` → OPEN · otherwise CLOSED). Web athlete reads (timetable, session detail, session access) and the iOS shim (`GET /program`) call it. A lapse changes nothing on the enrollment; a completed cancel or expiry moves the enrollment to `PAUSED`; a new purchase moves it back to `ACTIVE` with the original `boardedAt` (the timetable never shifts — athlete-core D-LAYERS; days missed while closed have simply departed).
- **Rationale.** BOUNDED-CONTEXTS §8 already plans "Access = Subscription State" as a guard; the dep-cruiser comments say "subscription gating is enforced upstream in a guard, not via LMS reaching into Billing". Enrollment stays pure LMS history; Coaching stays Billing-blind and reads payment state through a billing-owned endpoint. "No subscription = open" keeps coach-created enrollments working before the cohort grant and makes a coach grant an explicit, dated MANUAL subscription after it.
- **Links.** `docs/BOUNDED-CONTEXTS.md` §8; `.dependency-cruiser.cjs` `contracts-lms-no-coaching-cms-billing`; `domain-model.md`.

### D-8 — iOS soft wall = a synthetic program DTO with text, no link; sign-in stays open

- **Status:** RATIFIED (owner 2026-09-23 — «это мы сами придумаем»).
- **Decision.** When the identity's linked plan resolves to CLOSED, `GET /program` returns an ordinary 200 program DTO: `isRestDay: false`, one training, one block, one text cell — default (English, Q11): `Subscription inactive. Program access is paused.` (Ukrainian if Denys flips Q11: «Підписка неактивна. Доступ до програми призупинено.»). No URL, no "pay here", no coach contact instruction beyond the text. Sign-in, `GET /user`, catalogs keep working. `MobileLegacyIdentity.isEnabled` is NOT reused for billing — it stays the admin-controlled account switch.
- **Rationale.** The app renders raw text cells and knows only 404 ("no program today" — reads as "the coach forgot") and 403 (sign-out — reads as "wrong password"); a text day is the only byte-faithful way to tell the athlete WHY. Apple 3.1.1 forbids in-app CTAs to outside purchase; a statement of state is not a CTA.
- **Links.** apex-sunset charter "Sacred"; memory `legacy-ios-program-render`; `domain-model.md` §iOS.

### D-9 — Cohort rollout: launch-day MANUAL grant until date X

- **Status:** RATIFIED as the default (owner 2026-09-23; X may be overridden by Denys — Q9).
- **Decision.** On launch day a script grants every existing athlete a `MANUAL` subscription ending at X (default X = launch + 4 weeks) on each plan they ride — including imported iOS athletes, who get a `PlanEnrollment` on the plan their level's GENERAL publish link points to. Denys announces "subscribe on the site before X". At X the grants expire and the gate closes non-payers by itself. Nobody revokes by hand; a repeat grant is a head-coach comp, not a bulk action.
- **Rationale.** Nobody may be kicked by surprise on deploy day; the grant is additive prod data (Sacred); the expiry makes the cutover a date, not a chore.
- **Links.** deferred SB-12; plan 4.1.

### D-10 — Fiscal basket in every invoice payload; the fiscalization switch is Denys's

- **Status:** RATIFIED (owner 2026-09-23 — declined to advise Denys on РРО; the code stays switch-ready).
- **Decision.** Every invoice we create carries `merchantPaymInfo` with a one-line basket (the product title, qty 1, the amount). Whether Denys turns on fiscalization (mono's own ПРРО "Є-Чек", 180 UAH/month) or relies on the art. 9 p. 14 exemption for services paid through payment services is his call after a tax consultation; turning it on later needs no code change.
- **Rationale.** The exemption exists (Law 265/95 art. 9 p. 14; ДПС/НБУ practice lists LiqPay/WayForPay-class services) but the term "сервіс переказу коштів" is undefined in the law and practice varies; the accountant does not know. Sending the basket costs one object per payload.
- **Links.** `monobank-notes.md` §РРО; deferred SB-3.

### D-11 — Coach-side defaults stand unless Denys objects

- **Status:** RATIFIED as defaults (sent to Denys 2026-09-23 15:43) — **answered by Denys 2026-09-24**; the amendments below are the ratified values.
- **Decision (the 12).** (1) prices in UAH per product · (2) period 4 weeks, charge date floats with the period · (3) auto-renew AND one-off on every product, same price · (4) grace 3 days after a failed charge, email at once + a reminder, then closed · (5) cancel = self-serve, access to period end, no refund · (6) a personal product COPIES whatever plan it is bound to — template or empty · (7) no bundles at launch: one product = one plan · (8) comp access: nobody except the coach's own account; others by a dated head-coach grant · (9) cohort: free until X = launch + 4 weeks · (10) no trial · (11) billing emails and screens in English like the platform · (12) a closed athlete keeps profile and records; only the program is walled.
- **Denys's answers (2026-09-24) — amendments.** Q1 UAH ✓ · Q2 4 weeks ✓ · Q3 both forms ✓ · **Q4 grace = 2 days** (his «1–2 достаточно»; we take the upper bound so one reminder cycle fits) · Q5 no refunds ✓ («не видел, чтобы кто-то возвращал») · **Q6 personal products are PER STYLE** — «PRO соревновательный», «PRO для души», «Func BB style» — each its own storefront product bound COPY to its own template plan (D-4 unchanged; the coach still edits the copy afterwards) · Q7 no bundles ✓ · Q8 comps ✓ · Q9 X = launch + 4 weeks ✓ · **Q10 trial = yes**, as a 3-day introductory template («скачал, посмотрел, пощупал») → D-13 · Q11 English ✓ (SB-10 closed) · **Q12 clarified**: a closed athlete (stopped paying, or a one-off period ended) sees NO program at all — neither past nor future days — until they pay again; profile and records stay. Denys's question «есть смысл оставлять видимость старых программ, или это гемор?» is answered: no visibility, and it is the default of the gate, not extra work.
- **Links.** journal 2026-09-23 (verbatim message) · journal 2026-09-24 (answers).

### D-12 — Ukrainian buyer-facing pages + an offer/requisites page are an acquiring precondition

- **Status:** RATIFIED (fact-driven, 2026-09-23).
- **Decision.** Before Denys applies for internet acquiring, the marketing site gets a Ukrainian version of the pages a buyer touches (storefront, checkout entry, contacts, about/offer) plus an offer/requisites page (ФОП ПІБ, ІПН, address, contacts, service description, payment and refund terms). The blog stays English. The requisites are the only content waiting on Denys (SB-4); the mechanism is built without them.
- **Rationale.** mono's connection checklist: «є українська версія сайту · є інформація про компанію, наприклад розділ "Про нас" або оферта · є контакти, чат або форма для зв'язку · товари мають фото, опис і ціну».
- **Links.** `monobank-notes.md` §Connecting a FOP; plan 0.4.

### D-13 — Trial = a zero-price 3-day product (provider `FREE`) bound COPY to a trial template plan

- **Status:** RATIFIED (Denys 2026-09-24, Q10: «можно будет создать пробный / ознакомительный шаблон… на три дня»; owner-planner mapping onto the model).
- **Decision.** A trial is not a subscription status and not a provider feature: it is an ordinary storefront product with a zero price, a 3-day period, `autoRenew = false`, and a COPY binding to a trial template plan Denys keeps in DRAFT. A zero-price purchase skips the payment provider entirely: the subscription is created `ACTIVE` with `provider = FREE` and `currentPeriodEnd = now + 3 days`, the enrollment side effects run as for any purchase, and the athlete lands on the web timetable. Expiry closes access like a one-off period. One trial per account by the `(userId, productId)` uniqueness; repeat trials on fresh emails are accepted as Denys's call. Web-only until the App-Store listing returns (SB-12).
- **Rationale.** `SubscriptionStatus.TRIAL` was removed because a trial modelled as a status leaks into every FSM branch; as a product it costs one enum value and one branch in the purchase path, and Denys can create, price and retire trials from the admin without a developer — the storefront stays fully his.
- **Links.** D-4, D-5, D-11 Q10; `domain-model.md` §4 (FREE); plan 1.2 / 3.1.

### D-14 — Every dev server, test run and migration rehearsal targets the local Docker stack; dev Neon is a read-only reference

- **Status:** RATIFIED (owner 2026-09-24 — «нужно будет развернуть локальный стек в докере, чтобы вся тестовая работа происходила против локального стека»; built and verified 2026-09-25).
- **Decision.** `docker-compose.yml` (project `tdp-platform`, `postgres:17-alpine`, `127.0.0.1:5432`, 512 MB) with three databases: `tdp` for the dev servers and manual tests, `tdp_test` for the api-server suite, `tdp_shadow` for `prisma migrate dev`. `task stack:*` and `task test:api` pass `DATABASE_URL` on the command line, so a task can never drift to whatever `.env` holds (Prisma's dotenv and `process.loadEnvFile` never override an exported variable). The env files carry the local URLs with the Neon dev line commented above them; `.env.example`, README, DEPLOY, ADR-0026 and ADR-0042 point at `docs/runbooks/local-stack.md`. Postgres 17 rather than CI's 16: production Neon is 17.5 and migration rehearsals restore production dumps into the stack, which PG16 `pg_restore` cannot read; CI's 16 stays as the floor (SB-15).
- **Rationale.** Billing work rehearses paths that mutate rows — declined renewals, grace expiry, cohort grants, webhook replays — and dev Neon is shared with preview deploys and already known for pooler flakes and idle drops. Locally the suite runs in 2 min 32 s instead of about ten minutes, which changes how often it gets run.
- **Amendment (2026-09-28, 0.3 review RF-22).** "Read-only reference" describes local work only: no dev server, test run or rehearsal targets dev Neon. Dev Neon stays the database of the Vercel previews and receives every migration by hand after the production apply, because nothing applies it there automatically (`docs/runbooks/db-migrate-dispatch.md`, "After the deploy").
- **Links.** plan 0.0; `docs/runbooks/local-stack.md`; deferred SB-14, SB-15; journal 2026-09-25.

### D-15 — `Price.autoRenew` is the offer, `Subscription.autoRenew` is the choice

- **Status:** RATIFIED (owner 2026-09-28, contour of step 0.3 — «по 2 и 3 ок»).
- **Decision.** `Price.autoRenew = true` means the auto-renewing form is offered for this price, so checkout offers both forms of D-5; `false` means the price is sold only as a one-off paid period (the D-13 trial, the self-paced programs of D-4). `Subscription.autoRenew` records which form the buyer chose.
- **Rationale.** The ratified sketch carries the same boolean on both models, and ADR-0044 §4 says every price is sold both ways while D-13 and D-4 describe prices that are not. Read as "offer" on the price and "choice" on the subscription, all four texts agree, and the admin gets one checkbox instead of a second price type.
- **Links.** `domain-model.md` §1, §4; ADR-0044 §4; D-4, D-5, D-13; `step-0.3-prompt.md`.

### D-16 — The W0 migration refuses rather than guesses

- **Status:** RATIFIED (owner 2026-09-28, with the 0.3 contour).
- **Decision.** The first statement of `storefront_billing_w0` is a guard that raises when the database holds a `ONE_TIME` price, any subscription row or any transaction row; `MONTHLY` and `YEARLY` prices convert to `1 MONTH` and `1 YEAR` with `autoRenew = true`, and the currency of an existing row is never touched. A rehearsal on a clone of a production snapshot is a merge gate.
- **Rationale.** A one-time price has no period, and a Stripe-era subscription or transaction has no provider: any conversion would be an invention written into production. Production on 2026-09-28 holds 4 products, 4 active `MONTHLY` / `USD` prices, no Stripe ids, no subscriptions and no transactions, so the guard passes today and protects against a row added before the apply.
- **Verified mechanics (Prisma 6.1.0, Postgres 17.10).** A migration file without transaction-control statements applies atomically; a `RAISE EXCEPTION` surfaces verbatim in `migrate deploy`; an explicit `BEGIN; … COMMIT;` around the file masks the error, and the inner pair Prisma emits around an enum swap commits everything before it. The migration therefore carries no transaction control at all.
- **Links.** charter "Sacred"; `docs/runbooks/local-stack.md`; `step-0.3-prompt.md`; journal 2026-09-28.

### D-17 — No `walletId` column, plain `cardToken`, nullable `priceId`

- **Status:** RATIFIED (planner ruling inside the owner-approved contour, 2026-09-28).
- **Decision.** The wallet id sent to Monobank is the platform `userId`, so no column stores it. `Subscription.cardToken` is plain text. `Subscription.priceId` is nullable, and a CHECK constraint keeps it mandatory for every provider except `MANUAL`. `Transaction` is unique on `(provider, providerTxId, kind)` instead of `providerTxId` alone.
- **Rationale.** A stored wallet id can only drift from the user it belongs to. The card token is a bearer scoped to our merchant token; encrypting it with a sibling environment key in the same process adds no boundary. A comp or a cohort grant has no price, and a fake price reference would corrupt the answer to "what did they pay". A Monobank refund lives on the original invoice id, so the refund row shares `providerTxId` with the payment it reverses.
- **Revisit at 0.5 (0.3 review RF-4b, SB-19).** The rationale weighed theft of the stored value and missed the log path: Postgres prints the failing row in the detail of a CHECK or NOT NULL violation, and that text reaches Prisma's error message, the application log and the server log. The same token sits in the raw webhook body the ledger stores. The column stays text either way, so nothing in W0 changes; the owner decides at 0.5 between encryption at rest, redaction, or both.
- **Links.** D-3, D-9; `monobank-notes.md` §0.2 spike; `step-0.3-prompt.md`.

### D-18 — W0 ships as expand (0.3) then contract (0.3b)

- **Status:** RATIFIED (b) — owner 2026-09-28, at the triage gate of the 0.3 internal review: «ок, делаем всё по твоим рекомендациям».
- **Fork.** (a) One destructive migration in the 0.3 PR, as the approved contour said. (b) Step 0.3 expands and converts and keeps `app_products.stripeProductId`, `app_prices.interval`, `app_prices.stripePriceId` and the `PriceInterval` type, dead but declared; the production apply is dispatched on the PR branch before the merge (`gh workflow run db-migrate.yml --ref <branch>`); step 0.3b drops the dead columns once 0.3 is live.
- **Decision.** (b).
- **Rationale.** A merge starts the Vercel builds and `db-migrate.yml` at the same moment and nothing orders them. Prisma selects columns by name, so under (a) either the old code meets a schema without the columns it selects, or the new code meets a schema without the columns it needs, on the public storefront and in the admin. The window is minutes when both pipelines are healthy and unbounded when the migration fails or waits. Under (b) the old code never notices the expand, and a failed apply happens before any code ships. The cost is one six-statement PR.
- **The price of (b), named by the 0.3 review (RF-3).** In the window between the dispatch and the deploy the old code does not fail, it writes: a price created or edited there lands beside the defaults of the new columns and no error says so. The cure is procedural — the catalog is frozen for the window and a consistency query runs before the merge and after the deploy (`docs/runbooks/db-migrate-dispatch.md`). A trigger or a dual write would be a bridge, and the initiative builds none.
- **Amendment (2026-09-29, independent review IR-1).** "Dead but declared" was not enough: a declared field is selected on every read and its static default is written on every create, so the code of 0.3 would have failed the moment 0.3b dropped the columns. The three fields carry `@ignore` from 0.3 on. That removes them from the generated client, needs no migration and leaves the drift check unchanged. Proven on a database with the columns already dropped.
- **Links.** `.github/workflows/db-migrate.yml`; `docs/runbooks/db-migrate-dispatch.md`; plan 0.3 / 0.3b; `step-0.3-prompt.md`; ADR-0044 (amended 2026-09-28).

### D-19 — While a migration is authored, the executor's databases live in a throwaway container

- **Status:** RATIFIED (planner ruling at the 0.3 plan gate, 2026-09-28; refines D-14).
- **Decision.** An executor that authors or iterates on a migration runs every database command — migrate, the suite, the scratch proofs — against its own throwaway Postgres container (`postgres:17-alpine`, 512 MB, a free port, the stack's init directory mounted so `tdp` / `tdp_test` / `tdp_shadow` exist). The shared stack receives the migration once, in its final form, from the planner before the owner's browser pass. The rehearsal on a clone of `prod_snap` is the planner's; the executor never opens the snapshot.
- **Rationale.** The stack is shared with the owner's parallel sessions. A migration that changes between review rounds leaves a checksum mismatch in `tdp` and `tdp_test`, and the only cure is a reset that wipes the owner's local data. The auto-mode classifier refused the executor's first attempt at a proofs script as a modification of a shared resource; the refusal was right about the risk.
- **Mechanics.** Task targets take the port as a variable after the task name (`task stack:migrate TDP_DB_PORT=<port>`); the environment-prefix form does not override a Taskfile variable.
- **Links.** D-14; `docs/runbooks/local-stack.md`; journal 2026-09-28 (plan gate).

### D-20 — `cardToken`: ciphertext under its own key, redacted from the ledger, never in stored error text

- **Status:** RATIFIED (owner 2026-09-29, contour of step 0.5 — «ок по всем рекомендациям»); amends D-17, closes the question SB-19 reopened.
- **Decision.** `Subscription.cardToken` stores AES-256-GCM ciphertext produced by the token cipher keyed by `BILLING_ENCRYPTION_KEY` — a key of its own, never `MOBILE_PUBLISH_ENCRYPTION_KEY`; the token is decrypted only in the process that charges or forgets the card. The webhook ledger stores the body with `walletData.cardToken` replaced by a fixed marker, and only after the signature was verified on the raw bytes: the stored copy is for audit, never for re-verification, and a replayed ledger event never writes `cardToken`. `BillingWebhookEvent.error` and every log line carry our own message and codes, never the text of a Prisma or Postgres error. The column stays `String?`. Step 0.5 lays the key, the generalized cipher and the billing instance; step 1.2 applies the redaction and the error rule at the ledger write.
- **Rationale.** D-17's argument stands: the token is a bearer scoped to our merchant token, so the stored value alone charges nothing. What D-17 missed is the log path (0.3 review RF-4b): Postgres prints the failing row in the detail of a constraint violation, that text reaches Prisma's message, Sentry and the Vercel logs, and a dump or a local restore (`prod_snap`) carries the column too. With ciphertext in the column every one of those surfaces carries a value that is useless without a second secret from a different store; the redaction covers the raw webhook body the ledger keeps, and the error rule covers the one place the row text could still be written on purpose. The cost is one environment variable and a call on write and on read.
- **Consequences.** `BILLING_ENCRYPTION_KEY` in the platform Vercel project and in the local env files before 1.1 (SB-39); no key rotation story, as for the mobile-publish key — a change of key re-encrypts every stored token by a script. `walletData.maskedPan` is not a secret and may be stored.
- **Amendment (2026-09-30, independent review of 0.5, IR-24).** The billing cipher instance binds the platform `userId` as associated data: `encryptCardToken(token, userId)` / `decryptCardToken(payload, userId)`. A ciphertext moved between two subscription rows (a database write, a copy bug) no longer decrypts, so a renewal can never charge another person's card from a swapped value. The mobile-publish instance passes no associated data and its stored format stays byte-identical (pinned by a known-answer test against the pre-0.5 cipher). Taken now because no row existed yet; later it would have needed a re-encryption script.
- **Links.** D-17; deferred SB-19, SB-39; `step-0.5-prompt.md`; `packages/api-server/src/endpoints/billing/README.md`.
