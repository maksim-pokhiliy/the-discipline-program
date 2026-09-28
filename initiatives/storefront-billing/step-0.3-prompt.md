# Step 0.3 — W0 billing schema: the expand migration and the price shape (storefront-billing P0.3)

Invoke the `/feature` skill with everything below as its argument (calibre: **full**) and
run its pipeline: research → plan (STOP at the plan gate and report to the PLANNER session
that spawned you — not the repo owner) → implement → internal review (STOP at review-flow's
triage gate with the report; the ruling arrives as a follow-up message) → PR. This file is
skill INPUT, not a plan override; where it pins a live-verified fact, trust it over
guessing, and verify anchors against the tree.

## Mission

ADR-0044 replaces the Stripe-shaped billing fingerprint with a provider-agnostic core: a
subscription per (user, product), products bound to training plans with a JOIN / COPY
delivery, prices = amount + period + auto-renew. No endpoint reads or writes billing state
yet. This step lays the schema under everything that follows (0.5 port and adapter, the P1
state machine, the webhook ledger, the access gate) and moves the ONE live consumer of the
old shape — the product price in the admin console and on the public storefront — onto the
new one.

One delivery PR, four deliverables:

1. Prisma schema W0 and ONE migration, `storefront_billing_w0`: expand, convert, guard.
2. The price shape everywhere it is consumed: contracts → api-server → admin → marketing.
3. Database invariant tests for the new constraints.
4. The documents that describe the billing schema.

Not yours: the production apply, and the contract migration that physically drops three
dead columns (step 0.3b, planner-run, after this step is live).

## Read before planning

- `initiatives/storefront-billing/{charter.md,domain-model.md,decisions.md}` — Sacred list,
  the ratified model, D-2 / D-4 / D-5 / D-7 / D-13 / D-14.
- `docs/adr/0044-monobank-provider-and-subscription-per-product.md`,
  `docs/adr/0042-adopt-prisma-migrate.md`.
- `docs/planner-discipline.md` (a)–(i); `docs/runbooks/local-stack.md`.
- `docs/BOUNDED-CONTEXTS.md` §5, §7, §8, §10; `.dependency-cruiser.cjs` (the `billing` and
  `cms` rules).
- The consumer inventory below — every file, verbatim, before you plan the change.

## Live-verified facts (2026-09-28 — AUTHORITATIVE)

**Production reality** (read from a local restore of a production dump, billing tables
only): 4 products, all live and active, none with `stripeProductId`; 4 prices, one active
price per product, ALL `MONTHLY` / `USD`, none with `stripePriceId`; `app_subscriptions` 0
rows; `app_transactions` 0 rows; `lms_plan_enrollments` 15 rows; 43 tables in `public`; the
last applied migration is `20260821093030_mobile_legacy_identity_imported_password_hash`.

**How Prisma applies a migration** (Prisma 6.1.0, Postgres 17.10, probed on scratch
databases in the local stack):

- A `migration.sql` with NO transaction-control statements applies atomically. A failing
  statement leaves nothing behind except the failed `_prisma_migrations` row.
- A `RAISE EXCEPTION` inside a `DO` block surfaces verbatim in `migrate deploy` output
  (`Database error code: P0001`, `ERROR: <your message>`).
- Wrapping the script in an explicit `BEGIN; … COMMIT;` MASKS the real error: the output
  becomes `current transaction is aborted, commands ignored until end of transaction block`.
- An inner `BEGIN; … COMMIT;` block — the shape Prisma generates around an enum swap —
  commits everything before it. A later failure then leaves a half-applied migration.
- A failed migration blocks every later `migrate deploy` until
  `prisma migrate resolve --rolled-back <name>`.

**Baseline drift.** On `main` today this command prints exactly two lines, a comment and
`CREATE EXTENSION IF NOT EXISTS "citext";` — a known artefact of `0_init`, not yours:

```bash
pnpm --filter @repo/api-server exec prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url postgres://postgres:postgres@localhost:5432/tdp_shadow \
  --script
```

**Deploy topology.** A merge to `main` starts the Vercel builds of the three apps and
`.github/workflows/db-migrate.yml` (push + paths filter on `prisma/migrations/**`) at the
same moment, and nothing orders them. Prisma selects columns by name, so code that still
selects a dropped column fails, and code that selects a column not yet added fails. The
marketing pages that render products use `export const revalidate = 300`.

