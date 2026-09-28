# Bounded Contexts

- **Status:** Draft — first cut of the context map for the repo. Living document.
- **Date:** 2026-04-10
- **Audience:** Anyone touching `packages/contracts`, `packages/api-server`, or the route handlers in the three apps.
- **Scope:** The five bounded contexts that exist in the codebase today (CMS, LMS, Coaching, IAM, Billing), plus the Storage supporting context.

## Why this document exists

The project already has a de-facto domain boundary — `schema.prisma` groups models by concept, `packages/contracts/src/entities/` contains entity folders, and the code routinely talks about "admin CMS", "the platform", "coach dashboard". This file is the canonical record of the context-first organization that landed across `packages/contracts/src/entities/` and `packages/api-server/src/endpoints/`. The intended reader uses this document to decide, for any new feature or refactor, which context a piece of code belongs to and which other contexts it is allowed to depend on.

## The five contexts at a glance

```
                ┌──────────────┐
                │     IAM      │  ← User, AthleteProfile, CoachProfile
                └──────┬───────┘
                       │ everyone has a User
            ┌──────────┼──────────┬──────────┐
            ▼          ▼          ▼          ▼
      ┌─────────┐  ┌────────┐  ┌────────┐  ┌─────────┐
      │   CMS   │  │  LMS   │  │ Coach. │  │ Billing │
      │ (mktg   │  │ (plan  │  │(profile│  │(products│
      │ content │  │ list + │  │ notes, │  │,prices, │
      │ + forms)│  │ enroll-│  │action  │  │subscrip.│
      │         │  │ ments) │  │items,  │  │,trans.) │
      │         │  │        │  │dashb.) │  │         │
      └────┬────┘  └───┬────┘  └───┬────┘  └────┬────┘
           │           ▲           │            │
           │           │           │            │
           │           └───────────┘            │
           │     Coaching reads LMS state       │
           │                                    │
           └────────► Product is a shared  ◄────┘
                       entity with two
                       facets: CMS view
                       and Billing view
```

- **IAM** sits under everything. Every other context assumes a `User` exists and has a stable ID.
- **CMS** is the marketing surface — landing page content, blog posts, reviews, contact-form inbox. Mostly read on `apps/marketing`, mostly written on `apps/admin`.
- **LMS** is the training surface — training plan metadata and athlete enrollments. Owned by `apps/platform`.
- **Coaching** sits on top of LMS and IAM. Coaching owns coach-athlete relationships, notes, action items, and the coach dashboard read model.
- **Billing** has its W0 schema in place (ADR-0044, migration `20260928120000_storefront_billing_w0`) but no billing endpoints yet. Its one live surface is the product price, which the admin edits and the storefront renders through CMS (§7).
- **Mobile-compat** (supporting, added 2026-08-07 by apex-sunset P1.1) serves the legacy Spring wire contract under `/api/v1/*` — and since the 2026-09-17 apex cutover the unmodified App-Store iOS app IS served by it at `thedisciplineprogram.com/api/v1/*`. It owns `MobileLegacyIdentity` (the legacy integer id ↔ `User` map) and the legacy catalogs as code constants. It reads IAM for credentials and Coaching for the publish snapshot; `.dependency-cruiser.cjs` denies it CMS and Billing. Deliberately disposable — it is deleted wholesale when the app is redesigned, so nothing else should grow to depend on it.

The rest of this document describes each context in detail: what it owns, which invariants protect it, which other contexts it depends on, and where it lives.

---

## 1. IAM — Identity and Access

**Responsibility:** Who the user is, how they prove it, and what they are allowed to do. IAM is the authentication + authorization boundary. Every other context takes `userId: string` as a given and trusts that IAM already validated it.

### Aggregates and entities

| Aggregate / entity | Prisma model | Role                                                             |
| ------------------ | ------------ | ---------------------------------------------------------------- |
| `User` (root)      | `User`       | Identity, role, timezone, soft-delete. Email is the natural key. |

### Value objects

- `Role` (`ATHLETE | COACH | HEAD_COACH | ADMIN`) — authorization primitive.
- `timezone: string` — stored as IANA string.
- `email: string` — stored lowercase by convention.

### Invariants

- **Email is unique.** `User.email @unique`.
- **One user may have at most one `AthleteProfile` and at most one `CoachProfile`.** Enforced by `@unique` on `userId` in both profile tables.
- **Soft-deleted users should not authenticate.** Enforced by the soft-delete extension in `packages/api-server/src/db/client.ts` on every read path.
- **Cannot remove the last admin.** Application-level check in `iamUserAdminApi.updateRole`.

