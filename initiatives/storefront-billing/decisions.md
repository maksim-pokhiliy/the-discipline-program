# storefront-billing — decisions

D-numbered ratified decisions. Step-level calls that don't merit a full ADR live here;
cross-initiative architecture calls go to `docs/adr/` (ADR-0044 is this initiative's).
**Promote here at every gate.** This file is the SSOT for "why."

**Status legend:** `RATIFIED` · `OPEN` · `SUPERSEDED`.

## Index

| ID   | Topic                                                                                         | Status   |
| ---- | --------------------------------------------------------------------------------------------- | -------- |
| D-1  | Monobank is the provider; the billing core is provider-agnostic (ADR-0044)                    | RATIFIED |
| D-2  | Subscription per PRODUCT, not per user; product binds 1..N plans; enrollment carries the sub  | RATIFIED |
| D-3  | Recurring mechanism: Mono native subscriptions vs own scheduler + tokenized MIT charges       | OPEN     |
| D-4  | Delivery lives on the product↔plan binding: JOIN or COPY; plans have no "kind"               | RATIFIED |
| D-5  | Two purchase forms per price (auto-renew, one-off period); cash is not a flow; MANUAL = comps | RATIFIED |
| D-6  | No pause                                                                                      | RATIFIED |
| D-7  | Access is resolved per enrollment in `authz/`; a lapse never edits the enrollment             | RATIFIED |
| D-8  | iOS soft wall = a synthetic program DTO with text, no link; sign-in stays open                | RATIFIED |
| D-9  | Cohort rollout: launch-day MANUAL grant until date X (default launch + 4 weeks)               | RATIFIED |
| D-10 | Fiscal basket in every invoice payload from day one; the fiscalization switch is Denys's      | RATIFIED |
| D-11 | Coach-side defaults (12 items sent to Denys 2026-09-23) stand unless he objects               | RATIFIED |
| D-12 | Ukrainian buyer-facing pages + an offer/requisites page are an acquiring precondition         | RATIFIED |
| D-13 | Trial = a zero-price 3-day product (provider `FREE`) bound COPY to a trial template plan      | RATIFIED |

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

- **Status:** PROPOSED (b) after the 0.2 spike (2026-09-25) — awaiting the owner's word; P1.3 is specced against (b).
- **Fork.** (a) Mono native subscriptions (`POST /api/merchant/subscription/create` → Mono schedules the charges; `edit` supports only `cancel` with an optional refund; `remove` only before the first payment). (b) Own scheduler: the first payment tokenizes the card (`saveCardData`), each period the platform cron issues `POST /api/merchant/wallet/payment` with `initiationKind: merchant`; every charge is an ordinary invoice (carries `merchantPaymInfo`), retries / grace / 4-week math are ours.
- **Decision.** (b). The spike proved the whole (b) loop in test mode: invoice with `saveCardData` → `walletData.cardToken` → three merchant-initiated charges, each a synchronous 200 `status: "success"` and an ordinary invoice afterwards; the token outlived a native subscription that had shared it. The D-3 lean condition for (a) («native subscriptions carry a fiscal basket AND expose retry semantics AND run in test mode») fails on two of three: (a) does run in test mode, but nothing documents or exposes its retry behaviour on a declined charge (only `summary.totalFailed` exists), and the create payload has no verified place for a fiscal basket. (a) also cannot change amount or interval, has no pause, and one-off periods would need invoices anyway — two charge paths for one product.
- **Consequences.** P1.3 = a cron (admin `vercel.json` already hosts one) that, per ACTIVE auto-renew subscription whose `currentPeriodEnd` has passed, issues one `wallet/payment` under a `RequestIdempotency`-style key, records the `Transaction`, and drives the FSM on the synchronous result (`success` → new period; anything else → PAST_DUE + grace per D-11 Q4); the webhook for the same invoice is a confirmation, not the trigger. Card lifecycle (expiry, `DELETE wallet/card` on cancel-at-period-end) is ours. `initiationKind: "client"` (3DS `tdsUrl`) is reserved for a customer-present "pay now" button, not for renewals. Native `subscription/*` stays a reference in `monobank-notes.md`; no adapter method wraps it.
- **Still to capture before P1.2/0.5 lock** (SB-14 tunnel): the invoice webhook body + `x-sign` for the 0.5 fixture, and what a merchant-initiated charge's webhook looks like; a declined-charge simulation in test mode is unknown (notes open item 7) — the FSM branch for it is table-tested, not provider-tested, until prod soak.
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
- **Links.** plan 0.0; `docs/runbooks/local-stack.md`; deferred SB-14, SB-15; journal 2026-09-25.