**Consumers of the price shape** (complete, by grep on `@repo/contracts/cms/product`,
`prices`, `interval`):

- contracts: `packages/contracts/src/entities/cms/product/{product.constants.ts,
product.schema.ts,product.types.ts,product-api.schema.ts,product-api.types.ts,index.ts}`;
  `packages/contracts/src/entities/cms/pages/pages-api.schema.ts` composes `productSchema`.
- api-server: `src/mappers/cms/{enum-maps.ts,product.mapper.ts,index.ts}`;
  `src/endpoints/cms/product/{admin.ts,public.ts,admin.test.ts,admin.empty.test.ts,
public.empty.test.ts}`; `src/endpoints/cms/dashboard/admin.ts` (`formatPriceSubtitle`);
  `src/endpoints/cms/pages/public.ts` (three `include: { prices }` reads);
  `prisma/seed/clear-all.ts`; `src/test/helpers.ts` (`createTestProduct`, no price).
- admin: `src/modules/products/components/{product-form.tsx,product-form-schema.ts,
to-product-api-data.ts}`; `views/product-edit-view/product-edit-form.tsx`;
  `views/product-create-view/index.tsx`; `sections/products-list-section/index.tsx`;
  `src/app/api/admin/products/**/route.ts`; `src/lib/api/endpoints/products.ts`;
  `src/lib/hooks/use-products.ts`.
- marketing: `src/lib/components/ui/{product-card.tsx,product-modal.tsx,
lead-form-modal.tsx}`; `src/lib/hooks/use-product-modal.ts`;
  `src/lib/seo/structured-data.ts` (reads title and description only).
- platform, storybook, `@repo/ui`, `@repo/query`, `@repo/api-client`: no consumer.

**Registration files, current state.** `packages/contracts/src/common/index.ts` exports
`api-error`, `image`, `money`, `params`, `timezone`. `packages/api-server/src/mappers/cms/
index.ts` exports `blog.mapper`, `contact.mapper`, `enum-maps`, `product.mapper`,
`review.mapper`. `@repo/contracts` and `@repo/shared` do not depend on each other.

**Period labels.** `new Intl.NumberFormat(locale, { style: "unit", unit, unitDisplay:
"long" })` on Node 24 gives `4 weeks`, `3 days`, `1 month` for `en-US` and `4 тижні`,
`3 дні`, `1 місяць` for `uk-UA`; `formatToParts` yields `integer`, `literal`, `unit`, so
the unit word alone is available for a count of one.

**Hooks and CI.** pre-commit = `check-secrets` + `lint-staged`; pre-push = `dep:check` +
`turbo run lint check-types --filter="...[origin/main]"`; commit-msg = commitlint. CI runs
the suite on `postgres:16-alpine` after `migrate deploy` + seed; no CI job checks drift.
`main` requires six green checks: Build, Dependency boundary check, Format check, Lint,
Tests, Type check.

**Local stack (D-14).** Container `tdp-platform-db`, `postgres:17-alpine`, databases `tdp`
(dev servers), `tdp_test` (api-server suite), `tdp_shadow` (shadow), `prod_snap` (the
production restore). `task stack:migrate` applies pending migrations to `tdp` and
`tdp_test`; `task test:api` runs the api-server suite against `tdp_test`.

## Planner rulings this step is built on

- **D-15 (owner, ratified).** `Price.autoRenew` means "the auto-renewing form is offered for
  this price": `true` → checkout offers both forms (D-5); `false` → one-off only (the D-13
  trial, self-paced programs of D-4). `Subscription.autoRenew` is the form the buyer chose.
- **D-16 (owner, ratified with the contour).** The migration refuses rather than guesses.
  A guard block runs first and raises if the database holds a `ONE_TIME` price, any
  subscription row or any transaction row. No faithful conversion exists for those.
- **D-17 (planner).** No `walletId` column: the wallet id sent to the provider is the
  platform `userId`. `cardToken` is stored as plain text: it is a bearer scoped to our
  merchant token, and encrypting it with a sibling environment key adds no boundary.
  `Subscription.priceId` is nullable, because a `MANUAL` grant has no price; a CHECK keeps
  it mandatory for every other provider.
- **D-18 (planner, proposed to the owner).** Expand now, contract later. This migration
  adds and converts; it does NOT drop `app_products.stripeProductId`,
  `app_prices.interval`, `app_prices.stripePriceId` or the `PriceInterval` type, because
  the code running in production at apply time still selects them. They stay declared in
  `schema.prisma`, dead, and step 0.3b drops them once this step is live. The production
  apply of this migration is dispatched on the PR branch BEFORE the merge.