### Where it lives today

- **DB:** `User` and the `Role` enum in `schema.prisma`.
- **Contracts:** `packages/contracts/src/entities/iam/auth/`, `iam/user/` (subpath exports `@repo/contracts/iam/*`).
- **API — `api-server`:** `endpoints/iam/users-admin.ts`, `endpoints/iam/users-search.ts`, `endpoints/iam/auth-service.ts`.
- **Consumer apps:** all three. Each app has its own NextAuth route handler that proxies into `iamAuthService`.

### Dependencies

**None.** IAM does not import anything from the other four contexts. Every other context depends on `userId: string` coming from IAM, but IAM itself is self-contained.

---

## 2. CMS — Marketing Content and Inbound

**Responsibility:** Everything the marketing site renders, plus the inbox for contact-form submissions. The admin app writes structured content, the marketing app reads it and turns it into pages.

### Aggregates and entities

| Aggregate / entity              | Prisma model                 | Role                                                                                                                |
| ------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `MarketingPage` (root)          | `MarketingPage`              | A static landing page — home, about, blog, contact, faq, storefront. Keyed by slug.                                 |
| `MarketingPageSection`          | `MarketingPageSection`       | Child entity of `MarketingPage`. Each page has a fixed list of section keys; the section payload is typed `Json`.   |
| `MarketingBlogPost` (root)      | `MarketingBlogPost`          | One blog article. Has publish/feature flags, category, tags, precomputed read time.                                 |
| `MarketingReview` (root)        | `MarketingReview`            | A customer review shown on the home page and storefront.                                                            |
| `MarketingContactSubmission`    | `MarketingContactSubmission` | An inbound contact form submission. Append-only from public POST, triaged from admin.                               |
| **`Product` (marketing facet)** | `Product`                    | **Shared with Billing.** The marketing facet uses slug, title, description, features, isFeatured, isActive. See §7. |

### Value objects

- `PageSlug` (`home | about | blog | contact | faq | storefront`).
- `SectionKey` — string literal union per page, in `PAGE_SECTIONS_MAP`.
- `MarketingBlogCategory` — fitness, nutrition, mindset, training, recovery, uncategorized.
- `ContactSubmissionStatus` — inbox triage state (new, in-progress, replied, closed).

### Invariants

- **Unique slug per page.** `MarketingPage.slug @unique`, `MarketingBlogPost.slug @unique`, `Product.slug @unique`.
- **One section of each kind per page.** `@@unique([pageSlug, section])`.
- **Section payload must match its Zod schema.** Enforced at read time via `SECTION_SCHEMAS[key].parse(...)`.
- **At most one featured blog post / featured product at a time.** Enforced inside `$transaction`.
- **Read-time is derived, not authoritative.** Computed from `content` word count during create/update.

### Where it lives today

- **DB:** `MarketingPage`, `MarketingPageSection`, `MarketingBlogPost`, `MarketingReview`, `MarketingContactSubmission`, and the `Product` model (shared with Billing).
- **Contracts:** `packages/contracts/src/entities/cms/pages/`, `cms/blog/`, `cms/review/`, `cms/contact/`, `cms/product/`, `cms/dashboard/`.
- **API — `api-server`:** all CMS lives under `endpoints/cms/`. Each entity is a subfolder with sibling admin-write and public-read files.
- **Consumer apps:** `apps/admin` (authoring, triage), `apps/marketing` (public rendering).

### Dependencies

- **CMS → IAM:** admin authoring side requires authenticated admin session.
- **CMS → Billing:** CMS reads `Product` and `Price` to render the storefront and to populate the contact-form program dropdown. See §7.

---

## 3. LMS — Training Plans and Enrollments

**Responsibility:** Training plan metadata, athlete enrollments onto plans, the per-plan calendar of weeks, and the athlete-facing read projections over that tree (the plan timetable). The plan list, the enrollment lifecycle, the plan-detail calendar viewport, the athlete-log write surface, and the athlete plan-timetable read ship; the richer library catalog is not yet part of the live system.

### Aggregates and entities

| Aggregate / entity    | Prisma model     | Role                                                                                                                                                                  |
| --------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------- |
| `TrainingPlan` (root) | `TrainingPlan`   | Coach-owned plan metadata: name, description, status lifecycle `DRAFT → ACTIVE → ARCHIVED`. Soft-deletable.                                                           |
| `PlanEnrollment`      | `PlanEnrollment` | Athlete enrollment onto a plan with `ACTIVE                                                                                                                           | PAUSED | REMOVED` lifecycle. Soft-deletable. |
| `Week`                | `Week`           | Lazily-materialized calendar slot under a plan, keyed by `(planId, startDate)`. Materializes on first note (or first `Day`); an absent row is the normal empty state. |