## Deliverable 1 — schema and migration

### Target schema (final state of every touched model)

```prisma
model Product {
  id              String         @id @default(cuid())
  slug            String         @unique
  title           String
  description     String
  features        String[]
  stripeProductId String?        @unique
  isFeatured      Boolean        @default(false)
  isActive        Boolean        @default(true)
  prices          Price[]
  plans           ProductPlan[]
  subscriptions   Subscription[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  deletedAt       DateTime?

  @@index([createdAt, title])
  @@index([deletedAt])
  @@index([isActive])
  @@index([isFeatured])
  @@map("app_products")
}

model ProductPlan {
  id        String       @id @default(cuid())
  productId String
  product   Product      @relation(fields: [productId], references: [id], onDelete: Cascade)
  planId    String
  plan      TrainingPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  delivery  PlanDelivery
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  @@unique([productId, planId])
  @@index([planId])
  @@map("app_product_plans")
}

model Price {
  id            String         @id @default(cuid())
  productId     String
  product       Product        @relation(fields: [productId], references: [id], onDelete: Cascade)
  amountCents   Int
  currency      Currency       @default(UAH)
  periodCount   Int            @default(4)
  periodUnit    PeriodUnit     @default(WEEK)
  autoRenew     Boolean        @default(true)
  interval      PriceInterval  @default(MONTHLY)
  stripePriceId String?        @unique
  isActive      Boolean        @default(true)
  subscriptions Subscription[]

  @@index([productId, isActive])
  @@map("app_prices")
}

model Subscription {
  id                     String             @id @default(cuid())
  userId                 String
  user                   User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  productId              String
  product                Product            @relation(fields: [productId], references: [id], onDelete: Restrict)
  priceId                String?
  price                  Price?             @relation(fields: [priceId], references: [id], onDelete: Restrict)
  provider               BillingProvider
  providerSubscriptionId String?            @unique
  cardToken              String?
  status                 SubscriptionStatus
  autoRenew              Boolean
  currentPeriodStart     DateTime
  currentPeriodEnd       DateTime
  graceEndsAt            DateTime?
  canceledAt             DateTime?
  endedAt                DateTime?
  createdAt              DateTime           @default(now())
  updatedAt              DateTime           @updatedAt
  transactions           Transaction[]
  enrollments            PlanEnrollment[]

  @@unique([userId, productId])
  @@index([createdAt])
  @@index([status, currentPeriodEnd])
  @@index([productId])
  @@index([priceId])
  @@map("app_subscriptions")
}

model Transaction {
  id             String            @id @default(cuid())
  userId         String
  user           User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  subscriptionId String?
  subscription   Subscription?     @relation(fields: [subscriptionId], references: [id], onDelete: SetNull)
  provider       BillingProvider
  kind           TransactionKind
  amountCents    Int
  currency       Currency
  status         TransactionStatus
  providerTxId   String
  idempotencyKey String            @unique
  periodStart    DateTime?
  periodEnd      DateTime?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  @@unique([provider, providerTxId, kind])
  @@index([createdAt])
  @@index([userId, status])
  @@index([subscriptionId])
  @@map("app_transactions")
}

model BillingWebhookEvent {
  id          String          @id @default(cuid())
  provider    BillingProvider
  eventKey    String
  payload     Json
  receivedAt  DateTime        @default(now())
  processedAt DateTime?
  error       String?

  @@unique([provider, eventKey])
  @@index([receivedAt])
  @@index([processedAt])
  @@map("app_billing_webhook_events")
}

enum BillingProvider {
  MONOBANK
  MANUAL
  FREE
}

enum PlanDelivery {
  JOIN
  COPY
}

enum PeriodUnit {
  DAY
  WEEK
  MONTH
  YEAR
}

enum TransactionKind {
  INITIAL
  RENEWAL
  ONE_OFF
  REFUND
}

enum SubscriptionStatus {
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED
}
```

Additive edits to three more models, nothing else in them changes:

- `User`: `subscription Subscription?` becomes `subscriptions Subscription[]`.
- `TrainingPlan`: add `productPlans ProductPlan[]`.
- `PlanEnrollment`: add `subscriptionId String?`, `subscription Subscription?
@relation(fields: [subscriptionId], references: [id], onDelete: SetNull)`,
  `@@index([subscriptionId])`.

`Currency`, `TransactionStatus`, `PriceInterval`, `RequestIdempotency` stay as they are.
Naming is ratified; propose a change at the plan gate only with a reason from the tree.

### Two invariants Prisma cannot express (raw SQL in the same migration)

- `app_prices_period_count_check`: `CHECK ("periodCount" >= 1)`.
- `app_subscriptions_price_required_check`: `CHECK ("provider" = 'MANUAL' OR "priceId" IS
NOT NULL)`.

Precedent: `0_init` folds `chk_review_rating` and `plan_enrollment_unique_active` the same
way. Prisma's diff does not see CHECK constraints, so they add no drift.

### Migration law

1. One migration directory, `<UTC timestamp>_storefront_billing_w0`. Generate the body with
   the `migrate diff` command above, then edit by hand. Do not use interactive
   `migrate dev`.
2. NO transaction-control statement anywhere in the file. Remove the `BEGIN;` / `COMMIT;`
   pair Prisma emits around the `SubscriptionStatus` swap. The whole file must stay one
   implicit transaction.
3. Remove the `citext` statement the diff emits. The file carries this step's DDL only.
4. The guard is the FIRST statement: a `DO` block that counts `ONE_TIME` prices,
   subscription rows and transaction rows, and raises one exception naming all three
   counts when any is above zero. Message in plain English, stating what to do: convert or
   remove the rows by hand, then `migrate resolve --rolled-back`.
5. Price conversion: add the three columns, then set `periodCount = 1` and `periodUnit` =
   `MONTH` for `MONTHLY`, `YEAR` for `YEARLY` on EVERY existing row, `autoRenew = true`.
   No pre-existing row may keep the column default of 4 weeks. `currency` of existing rows
   is never touched; only the column default moves to `UAH`.
6. Nothing is dropped from `app_products` or `app_prices`, and `PriceInterval` stays (D-18).
   The reshape of `app_subscriptions` and `app_transactions` may be destructive: both are
   empty by the guard and no code, old or new, reads them.
7. `SubscriptionStatus` loses `TRIAL` and gains `EXPIRED` through the create-new-type swap.
8. The file must apply unchanged on Postgres 16 (CI) and 17 (stack, production).

## Deliverable 2 — the price shape in code

Bridge-free in code: after this step nothing outside `schema.prisma` and
`prisma/migrations/` references `stripeProductId`, `stripePriceId`, `PriceInterval` or
`PRICE_INTERVAL_*`, and no TypeScript reads `interval` on a price.

- **Contracts.** A common value object `packages/contracts/src/common/period.ts`:
  `PeriodUnit` enum (`DAY | WEEK | MONTH | YEAR`), `periodSchema` (`periodCount` integer
  1..365, `periodUnit`), and a `formatPeriod(period, locale)` formatter built on
  `Intl.NumberFormat` unit formatting — a count of one renders the unit word alone
  (`month`), any other count renders `4 weeks`. Register it in `common/index.ts`. In
  `cms/product`: `priceSchema` carries `periodCount`, `periodUnit`, `autoRenew` instead of
  `interval`; `createProductPriceSchema` defaults are `UAH`, `4`, `WEEK`, `true`;
  `PriceInterval` and `PRICE_INTERVAL_LABELS` are deleted. My lean on the formatter's home
  is contracts, next to the enum it needs; if the tree argues for `@repo/shared`, say so at
  the plan gate. No new dependency between workspace packages either way.
- **api-server.** `PERIOD_UNIT_MAP` replaces `PRICE_INTERVAL_MAP`; `mapToPrice` maps the
  three fields; `cmsProductAdminApi.create` / `.update` write them (the in-place update of
  the active price stays as it is today); `formatPriceSubtitle` renders the period through
  `formatPeriod`; `clearAll` deletes the new tables in an order the foreign keys accept
  (`Subscription.productId` is `Restrict`).
- **Admin.** The Pricing card of the product form: amount, currency (default `UAH`),
  period length (number, minimum 1, default 4), period unit (default weeks), and a
  checkbox for the auto-renew offer (default on). The amount adornment is a hard-coded `$`
  today; make it follow the selected currency. The edit form loads the stored values. The
  list column shows the price with its period. MUI floating labels, one component per
  file, no hex outside the theme.