### Value objects

- `TrainingPlanStatus` (`DRAFT | ACTIVE | ARCHIVED`).
- `EnrollmentStatus` (`ACTIVE | PAUSED | REMOVED`).

### Invariants

- **Plan ownership.** Every `TrainingPlan` is owned by exactly one `User` via `creatorId`. Authorization routes through `verifyPlanOwnership` in `authz/guards.ts` (creator OR `ADMIN` / `HEAD_COACH`).
- **Plan archive lifecycle.** `TrainingPlanStatus` transitions are gated by the training-plan endpoint code. `ARCHIVED` is terminal until restored.
- **One active enrollment per `(plan, athlete)`.** Enforced by partial unique index `plan_enrollment_unique_active` on `(planId, athleteId) WHERE "deletedAt" IS NULL`.

### Where it lives today

- **DB:** `TrainingPlan`, `PlanEnrollment`, `Week`.
- **Contracts:** `packages/contracts/src/entities/lms/training-plan/`, `lms/plan-enrollment/`, `lms/week/`.
- **API — `api-server`:** `packages/api-server/src/endpoints/lms/training-plan/`, `endpoints/lms/plan-enrollment/`, `endpoints/lms/week/`, and `endpoints/lms/plan-timetable/` (the athlete-facing read projection — a derived view model, not a Prisma aggregate, scoped to the calling athlete's own enrollments). Ownership guards live in `packages/api-server/src/authz/guards.ts`.
- **Consumer apps:** `apps/platform` exclusively — the coach plan surfaces and the athlete plan timetable (`/athlete`). `apps/admin` does not currently read LMS state.

### Dependencies

- **LMS → IAM:** every LMS aggregate references `User.id`.
- **LMS → Coaching:** plan ownership is by `User`; LMS does not know about action items or coach dashboards.
- **LMS ⇄ Billing:** `ProductPlan` binds products to plans, and `PlanEnrollment.subscriptionId` points at the Billing `Subscription` behind an enrollment (null means coach-granted access). LMS code reads neither: the access gate in `authz/` is the only reader of billing state outside Billing (storefront-billing D-7).

---

## 4. Coaching — Coach-Athlete Relationship

**Responsibility:** Everything the coach sees about the athletes they work with, _on top of_ LMS state. Coaching owns profiles (coach and athlete), notes, action items, and the coach dashboard read model.

### Aggregates and entities

| Aggregate / entity                | Prisma model      | Role                                                                                                                                                                                      |
| --------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CoachProfile` (root)             | `CoachProfile`    | Extends `User` with coach-specific fields (bio). Soft-deletable.                                                                                                                          |
| `AthleteProfile`                  | `AthleteProfile`  | Extends `User` with athlete-specific fields (height, weight, health status). **Not soft-deletable.**                                                                                      |
| `CoachNote` (root)                | `CoachNote`       | Hard-deletable free-form text note about an athlete, written by a coach.                                                                                                                  |
| `CoachActionItem` (root)          | `CoachActionItem` | A coaching-workflow signal: health report flags, plus the `MISSED_WORKOUTS` slot (currently a no-op condition until the workout-log surface returns). Mutable `status`.                   |
| `CoachDashboardData` (read model) | _computed_        | Not a Prisma model — computed on each request from assignments + `CoachActionItem` state in `coach-dashboard.ts`.                                                                         |
| `ProfileAxis` (root)              | `ProfileAxis`     | Admin-managed GLOBAL training-classification catalog axis (`key` + `label` + ordered `values String[]`). No owner FK; hard-deletable. A catalog, not a coach-athlete relationship entity. |

### Value objects

- `HealthStatus` (`HEALTHY | INJURED | RESTRICTED`).
- `Gender` (`MALE | FEMALE`).
- `ActionItemType` (`MISSED_WORKOUTS | HEALTH_REPORT`).
- `ActionItemStatus` (`OPEN | RESOLVED`).
- `ActionItemSeverity` (`INFO | WARNING | CRITICAL`).
- `ActionItemResolveReason` (`AUTO_CONDITION_CLEARED | AUTO_ASSIGNMENT_ENDED | MANUAL_CONTACTED`).

### Invariants

- **One profile per user.** `CoachProfile.userId @unique`, `AthleteProfile.userId @unique`.
- **Action item scoping.** `@@index([coachId, status, athleteId])` — every action item belongs to a coach-athlete pair.
- **Coach access to athlete data is mediated by `CoachAthleteAssignment`.** `verifyAthleteBelongsToCoach` checks an active assignment row.

### Where it lives today

- **DB:** `CoachProfile`, `AthleteProfile`, `CoachAthleteAssignment`, `CoachNote`, `CoachActionItem`, `ProfileAxis`.
- **Contracts:** `packages/contracts/src/entities/coaching/`.
- **API — `api-server`:** `endpoints/coaching/` — `coach-profile.ts`, `athlete-profile.ts`, `coach-note.ts`, `coach-action-item.ts`, `coach-dashboard.ts`, `coach-athletes/{index,detail,list}.ts`, `profile-axis.ts` (the `ProfileAxis` catalog — admin CRUD via `profileAxisAdminApi`, coach read/create via `profileAxisPlatformApi.list`/`.create`, and athlete-gated read via `profileAxisPlatformApi.listForAthlete`, which returns only `binding=null` axes). The dashboard returns zero counts for the `workouts*` fields and an empty `progressBuckets` because the workout-log surface is not in the live system.
- **Consumer apps:** `apps/platform` (coach surfaces, plus the athlete profile screen reading the catalog via `GET /api/platform/athlete/profile-axes` → `profileAxisPlatformApi.listForAthlete`) and `apps/admin` (the "Profile Axes" CRUD module reads/writes `profileAxisAdminApi` via `@repo/api-server/coaching`). The admin profile-axes access is a file-precise exception in the `admin-coaching-only-via-user-detail-route` dep-cruiser rule — the three `app/api/admin/profile-axes/*` route files plus the pre-existing `users/[id]` route — NOT a blanket `apps/admin → Coaching` dependency.

### Dependencies

- **Coaching → IAM:** every coach/athlete is a `User`.
- **Coaching → LMS:** reads `TrainingPlan` and `PlanEnrollment` for plan counts on the dashboard.
- **Coaching ↛ CMS / Billing:** no dependency.
- **`apps/admin` → Coaching (consumer):** file-precise only — the `users/[id]` admin-user-view route and the three `profile-axes/*` catalog routes, admitted by `admin-coaching-only-via-user-detail-route`. Any other admin file importing coaching is a rule violation, not a silent weakening.

---

## 5. Billing — Products, Prices, Subscriptions, Transactions

**Responsibility:** What users pay for, how much they pay, and the record of those payments. The model is ADR-0044's: Monobank behind a provider-agnostic core, one subscription per user and product, and products bound to training plans. Its W0 schema is in place (migration `20260928120000_storefront_billing_w0`); no billing endpoint, billing contract or billing UI exists yet. D-numbers from here on refer to `initiatives/storefront-billing/decisions.md`.

> **Dead until step 0.3b (D-18).** W0 expands now and contracts later. `app_products.stripeProductId`, `app_prices.interval`, `app_prices.stripePriceId` and the `PriceInterval` enum are dead: no application code uses them, and they stay in the database and in `schema.prisma` only because the code running in production when W0 is applied still selects them. Step 0.3b drops them once W0 is live. The tables below leave them out.

### Aggregates and entities

| Aggregate / entity            | Prisma model          | Role                                                                                                                                                                                                                                                                        |
| ----------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Product` (billing facet)** | `Product`             | **Shared with CMS.** The billing facet is `isActive` plus three relations: `prices`, `plans` (the plan bindings) and `subscriptions`. See §7.                                                                                                                               |
| `ProductPlan`                 | `ProductPlan`         | Binds a product to a training plan with a `delivery`: `JOIN` enrolls the buyer into that plan, `COPY` clones the plan for the buyer and enrolls them into the copy (D-4). A product binds one or more plans.                                                                |
| `Price`                       | `Price`               | An offer on a product: `amountCents`, `currency`, a period (`periodCount` + `periodUnit`) and `autoRenew`. `Price.autoRenew` means the auto-renewing form is offered besides the one-off paid period; `false` sells the price as a one-off period only (D-15).              |
| `Subscription` (root)         | `Subscription`        | One user's access to one product: one row per `(userId, productId)` (D-2), with its `provider`, `status`, current period and grace, cancel and end dates. `Subscription.autoRenew` is the form the buyer chose (D-15). `priceId` is empty only for a `MANUAL` grant (D-17). |
| `Transaction`                 | `Transaction`         | An append-only record of one payment event with the provider; `kind` says whether it is the initial charge, a renewal, a one-off period or a refund. Keyed by `(provider, providerTxId, kind)` and by `idempotencyKey`.                                                     |
| `BillingWebhookEvent`         | `BillingWebhookEvent` | The ledger of inbound provider webhooks, keyed by `(provider, eventKey)`. An event is recorded before it is processed, so a repeated delivery hits the key.                                                                                                                 |

### Value objects

- `Currency` (`USD | EUR | UAH`).
- `PeriodUnit` (`DAY | WEEK | MONTH | YEAR`). With `periodCount` (1 to 365) it makes up a price's period; the contract twin is `Period` / `periodSchema` in `@repo/contracts/common`, rendered by `formatPeriod`.
- `BillingProvider` (`MONOBANK | MANUAL | FREE`). `MANUAL` is a comp or the cohort grant (D-5, D-9); `FREE` covers zero-price products such as the 3-day trial, whose checkout skips the payment provider (D-13).
- `PlanDelivery` (`JOIN | COPY`).
- `SubscriptionStatus` (`ACTIVE | PAST_DUE | CANCELED | EXPIRED`). A trial is a zero-price `FREE` product, not a status (D-13).
- `TransactionKind` (`INITIAL | RENEWAL | ONE_OFF | REFUND`).
- `TransactionStatus` (`PENDING | SUCCEEDED | FAILED`).
- `amountCents: Int` — the "Money is Integer" invariant.

### Invariants

- **One subscription per user and product.** `@@unique([userId, productId])` (D-2). Buying the same product again reuses the row: the status moves in place and `Transaction` rows keep the history.
- **A price unless the provider is `MANUAL`.** CHECK `app_subscriptions_price_required_check`: `"provider" = 'MANUAL' OR "priceId" IS NOT NULL` (D-17).
- **A period is 1 to 365 units long.** CHECK `app_prices_period_count_check`: `"periodCount" BETWEEN 1 AND 365`, the same bounds as `PERIOD_CONSTANTS` in the contract.
- **Price defaults have one source.** The column defaults (`UAH`, 4 weeks, auto-renew offered) equal `PRODUCT_PRICE_DEFAULTS` in `@repo/contracts/cms/product`, and a test in `endpoints/cms/product/admin.test.ts` keeps them equal.
- **One transaction per provider transaction and kind.** `@@unique([provider, providerTxId, kind])`: a Monobank refund lives on the invoice id of the payment it reverses (D-17).
- **Idempotency key is unique.** `Transaction.idempotencyKey @unique` and `NOT NULL`.
- **One webhook event per provider and event key.** `BillingWebhookEvent` `@@unique([provider, eventKey])`.
- **A plan binds to a product once.** `ProductPlan` `@@unique([productId, planId])`; the same plan may sit under several products.
- **Our own subscription id.** `Subscription.id` is a cuid; the provider's subscription id, when there is one, lives in `providerSubscriptionId @unique`.
- **Billing history pins the catalog.** `Subscription.productId` and `Subscription.priceId` are `ON DELETE RESTRICT`, so a product or a price with subscriptions cannot be hard-deleted. The admin product delete is a soft delete and never reaches this constraint.
- **Deleting a subscription never deletes an enrollment.** `PlanEnrollment.subscriptionId` is `ON DELETE SET NULL`, indexed but not unique: one subscription feeds every enrollment its product creates.
- **The card token stays on the server.** `Subscription.cardToken` is plain text: it is a bearer scoped to our merchant token, and encrypting it with a sibling environment key would add no boundary (D-17). It never leaves the server: no contract carries it and no log line prints it. There is no wallet column either, because the wallet id sent to Monobank is the platform `userId`.
- **Money is integer.** All monetary amounts are `Int` in cents/kopeks.

### Where it lives today

- **DB:** `Product` (billing facet), `ProductPlan`, `Price`, `Subscription`, `Transaction`, `BillingWebhookEvent`, the `PlanEnrollment.subscriptionId` column, and the enums above. Migration `20260928120000_storefront_billing_w0` laid them; its two CHECKs are hand-written SQL because Prisma cannot declare them. `packages/api-server/src/endpoints/billing/billing-schema.invariants.test.ts` proves each constraint against a real database.
- **Contracts:** the price shape lives in `packages/contracts/src/entities/cms/product/`, the period value object (`PeriodUnit`, `periodSchema`, `formatPeriod`) in `packages/contracts/src/common/`. `packages/contracts/src/entities/billing/` is a placeholder until step 0.5.
- **API — `api-server`:** no billing endpoint yet. The admin product form writes the active price through `endpoints/cms/product/admin.ts` (§7). The payment port in `infrastructure/payment/` is still a vendor-neutral hosted-checkout scaffold; step 0.5 reshapes it around the Monobank adapter.
- **Consumer apps:** the price only, through CMS: `apps/admin` (product form, list, dashboard activity) and `apps/marketing` (storefront card and modal).

### Dependencies

- **Billing → IAM:** every `Subscription` and `Transaction` keys off `userId`.
- **Billing → LMS:** `ProductPlan` references `TrainingPlan`, and `PlanEnrollment.subscriptionId` references `Subscription`. From step 1.2 a purchase enrolls the buyer (`JOIN`) or clones the plan and enrolls them into the copy (`COPY`). LMS code stays Billing-blind; the access gate lives in `authz/` (D-7).
- **Billing → external (Monobank):** through the payment port. ADR-0044 (supersedes the implicit Stripe decision of ADR 0014).

---

## 6. Storage — supporting context (file upload)

**Responsibility:** File upload and deletion for admin-authored media (blog cover images, marketing page hero backgrounds, product photos, review author avatars, profile pictures). Storage is a **supporting context**, not a domain context.

### What it owns

| Shape / symbol                     | Location                                                       | Role                                                          |
| ---------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------- |
| `UploadContext` (union)            | `contracts/src/entities/storage/upload/upload.types.ts`        | Names the kind of upload: `avatar`, `blog`, `marketing`.      |
| `UPLOAD_CONFIG`                    | `contracts/src/entities/storage/upload/upload.constants.ts`    | Per-context max size, allowed MIME types, storage-key prefix. |
| `uploadImageRequestSchema` + types | `contracts/src/entities/storage/upload/upload-api.schema.ts`   | Zod schema for the route-handler boundary.                    |
| `storageUploadAdminApi`            | `endpoints/storage/index.ts` (default via `defaultStorage` DI) | Admin-scoped upload/delete API.                               |
| `StoragePort`                      | `api-server/src/infrastructure/storage/port.ts`                | The interface — `put(key, file, options?)`, `delete(url)`.    |
| `createVercelBlobAdapter`          | `api-server/src/infrastructure/storage/vercel-blob-adapter.ts` | The only file in the repo that imports `@vercel/blob`.        |

### Dependencies

**None inbound from domain contexts.** Storage doesn't know what a `TrainingPlan` is, what a `BlogPost` is, or what a `User` is.

**Outbound:** depends only on `StoragePort` from `infrastructure/storage/`.

This is enforced mechanically by the dep-cruiser rule `api-server-storage-is-leaf` and `contracts-storage-is-leaf`.

### Invariants

- **Vendor isolation.** Exactly one file in the repo imports the vendor SDK: the adapter.
- **Upload config is contract-level.** `UPLOAD_CONFIG[context]` is the source of truth for file size limits and MIME allowlists.
- **`UploadContext` is a closed union.**

---

## 7. Shared entities: the Product model

`Product` is the only entity in the repo that lives in two contexts simultaneously. The table holds both marketing fields and billing fields, and the billing facet adds three relations: prices, plan bindings and subscriptions.

**How to decide which context owns a read or a write.** The rule is: **does the operation affect money?** If yes, it is Billing. If no, it is CMS.

- Writing `title` or `features` → CMS.
- Creating or editing a `Price` (amount, currency, period, auto-renew offer) → Billing.
- Binding a training plan to a product (`ProductPlan` and its delivery) → Billing.
- Writing `isFeatured` → CMS.
- Writing `isActive` → Billing.
- Reading the marketing storefront → CMS.
- Reading the billing catalog → Billing.

The Prisma model does not split. The contracts and the API do, with one exception until the billing admin ships in step 3.1: the admin product form writes the product's single active price through the CMS endpoint `endpoints/cms/product/admin.ts`, using the price shape of `@repo/contracts/cms/product`. Nothing writes `stripeProductId` (dead until step 0.3b, §5).

---

## 8. Cross-context invariants

| Invariant                                | Enforced where                                                                                                                                                                                                                                                                                       | Status                                                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Access = Subscription State**          | Planned: `resolveEnrollmentAccess` in `authz/` turns the subscription behind each enrollment into open or closed for the athlete reads (web timetable, session detail and access, the iOS shim). An enrollment without a subscription is coach-granted and open; coaches and admins are never gated. | Scheduled: storefront-billing step 1.1 (ADR-0044, D-7). W0 added `PlanEnrollment.subscriptionId`; nothing reads it yet. |
| **Money is Integer**                     | Every monetary field is `Int @db.Integer`. No `Float` / `Decimal` on money.                                                                                                                                                                                                                          | Enforced schema-wide.                                                                                                   |
| **Enrollment outlives its subscription** | `PlanEnrollment.subscriptionId` → `Subscription` is `ON DELETE SET NULL`, indexed but not unique: one subscription feeds every enrollment its product creates.                                                                                                                                       | Enforced at the DB since W0.                                                                                            |
| **Subscription per Product**             | `Subscription` is unique on `(userId, productId)` (D-2). It replaced the per-user key of ADR 0008.                                                                                                                                                                                                   | Enforced at the DB since W0; ADR-0008 superseded by ADR-0044.                                                           |

### Per-aggregate DB-enforced invariants

| Aggregate            | Invariant                                            | Constraint                                                              |
| -------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| User                 | One user per email                                   | `email @unique`                                                         |
| Subscription         | One subscription per (user, product)                 | `@@unique([userId, productId])`                                         |
| Subscription         | One subscription per provider subscription ID        | `providerSubscriptionId @unique`                                        |
| Subscription         | A price unless the provider is `MANUAL`              | CHECK `app_subscriptions_price_required_check`                          |
| MarketingPageSection | One section per page+section-name pair               | `@@unique([pageSlug, section])`                                         |
| Product              | One product per slug                                 | `slug @unique`                                                          |
| ProductPlan          | One binding per (product, plan)                      | `@@unique([productId, planId])`                                         |
| Price                | A period of 1 to 365 units                           | CHECK `app_prices_period_count_check`                                   |
| Transaction          | One transaction per (provider, provider TX ID, kind) | `@@unique([provider, providerTxId, kind])`                              |
| Transaction          | One transaction per idempotency key                  | `idempotencyKey @unique`                                                |
| BillingWebhookEvent  | One event per (provider, event key)                  | `@@unique([provider, eventKey])`                                        |
| MarketingBlogPost    | One post per slug                                    | `slug @unique`                                                          |
| MarketingPage        | One page per slug                                    | `slug @unique`                                                          |
| PlanEnrollment       | One active enrollment per (plan, athlete)            | partial unique index on `(planId, athleteId) WHERE "deletedAt" IS NULL` |

---

## 9. Dependency rules — what is allowed to import what

```
IAM        →   (leaf)
LMS        →   IAM
Coaching   →   IAM, LMS
CMS        →   IAM, Billing   (read-only, except the product form's price write, §7)
Billing    →   IAM, LMS
Storage    →   (leaf supporting context)
Mobile-compat → IAM, Coaching (planned, step 1.3)
```

**Forbidden directions:**

- `IAM → any`. IAM is a leaf.
- `LMS → Coaching`, `LMS → CMS`, `LMS → Billing`.
- `Coaching → CMS`, `Coaching → Billing`.
- `CMS → LMS`, `CMS → Coaching`.
- `Billing → CMS`, `Billing → Coaching`.
- `Storage → any domain`.
- `Mobile-compat → CMS`, `Mobile-compat → Billing`. It reads IAM for credentials today and will read Coaching in step 1.3 for the publish snapshot; CMS and Billing have no business in a disposable compat shim. Enforced by `api-server-mobile-compat-no-cms-billing`.

The foreign key from `PlanEnrollment.subscriptionId` into Billing does not open `LMS → Billing` for code: LMS code never reads the column, only the access gate in `authz/` does (D-7).

Every cross-context interaction is currently a read, apart from the product form's price write (§7). Reads are preferable to writes because they do not require distributed transactions.

---

## 10. Ubiquitous language — domain glossary

| Term                    | Context     | Definition                                                                                                                                                                                   | Not to be confused with                                                                                       |
| ----------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **User**                | IAM         | The identity record. Every person in the system is a User with a `Role`.                                                                                                                     | Athlete, Coach — those are role-specific profiles attached to a User                                          |
| **Athlete**             | Coaching    | A User with an `AthleteProfile`.                                                                                                                                                             | User — Athlete is a role, User is the identity                                                                |
| **Coach**               | Coaching    | A User with a `CoachProfile`.                                                                                                                                                                | Admin — Admin manages the business, Coach manages athletes                                                    |
| **TrainingPlan**        | LMS         | Coach-owned plan metadata with a lifecycle (DRAFT → ACTIVE → ARCHIVED).                                                                                                                      | Product — what an athlete buys; it binds one or more TrainingPlans through ProductPlan                        |
| **PlanEnrollment**      | LMS         | Active/paused/removed link between an athlete and a training plan.                                                                                                                           | CoachAthleteAssignment — that one binds coach to athlete                                                      |
| **Product**             | Billing/CMS | The public-facing purchasable item on the marketing site. Has a slug, features, prices, and one or more bound TrainingPlans.                                                                 | TrainingPlan — Product is what athletes buy, TrainingPlan is internal coach metadata                          |
| **ProductPlan**         | Billing     | The binding of a Product to a TrainingPlan. Its delivery says what a purchase does: JOIN enrolls the buyer into the plan, COPY clones the plan for the buyer and enrolls them into the copy. | PlanEnrollment — the binding says what a purchase does, the enrollment is what it did                         |
| **Price**               | Billing     | A specific monetary offer for a Product: amount in cents, currency, a Period, and whether the auto-renewing form is offered (`autoRenew`).                                                   | Subscription — `Price.autoRenew` is the offer, `Subscription.autoRenew` is the buyer's choice                 |
| **Period**              | Billing     | The length of time one price buys: a count from 1 to 365 of days, weeks, months or years. New prices default to 4 weeks.                                                                     | `PriceInterval` — the dead enum that step 0.3b drops                                                          |
| **Subscription**        | Billing     | One User's paid or granted access to one Product: one row per (User, Product), with a provider and a status (ACTIVE, PAST_DUE, CANCELED, EXPIRED) that changes in place.                     | PlanEnrollment — the enrollment is the athlete's place on a plan; the subscription decides whether it is open |
| **Transaction**         | Billing     | A single payment event with the provider: an initial charge, a renewal, a one-off period or a refund (PENDING → SUCCEEDED / FAILED).                                                         | BillingWebhookEvent — the provider's notification, not the payment itself                                     |
| **BillingWebhookEvent** | Billing     | An inbound provider webhook, recorded before it is processed. One row per (provider, eventKey), so a repeated delivery is recognized as already received.                                    | RequestIdempotency — that one dedupes client requests by `Idempotency-Key`                                    |
| **CoachActionItem**     | Coaching    | A system-generated task about an athlete (health report, missed-workouts slot).                                                                                                              | CoachNote — ActionItem is structured and has status, Note is free-text                                        |
| **CoachNote**           | Coaching    | Free-text note a coach writes about an athlete. No status, no lifecycle.                                                                                                                     | CoachActionItem — Note is observation, ActionItem is action                                                   |
| **MarketingPage**       | CMS         | A page on the public site (home, about, pricing). Content stored as JSON sections.                                                                                                           | —                                                                                                             |
| **Program**             | —           | **Not a term in the codebase.** Marketing copy may say "program" loosely. Do not use "Program" in code — use Product (billing/marketing).                                                    | TrainingPlan, Product                                                                                         |

---

## 11. How to use this document

- **When you add a new endpoint,** identify which context it belongs to first. If it does not fit any of the contexts above, pause — you may be inventing a new context, and that is a conversation worth having.
- **When you add a new contract entity,** put it in the correct context folder (`contracts/src/entities/<context>/<entity>/`) and add its subpath export to `packages/contracts/package.json`.
- **When you find a cross-context import that is not explicitly allowed in §9,** treat it as a bug. `.dependency-cruiser.cjs` enforces them in CI.
- **When product decisions change**, update the affected section here **before** writing code.

## References

- `docs/adr/0005-contracts-first-with-zod.md` — the contract-first discipline this context map reinforces.
- `docs/adr/0007-prisma-client-isolated-in-api-server.md` — the rule that puts all Prisma code in one package.
- `docs/adr/0008-singleton-subscription-invariant.md` — superseded by ADR-0044. It was the canonical example of a context-owned invariant enforced at the DB; W0 retired the per-user key it recorded (§8).
- `docs/adr/0010-bff-via-http-loopback-for-rsc.md` — the reason context-to-context reads go over HTTP today.
- `docs/adr/0044-monobank-provider-and-subscription-per-product.md` — the Billing model §5 describes: Monobank behind a payment port, a subscription per product, products bound to training plans.
- `initiatives/storefront-billing/decisions.md` — the storefront-billing decisions (D-2 to D-18) cited from §3 on.
- `CLAUDE.md` section "Global Invariants" — the codified system laws referenced throughout §8.
- `packages/api-server/prisma/schema.prisma` — the physical data reality every context projects from.