- **Marketing.** The card and the modal render `/<period>` through `formatPeriod` with
  `DEFAULT_LOCALE`. A zero amount keeps today's rendering; the trial presentation is a
  later step.

New user-facing strings, English, mine to word and the owner's to veto — list them in the
PR body: `Period length`, `Period unit`, `days` / `weeks` / `months` / `years`,
`Offer auto-renew`, helper `When off, this price is sold only as a one-off paid period.`

Run the planner-discipline (f) sweep yourself: every route handler, client endpoint, hook
and mapper call site that carries a `Product` or `Price`, read verbatim, named in the plan.

## Deliverable 3 — database invariant tests

In the api-server suite, against `tdp_test`, one test per constraint, each proving the
refusal and the legal neighbour:

- `(userId, productId)` unique on subscriptions: a second row for the same pair is refused;
  the same user on a second product is accepted (D-2).
- `app_subscriptions_price_required_check`: `MONOBANK` and `FREE` without a price are
  refused; `MANUAL` without a price is accepted.
- `app_prices_period_count_check`: zero and negative are refused.
- `(provider, providerTxId, kind)` unique on transactions: a `REFUND` beside an `INITIAL`
  on the same `providerTxId` is accepted; a second `INITIAL` is refused.
- `(provider, eventKey)` unique on webhook events.
- `(productId, planId)` unique on bindings; the same plan under two products is accepted.
- Deleting a subscription nulls `PlanEnrollment.subscriptionId` and keeps the enrollment;
  one subscription may feed several enrollments.
- Deleting a product with a subscription is refused (`Restrict`).

Plus unit tests for `formatPeriod` (both locales, count of one and above) and for the
contract schemas (bounds, defaults), and the product endpoint tests moved to the new
fields.

## Deliverable 4 — documents

`docs/BOUNDED-CONTEXTS.md` §5, §7, §8, §10 describe the W0 schema and name the three
columns that leave in 0.3b. `packages/api-server/src/endpoints/billing/README.md` and
`packages/contracts/src/entities/billing/README.md` describe the ADR-0044 shapes and drop
every Stripe reference. `docs/adr/0019-database-strategy-deferred-decisions.md` item 2
gets a one-line note that ADR-0044 and this migration retire the external subscription id.
`packages/api-server/src/infrastructure/payment/` is NOT touched (step 0.5).

## Mutation-invariant trace (planner-discipline (h)) — done, verify it against the tree

- `Subscription (userId, productId)` is an identity key, not an ordered column. No
  mutation reorders it. A repeat purchase updates the existing row (domain model §2). The
  one hazard is two first purchases racing: the purchase path (1.1 / 1.2) upserts and
  retries on P2002 / P2034. Nothing to build here.
- `ProductPlan (productId, planId)`: bindings are edited as a set; there is no order
  column.
- `BillingWebhookEvent (provider, eventKey)`: insert-first ledger; a duplicate is the
  signal "already received".
- `Transaction (provider, providerTxId, kind)`: every charge attempt is its own provider
  invoice; a refund lives on the original invoice id, hence `kind` in the key.
- `PlanEnrollment.subscriptionId`: an index, never a unique — a product with two plans
  feeds two enrollments from one subscription.

## Migration proofs (by execution, reported in the PR body)

Scratch databases inside the local stack container, dropped afterwards.

1. **Conversion.** A database migrated to the step before W0, seeded with `MONTHLY` and
   `YEARLY` prices in several currencies, then W0: every row converted as the law says,
   amounts, currencies and flags untouched.
2. **Guard, three times.** One scratch database per trigger (`ONE_TIME` price, a
   subscription row, a transaction row): `migrate deploy` fails with the guard's message,
   and the schema afterwards is byte-identical to the schema before.
3. **Production rehearsal.** `createdb -T prod_snap w0_rehearsal`, then `migrate deploy`
   against the clone. Expected: success; 4 prices at `1 / MONTH / autoRenew true`, `USD`
   and amounts unchanged; the four touched pre-existing tables match on their pre-existing
   columns; every other table is content-identical before and after (per-table digest over
   ordered rows); new tables empty; all 15 enrollments carry `subscriptionId` NULL.
4. **Drift.** After the migration the `migrate diff` command prints the two baseline lines
   and nothing else.

`prod_snap` holds real athlete data. Never write to it, never point a dev server or a test
run at it, and print nothing from it beyond counts, digests and the billing columns of the
price and product rows. If the harness refuses a command against it, do not look for
another route: report it and leave the rehearsal to the planner.

## Scope fence

- **Touch:** `packages/api-server/prisma/{schema.prisma,migrations/<new>,seed/clear-all.ts}`;
  `packages/api-server/src/{mappers/cms,endpoints/cms/product,endpoints/cms/dashboard}`
  and the new invariant tests; `packages/contracts/src/{common,entities/cms/product}`;
  `apps/admin/src/modules/products/**`; `apps/marketing/src/lib/components/ui/
{product-card,product-modal}.tsx`; the documents of deliverable 4.
- **Do NOT touch:** `initiatives/**`, `CLAUDE.md`, CI workflows, lockfiles,
  `packages/api-server/src/infrastructure/payment/**`, `packages/api-server/src/authz/**`,
  `endpoints/{lms,coaching,mobile-compat,iam}/**`, `apps/platform/**`, `docker-compose.yml`,
  `taskfile.dist.yml`. No new dependency.
- **Not in this step:** billing endpoints or billing contracts (0.5 / 1.1), the
  `PaymentPort` reshape (0.5), the access gate (1.1), plan-binding and multi-price admin UI
  (3.1), checkout (2.1), dropping the dead columns (0.3b).
- **Production is out of your hands.** Never read `.env.prod`, never connect to a remote
  database. The local stack and scratch databases only.

## Sacred (charter)

The iOS wire contract · prod data additive-only · athlete navigation stays free ·
dep-cruiser context rules (LMS, Coaching and the mobile shim stay Billing-blind; CMS
contracts must not import Billing contracts) · migrations through `prisma migrate` and
`db-migrate.yml`.

## Acceptance gates (verify yourself before the PR)

- `pnpm db:generate`, then `task stack:migrate`: the migration applies to `tdp` and
  `tdp_test`.
- The four migration proofs above, with their numbers.
- `task test:api` green against `tdp_test` (standing approval; fenced).
- `@repo/contracts` and `@repo/shared` projects green; any admin or marketing test that
  exists for the touched files green.
- `pnpm check-types`, `pnpm lint`, `pnpm dep:check`, `pnpm format:check` clean; `admin`
  and `marketing` build.
- Grep gate: `stripeProductId|stripePriceId|PriceInterval|PRICE_INTERVAL` has no hit
  outside `schema.prisma` and `prisma/migrations/`.
- The PR contains no file under `initiatives/` and no `CLAUDE.md`.
- PR body per the PR-body law, with the owner checklist AS CHECKBOXES:
  - [ ] admin, edit an existing product: amount, currency, period length, period unit and
        the auto-renew offer show the stored values
  - [ ] admin, create a product with the default price fields: `UAH`, 4 weeks, auto-renew
        offered; the amount adornment follows the currency
  - [ ] storefront card and modal: `/month` on a converted price, `/4 weeks` on a new one
  - [ ] admin dashboard activity line shows the period
  - [ ] before the merge: `db-migrate.yml` dispatched on this branch, green, production
        storefront and admin products page still load on the OLD code

## Standing constraints

- The repository is PUBLIC: no secrets, no athlete data, no production rows in any
  committed file; synthetic fixtures only.
- No comments in code; delete comments in regions you edit.
- Commitlint: lowercase subject, body lines at most 100 characters, long bodies through
  `git commit -F`; never `--no-verify`; no signatures or attribution lines anywhere.
- Branch `feat/storefront-billing-w0-schema` from `main`; one PR against `main`; the
  repository squash-merges, so never stack this branch on another.
- Commit at safe increments BEFORE spawning any subagent and re-verify file presence
  after every subagent round; nothing of value sits uncommitted while a subagent may be
  alive.
- Resource fence (WSL): every heavy command inside `systemd-run --user --scope -q
--slice=heavy.slice -p MemoryMax=4G -p MemorySwapMax=1G -- <cmd>`, builds with
  `NODE_OPTIONS=--max-old-space-size=3072` in the caller's environment, vitest
  `--maxWorkers=2`, turbo `--concurrency=2`, one heavy command at a time.
- End every turn declaring where you left the tree (branch, clean or dirty, last commit).

## Plan-gate report

Bring, each with your recommendation and never as an option list: the final migration SQL
in full; the home of `formatPeriod`; the admin Pricing card layout; the test file layout
for the invariants; the mechanics of the scratch-database proofs; every consumer the (f)
sweep found beyond the inventory above; anything in this file the tree contradicts.
