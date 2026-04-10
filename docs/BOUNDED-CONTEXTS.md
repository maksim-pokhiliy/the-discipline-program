# Bounded Contexts

- **Status:** Draft — first cut of the context map for the repo. Living document.
- **Date:** 2026-04-10
- **Audience:** Anyone touching `packages/contracts`, `packages/api-server`, or the route handlers in the three apps.
- **Scope:** The five bounded contexts that exist in the codebase today (CMS, LMS, Coaching, IAM, Billing), the aggregates and invariants inside each one, how they depend on each other, and where each context lives vs. where it should live.

## Why this document exists

The project already has a de-facto domain boundary — `schema.prisma` groups models by concept, `packages/contracts/src/entities/` contains 21 entity folders, and the code routinely talks about "admin CMS", "the platform", "coach dashboard". But there is no written context map. Readers are forced to infer the boundaries from file names, and file names group by **consumer** (who calls the code) rather than by **domain** (what the code is about). The two groupings collide in several places, which is why it is hard to answer questions like:

- "Is `Product` a CMS concern or a billing concern?"
- "Does `CoachActionItem` belong to LMS or to its own subdomain?"
- "Where should the Stripe webhook handler live when we add it?"
- "Can `apps/marketing` safely import from `@repo/api-server`, and if so, from which part?"

This file answers those questions. It is the reference point for the context-first reorganization tracked by section 1.2 of `docs/BIGTECH-AUDIT.md`. The intended reader uses this document to decide, for any new feature or refactor, which context a piece of code belongs to and which other contexts it is allowed to depend on.

## The five contexts at a glance

```
                ┌──────────────┐
                │     IAM      │  ← User, Account, Session, Upload
                └──────┬───────┘
                       │ everyone has a User
            ┌──────────┼──────────┬──────────┐
            ▼          ▼          ▼          ▼
      ┌─────────┐  ┌───────┐  ┌────────┐  ┌─────────┐
      │   CMS   │  │  LMS  │  │ Coach. │  │ Billing │
      │ (mktg)  │  │(plans,│  │(profile│  │(products│
      │ content │  │workout│  │ notes, │  │,prices, │
      │ + forms)│  │,logs) │  │action  │  │subscrip.│
      │         │  │       │  │items,  │  │,trans.) │
      │         │  │       │  │dashb.) │  │         │
      └────┬────┘  └───┬───┘  └───┬────┘  └────┬────┘
           │           ▲          │            │
           │           │          │            │
           │           └──────────┘            │
           │     Coaching reads LMS state      │
           │     to compute dashboards         │
           │                                   │
           └────────► Product is a shared ◄────┘
                       entity with two
                       facets: CMS view
                       and Billing view
```

- **IAM** sits under everything. Every other context assumes a `User` exists and has a stable ID.
- **CMS** is the marketing surface — landing page content, blog posts, reviews, contact-form inbox. Mostly read on `apps/marketing`, mostly written on `apps/admin`.
- **LMS** is the training product — training plans, workouts, workout logs, enrollments, benchmarks. Almost entirely owned by `apps/platform`.
- **Coaching** sits on top of LMS and IAM. It does not own workout data — it consumes it. Coaching owns coach-athlete relationships, notes, action items, and the coach dashboard read model.
- **Billing** exists only in `schema.prisma` today. No contracts, no API, no UI. It is the one context where we still have a clean window to get the design right before any code is written against it.

The rest of this document describes each context in detail: what it owns, which invariants protect it, which other contexts it depends on, where it lives today, and where it should live after section 1.2 closes.

---

## 1. IAM — Identity, Access, and Media

**Responsibility:** Who the user is, how they prove it, and what media assets they can upload. IAM is the authentication + authorization + storage boundary. Every other context takes `userId: string` as a given and trusts that IAM already validated it.

### Aggregates and entities

| Aggregate / entity  | Prisma model        | Role                                                                                              |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `User` (root)       | `User`              | Identity, role, timezone, soft-delete. Email is the natural key.                                  |
| `Account`           | `Account`           | NextAuth OAuth link table. Currently unused (credentials-only, see ADR 0004) but schema-reserved. |
| `Session`           | `Session`           | NextAuth DB session rows. Not actively used because JWT strategy is in effect (ADR 0012).         |
| `VerificationToken` | `VerificationToken` | NextAuth email verification scaffolding. Reserved.                                                |

`Account`, `Session`, and `VerificationToken` are NextAuth adapter tables. They are required by the adapter contract but not part of the current authentication flow. They stay in IAM because they describe **how identity is proved**, not anything about the domain.

**Upload** (`adminUploadApi` → `@vercel/blob`) is currently bolted onto IAM because (a) only admins can upload and (b) there is nowhere else for it to live. This is temporary. Section 1.4.A moves upload behind a storage port, and at that point "Storage" becomes its own supporting context rather than part of IAM. For now it stays here.

### Value objects

- `Role` (`USER | COACH | ADMIN`) — authorization primitive. The only role hierarchy the system recognizes.
- `timezone: string` — stored as IANA string, but **not validated** (noted in audit section 3).
- `email: string` — stored lowercase by convention but not enforced.

### Invariants

- **Email is unique.** `User.email @unique`.
- **One user may have at most one `AthleteProfile` and at most one `CoachProfile`.** Enforced by `@unique` on `userId` in both profile tables. This is a cross-context invariant — the profiles themselves live in LMS (athlete) and Coaching (coach). IAM owns the uniqueness guarantee because the profiles key off `User.id`.
- **Soft-deleted users should not authenticate.** Enforced by the soft-delete extension in `packages/api-server/src/db/client.ts` on `findUnique` / `findFirst`. Note: audit section 5 flagged that the extension does not cover `count` / `update`, so the guarantee is incomplete.
- **Cannot remove the last admin.** Application-level check in `adminUsersApi.updateRole` — there is no DB constraint behind it. This is a rare case where the invariant cannot be expressed in SQL and must live in the service layer.

### Where it lives today

- **DB:** `User`, `Account`, `Session`, `VerificationToken`, and the role enum in `schema.prisma`.
- **Contracts:** `packages/contracts/src/entities/auth/`, `user/`, `upload/`.
- **API — `api-server`:** `endpoints/admin/users.ts` (admin user management), `endpoints/admin/upload.ts` (media upload), `endpoints/platform/users.ts` (athlete search inside coach flow), plus the service `services/auth.ts` used by both NextAuth instances.
- **Consumer apps:** all three. Each app has its own NextAuth route handler (`api/auth/[...nextauth]`) that proxies into `authService`.

### Dependencies

**None.** IAM does not import anything from the other four contexts. Every other context depends on `userId: string` coming from IAM, but IAM itself is self-contained. This is the correct direction — identity is the foundation.

### Target state (after 1.2)

Move the three contract folders (`auth`, `user`, `upload`) and the three endpoint files (`admin/users`, `admin/upload`, `platform/users`) under a new `iam/` subdirectory in both `contracts/src/entities/` and `api-server/src/endpoints/`. `upload` will migrate to a dedicated storage port during 1.4.A and leave IAM at that point.

---

## 2. CMS — Marketing Content and Inbound

**Responsibility:** Everything the marketing site renders, plus the inbox for contact-form submissions. This is a classic headless-CMS shape: the admin app writes structured content, the marketing app reads it and turns it into pages.

### Aggregates and entities

| Aggregate / entity              | Prisma model                 | Role                                                                                                                             |
| ------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `MarketingPage` (root)          | `MarketingPage`              | A static landing page — home, about, blog, contact, faq, storefront. Keyed by slug.                                              |
| `MarketingPageSection`          | `MarketingPageSection`       | Child entity of `MarketingPage`. Each page has a fixed list of section keys; the section payload is typed `Json`.                |
| `MarketingBlogPost` (root)      | `MarketingBlogPost`          | One blog article. Has publish/feature flags, category, tags, precomputed read time.                                              |
| `MarketingReview` (root)        | `MarketingReview`            | A customer review shown on the home page and storefront.                                                                         |
| `MarketingContactSubmission`    | `MarketingContactSubmission` | An inbound contact form submission. Append-only from public POST, triaged from admin.                                            |
| **`Product` (marketing facet)** | `Product`                    | **Shared with Billing.** The marketing facet uses slug, title, description, features, cover image, isFeatured, isActive. See §6. |

The marketing facet of `Product` is the only cross-context entity in the repo today. CMS reads `Product` to render the storefront grid and the contact form's program dropdown; it never writes the billing fields. Billing writes the billing fields; it never writes the marketing ones. This de-facto split is honored by the code but not enforced by the schema.

### Value objects

- `PageSlug` (`home | about | blog | contact | faq | storefront`) — enumerated in `contracts/pages`. Drives which page-section schemas are valid.
- `SectionKey` — string literal union per page, in `PAGE_SECTIONS_MAP`. Each section payload is validated by a dedicated Zod schema (`SECTION_SCHEMAS`).
- `MarketingBlogCategory` enum — fitness, nutrition, mindset, training, recovery, uncategorized.
- `ContactSubmissionStatus` — inbox triage state (new, in-progress, replied, closed).

### Invariants

- **Unique slug per page.** `MarketingPage.slug @unique`, `MarketingBlogPost.slug @unique`, `Product.slug @unique`.
- **One section of each kind per page.** `@@unique([pageSlug, section])` on `MarketingPageSection`. A page cannot have two "hero" sections.
- **Section payload must match its Zod schema.** Enforced at read time in `pagesApi.extractSectionData` via `SECTION_SCHEMAS[key].parse(...)`. This is an invariant that lives in the contract layer, not the DB — the DB stores the payload as untyped JSON (noted in audit section 2: "section `data` as untyped JSON without discriminated union").
- **At most one featured blog post / featured product at a time.** Enforced by `ensureExclusiveFeatured` / `toggleExclusiveFeatured` utilities inside `$transaction`. This is a mutable-invariant — not a DB constraint, so in principle a concurrent writer could break it, but the `updateMany` inside the same transaction closes the race for single-node Postgres.
- **Featured-post transition on publish.** A blog post being published for the first time gets `publishedAt = now()`. This is a `prepareCreateInput`/`updatePost` detail, not a DB default.
- **Read-time is derived, not authoritative.** `MarketingBlogPost.readTime` is computed from `content` word count during create/update. A hand edit to the raw column would be stale. Treat it as a cache.

### Where it lives today

- **DB:** `MarketingPage`, `MarketingPageSection`, `MarketingBlogPost`, `MarketingReview`, `MarketingContactSubmission`, and the `Product` model (shared with Billing). Physical prefix is `marketing_*` except for `Product` (`app_products`).
- **Contracts:** `packages/contracts/src/entities/pages/`, `blog/`, `review/`, `contact/`, `product/`.
- **API — `api-server`:** this is where the duplication is most visible. CMS lives in two parallel folders:
  - `endpoints/admin/blog.ts`, `contacts.ts`, `pages.ts`, `products.ts`, `reviews.ts` — admin CRUD side (authoring).
  - `endpoints/marketing/pages.ts`, `products.ts`, `reviews.ts`, `contact.ts` — marketing read side + public form submission.
  - Both folders read and write the same Prisma models. The only reason they are split is that they serve different HTTP consumers.
- **Consumer apps:** `apps/admin` (authoring, triage), `apps/marketing` (public rendering). `apps/platform` does not touch CMS.

### Dependencies

- **CMS → IAM:** the admin authoring side requires an authenticated admin session. The dependency is enforced by `withAdminAuth` on every admin CMS route handler. Public CMS read endpoints (`/api/public/*`) do not require authentication and do not depend on IAM at runtime, only at the contract level (they do not use `User`).
- **CMS → Billing:** CMS reads `Product` and `Price` to render the storefront and to populate the contact-form program dropdown. The read is restricted to the marketing facet of `Product` plus `Price.amountCents` / `currency` for display. This is the one cross-context read in the current codebase. See §6.

### Target state (after 1.2)

Collapse the `admin/` and `marketing/` parallel folders into a single `cms/` folder grouped by entity. Each entity gets its own subfolder with public-read, admin-write, and public-write handlers as siblings — not split across two directories. Example target shape:

```
api-server/src/endpoints/cms/
  blog/
    admin.ts        (create / update / delete / toggle featured)
    public.ts       (marketing read)
  contact/
    admin.ts        (triage)
    inbound.ts      (public form submission)
  pages/
    admin.ts
    public.ts
  review/
    admin.ts
    public.ts
  product-marketing/
    admin.ts
    public.ts
```

The `Product` model itself keeps its current physical shape; only the contracts and endpoints are split along the CMS / Billing line. See §6 for the split rule.

---

## 3. LMS — Learning Management System

**Responsibility:** The training product — plans, workouts, workout logs, enrollments, benchmarks. This is what users are paying for. The LMS is where the coach authors content and where the athlete consumes it.

### Aggregates and entities

| Aggregate / entity      | Prisma model          | Role                                                                                                                             |
| ----------------------- | --------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `TrainingPlan` (root)   | `TrainingPlan`        | A coach-owned plan with status lifecycle `DRAFT → ACTIVE → ARCHIVED`. Soft-deletable.                                            |
| `Workout`               | `Workout`             | Child of `TrainingPlan`. Has `scheduledDate`, `sortOrder`, `content` as rich text. Archivable per-workout.                       |
| `WorkoutLog` (root)     | `WorkoutLog`          | **Separate aggregate.** Immutable: created when an athlete logs a workout; deleted whole, never edited. Owns `notes` and `isRx`. |
| `PlanEnrollment` (root) | `PlanEnrollment`      | Coach-authorized athlete enrollment into a plan. Lifecycle `ACTIVE → PAUSED → COMPLETED`.                                        |
| `BenchmarkDefinition`   | `BenchmarkDefinition` | Shared reference data (e.g. "Fran", "1RM Back Squat"). Unique by name.                                                           |
| `UserBenchmark`         | `UserBenchmark`       | An athlete's personal best for a given definition. One row per `(userId, benchmarkDefinitionId)`.                                |

`WorkoutLog` is intentionally not a child of `Workout` — it is a separate aggregate root. This is why the "logs are immutable, deleted whole" rule is possible: the aggregate boundary cuts cleanly between the workout (which the coach owns and edits) and the log (which the athlete owns and cannot change). See the `Logs are Immutable` invariant in `CLAUDE.md`.

### Value objects

- `TrainingPlanStatus` (`DRAFT | ACTIVE | ARCHIVED`).
- `PlanEnrollmentStatus` (`ACTIVE | PAUSED | COMPLETED`).
- `isRx: boolean` on `WorkoutLog` — the factual-feedback primitive. Audit section 2 flagged that richer set/rep tracking is absent at the schema level and that `Workout.content` is plain text, so LMS cannot currently answer analytics questions below workout granularity.
- `scheduledDate: Date` (`@db.Date`, no time component). A plan scheduled on a specific day, independent of athlete timezone.

### Invariants

- **One log per athlete per workout.** `@@unique([userId, workoutId])` on `WorkoutLog` (`schema.prisma:288`). This is _the_ definition of "logs are immutable": if an athlete re-logs a workout, it is the same row updated, not a new row. In practice the code creates-only, never updates.
- **One enrollment per athlete per plan.** `@@unique([trainingPlanId, userId])` on `PlanEnrollment` (`schema.prisma:390`). An athlete cannot be enrolled in the same plan twice.
- **One user benchmark per definition.** `@@unique([userId, benchmarkDefinitionId])` on `UserBenchmark` (`schema.prisma:421`). Personal bests are singletons per definition.
- **Plan ownership.** Every `TrainingPlan` is owned by exactly one `CoachProfile` (foreign key `coachId`). A plan's author cannot change. Coach soft-delete cascades to plans (`onDelete: Cascade`). Note: cascade on soft delete is risky and is flagged in audit sections 3 and 5.
- **Plan archive lifecycle.** `TrainingPlanStatus` transitions are gated by `transitionPlanStatus` logic in `training-plans.ts`. `ARCHIVED` is terminal.
- **Workout archive vs plan archive.** `Workout.isArchived` is a per-workout boolean, distinct from `TrainingPlanStatus.ARCHIVED`. Audit section 2 flagged this as a domain inconsistency — two different archive mechanisms for two different things.
- **Benchmark definitions are shared reference data.** Unique by name (`BenchmarkDefinition.name @unique`), referenced by ID from `UserBenchmark`. `onDelete: Restrict` prevents accidental removal of a definition that has logged user benchmarks.

### Where it lives today

- **DB:** `TrainingPlan`, `Workout`, `WorkoutLog`, `PlanEnrollment`, `BenchmarkDefinition`, `UserBenchmark`, plus `AthleteProfile` which is logically half-LMS half-Coaching (see §4).
- **Contracts:** `training-plan/`, `workout/`, `workout-log/`, `plan-enrollment/`, `benchmark-definition/`, `user-benchmark/`.
- **API — `api-server`:** entirely in `endpoints/platform/`: `training-plans.ts`, `workouts.ts`, `workout-logs.ts`, `plan-enrollments.ts`, `benchmark-definitions.ts`, `user-benchmarks.ts`.
- **Consumer apps:** `apps/platform` exclusively. `apps/admin` does not currently read LMS state (the admin dashboard counts at the marketing level, not workout level).

### Dependencies

- **LMS → IAM:** every LMS aggregate references `User.id`. Authorization for write paths routes through `resolveCoachId` / `verifyPlanOwnership` in `endpoints/platform/guards.ts`, which are themselves IAM queries.
- **LMS → Coaching:** one-way via `TrainingPlan.coachId → CoachProfile.id`. LMS does not know about action items or dashboards — that is Coaching's concern.
- **LMS ⇄ Billing (planned):** `Product.trainingPlanId → TrainingPlan.id` creates an optional link from a billing product to the plan it unlocks. CLAUDE.md says "Purchase = Immediate Value": a product purchase auto-enrolls the athlete into the linked plan. This is a planned flow — the code does not yet implement it because Billing has no API. When Billing lands, the enrollment creation becomes a cross-context operation.

### Target state (after 1.2)

Move LMS endpoints into `endpoints/lms/` grouped by aggregate:

```
api-server/src/endpoints/lms/
  training-plan/
  workout/
  workout-log/
  plan-enrollment/
  benchmark-definition/
  user-benchmark/
```

Contracts move to `contracts/src/entities/lms/`. Subpath exports on `@repo/contracts` become `@repo/contracts/lms/training-plan` etc. `apps/platform` is the only legitimate consumer.

---

## 4. Coaching — Coach-Athlete Relationship

**Responsibility:** Everything the coach sees about the athletes they work with, _on top of_ LMS state. Coaching owns profiles (coach and athlete), notes, action items, and the coach dashboard read model. It does not own workout data — it queries it.

### Aggregates and entities

| Aggregate / entity                | Prisma model      | Role                                                                                                                               |
| --------------------------------- | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `CoachProfile` (root)             | `CoachProfile`    | Extends `User` with coach-specific fields (bio). Soft-deletable.                                                                   |
| `AthleteProfile`                  | `AthleteProfile`  | Extends `User` with athlete-specific fields (height, weight, health status). **Not soft-deletable.**                               |
| `CoachNote` (root)                | `CoachNote`       | Hard-deletable free-form text note about an athlete, written by a coach.                                                           |
| `CoachActionItem` (root)          | `CoachActionItem` | A coaching-workflow signal generated from LMS state: missed workouts, new athlete hasn't started, health report. Mutable `status`. |
| `CoachDashboardData` (read model) | _computed_        | Not a Prisma model — computed on each request from LMS + CoachActionItem state in `coach-dashboard.ts`.                            |

`AthleteProfile` logically belongs between LMS and Coaching: the coach reads it (coach view of athlete health) and the athlete writes it (athlete editing their own profile). It lives in Coaching because the coach is the primary reader and because the dashboard computations depend on `healthStatus`.

`CoachDashboardData` is a read-model — no backing table. Every request recomputes aggregations over `PlanEnrollment`, `Workout`, `WorkoutLog`, and `CoachActionItem`. Audit section 2 flagged this as a nascent CQRS-lite split that is currently ad-hoc.

### Value objects

- `HealthStatus` (`HEALTHY | INJURED | RESTRICTED`).
- `Gender` (`MALE | FEMALE`) — noted in audit section 2 as an intentional product decision that should be revisited.
- `ActionItemType` (`MISSED_WORKOUTS | NEW_NO_START | HEALTH_REPORT`).
- `ActionItemStatus` (`OPEN | RESOLVED`).
- `ActionItemSeverity` (`INFO | WARNING | CRITICAL`).
- `ActionItemResolveReason` (`AUTO_CONDITION_CLEARED | AUTO_ENROLLMENT_ENDED | MANUAL_CONTACTED`) — the distinction between human and automatic resolution.
- Adherence thresholds and priority maps in `coach-dashboard.constants.ts`.

### Invariants

- **One profile per user.** `CoachProfile.userId @unique`, `AthleteProfile.userId @unique`. A user can be both (rare), or one, or neither.
- **Action items are generated, not authored.** An action item exists because its condition existed at some point in LMS state. The `reconcile` pass (currently synchronous, triggered from the dashboard query) creates new items when a condition first appears and auto-resolves existing items when the condition clears. Audit section 1 flagged the lack of a background scheduler for this work.
- **Action item scoping.** `@@index([coachId, status, athleteId])` — every action item belongs to a coach-athlete pair. No global action items.
- **Coach notes are scoped to coach-athlete pairs.** `@@index([coachId, athleteId])`. There is no schema-level unique constraint, so a coach can have many notes about the same athlete.
- **Coach access to athlete data is mediated by active enrollment.** `verifyAthleteBelongsToCoach` in `guards.ts` checks that the athlete has an `ACTIVE` `PlanEnrollment` on one of the coach's plans. Audit section 3 flagged this as too restrictive — `PAUSED` or `COMPLETED` enrollments legitimately still need coach visibility.

### Where it lives today

- **DB:** `CoachProfile`, `AthleteProfile`, `CoachNote`, `CoachActionItem`. The action item type/status/severity/resolve-reason enums are defined here too.
- **Contracts:** `coach-profile/`, `athlete-profile/`, `coach-note/`, `coach-action-item/`, `coach-dashboard/`, `coach-athletes/`.
- **API — `api-server`:** all under `endpoints/platform/`: `coach-profile.ts`, `athlete-profile.ts`, `coach-notes.ts`, `coach-action-items.ts`, `coach-dashboard.ts`, `coach-athletes.ts` (+ `coach-athlete-detail.ts`, `coach-athletes-list.ts` as file splits), plus the shared guards in `guards.ts`.
- **Consumer apps:** `apps/platform` (coach area + athlete self-service for `AthleteProfile`).

### Dependencies

- **Coaching → IAM:** every coach/athlete is a `User`. Role `COACH` gates coach-area access (currently only per-endpoint, not in middleware — flagged in audit section 1.5).
- **Coaching → LMS:** heavy read dependency. The dashboard query pulls `PlanEnrollment`, `Workout`, `WorkoutLog` via a nested include (`enrollment-query.ts`). Action item reconciliation reads `Workout.scheduledDate` and `WorkoutLog.createdAt`. This is the primary cross-context data flow in the repo today.
- **Coaching ↛ CMS:** no dependency. Coach dashboards do not show marketing content.
- **Coaching ↛ Billing:** currently no dependency, but once Billing exists, subscription status will gate whether an athlete shows in a coach dashboard at all (via "Access = Subscription State" invariant).

### Target state (after 1.2)

Move Coaching endpoints to `endpoints/coaching/`:

```
api-server/src/endpoints/coaching/
  coach-profile/
  athlete-profile/
  coach-note/
  coach-action-item/
  coach-dashboard/
  coach-athletes/
  guards.ts       (shared Coaching guards — stay here, they are policy for this context)
```

The `enrollment-query.ts` helper that joins LMS data for the dashboard remains in `utils/` because it is a query-layer concern and crosses the LMS boundary deliberately.

---

## 5. Billing — Products, Prices, Subscriptions, Transactions

**Responsibility:** What users pay for, how much they pay, and the record of those payments. Billing exists only in `schema.prisma` today — no contracts, no API, no UI. This is both a gap (payments are unimplemented) and an opportunity (no retrofitting debt).

### Aggregates and entities

| Aggregate / entity            | Prisma model   | Role                                                                                                                               |
| ----------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **`Product` (billing facet)** | `Product`      | **Shared with CMS.** The billing facet uses `stripeProductId`, `trainingPlanId` (LMS link), `isActive`, and the `prices` relation. |
| `Price`                       | `Price`        | A price line item on a product — amount in cents, currency, interval. One product can have many prices (tiers, intervals).         |
| `Subscription` (root)         | `Subscription` | A user's current subscription state. **Singleton per user.** External ID = Stripe subscription ID (`sub_xxx`).                     |
| `Transaction`                 | `Transaction`  | An append-only payment attempt record. Keyed by provider transaction ID.                                                           |

### Value objects

- `Currency` (`USD | EUR | UAH`) — multi-currency enabled in the schema. Audit section 2 flagged that this doubles the complexity and needs an ADR.
- `PriceInterval` (`MONTHLY | YEARLY | ONE_TIME`).
- `SubscriptionStatus` (`TRIAL | ACTIVE | PAST_DUE | CANCELED`). The `Access = Subscription State` invariant (CLAUDE.md) says platform access requires `ACTIVE | TRIAL | PAST_DUE`.
- `TransactionStatus` (`PENDING | SUCCEEDED | FAILED`).
- `amountCents: Int` — the "Money is Integer" invariant (CLAUDE.md). Floats are forbidden in this context.

### Invariants

- **Singleton subscription per user.** `Subscription.userId @unique` — enforced at the DB. See ADR 0008 for the full reasoning.
- **Provider transaction ID is unique.** `Transaction.providerTxId @unique` — the payment provider's native idempotency. This is enforced at the DB.
- **Idempotency key is unique (when present).** `Transaction.idempotencyKey @unique` — partial idempotency for API-level retries. Audit section 3 flagged that this column is currently nullable and should be `NOT NULL` before any transaction write code is shipped.
- **Price active flag independent of product.** `Price.isActive` vs `Product.isActive` are independent booleans. A product can be marketed but its prices deprecated, or vice versa. Currently there is no coordination logic for this.
- **Subscription references a specific price.** `Subscription.priceId → Price.id` with `onDelete: Restrict`. You cannot delete a price that an active subscription points at.
- **Transaction → subscription is optional.** `Transaction.subscriptionId` is nullable (`onDelete: SetNull`). Preserves transaction history even if a subscription is removed, though subscription rows should never be hard-deleted in practice.
- **Product ↔ TrainingPlan link.** `Product.trainingPlanId → TrainingPlan.id` (optional, `onDelete: SetNull`). Used for "Purchase = Immediate Value": a purchase triggers an `ACTIVE` `PlanEnrollment` on the linked plan. Not yet wired.
- **Money is integer.** All monetary amounts are `Int` in cents/kopeks. Enforced schema-wide. Audit section 11 noted that `centsToAmount` is the only conversion helper and it currently lives in `@repo/shared`.

### Where it lives today

- **DB:** `Product`, `Price`, `Subscription`, `Transaction`, plus the four supporting enums. All prefixed `app_*`.
- **Contracts:** `packages/contracts/src/entities/product/` covers the marketing facet only. There is **no contract entity** for `Price`, `Subscription`, or `Transaction`. The billing facet of `Product` has no schemas either.
- **API — `api-server`:** nothing. No Billing endpoints exist in any of the three endpoint folders. `@vercel/blob` is the only payment-adjacent integration, and that is storage, not payments.
- **Route handlers:** no `/api/.../billing/*`, no `/api/webhooks/stripe`, no `/api/webhooks/*` at all.
- **Consumer apps:** the marketing and platform apps have billing UI stubs. The admin app does not administer billing (no subscription management, no refund flow).

### Dependencies

- **Billing → IAM:** every `Subscription` and `Transaction` keys off `userId`.
- **Billing → LMS:** `Product.trainingPlanId` links a billing product to the LMS plan it unlocks. This is a reference, not a reverse lookup. LMS does not know about Billing.
- **Billing → CMS:** none. CMS reads `Product` for storefront display; that is a CMS → Billing read, not the other way around.
- **Billing → external (Stripe):** implicit in the schema. ADR 0014 backfills this as the de-facto payment provider decision. A webhook handler is the missing piece.

### Target state (after 1.2 and later sections)

Create the missing pieces top-down:

1. **Split `Product` contract into two facets.** `contracts/src/entities/cms/product-marketing/` (title, description, features, slug, cover image, isFeatured) and `contracts/src/entities/billing/product-billing/` (stripeProductId, trainingPlanId, isActive, prices). The Prisma model stays single; the contracts enforce the split.
2. **Add missing billing contracts.** `billing/price/`, `billing/subscription/`, `billing/transaction/`.
3. **Add `endpoints/billing/`**, initially empty, with a README placeholder describing the target shape (`subscription/`, `transaction/`, `webhook/`).
4. **Add `endpoints/billing/webhook/stripe.ts`** when Stripe goes in — with signature verification, idempotency via `providerTxId`, and transactional enrollment creation.
5. **Tighten `Transaction.idempotencyKey` to `NOT NULL`** before any code is written against it (audit section 3).

Until steps 1–3 are done, `endpoints/billing/` stays empty and acts as a placeholder reminding contributors that Billing is a recognized context.

---

## 6. Shared entities: the Product model

`Product` is the only entity in the repo that lives in two contexts simultaneously. The table holds both marketing fields and billing fields, and both contexts legitimately read and write it.

The current schema:

```prisma
model Product {
  id              String   @id @default(cuid())
  slug            String   @unique      // ← CMS
  title           String                 // ← CMS
  description     String                 // ← CMS
  features        String[]               // ← CMS
  trainingPlanId  String?                // ← Billing (unlocks LMS plan)
  stripeProductId String?   @unique      // ← Billing
  isFeatured      Boolean   @default(false)  // ← CMS
  isActive        Boolean   @default(true)   // ← Billing (gates checkout)
  prices          Price[]                // ← Billing
  ...
}
```

**How to decide which context owns a read or a write.** The rule is: **does the operation affect money or plan-unlock?** If yes, it is Billing. If no, it is CMS.

- Writing `title` or `features` → CMS (authoring content).
- Writing `stripeProductId` or creating a `Price` → Billing (authoring commerce).
- Writing `isFeatured` → CMS (storefront display order).
- Writing `isActive` → Billing (gates checkout; a deactivated product should never be purchaseable).
- Reading the marketing storefront → CMS (shows title, features, cover image).
- Reading the billing catalog → Billing (shows price, currency, interval, active state).

In the target state, the same Prisma model has two contract facets and two endpoint subfolders:

- `contracts/src/entities/cms/product-marketing/` — marketing-facing schema, no billing fields.
- `contracts/src/entities/billing/product-billing/` — commerce-facing schema, no marketing description prose.
- `endpoints/cms/product-marketing/` — admin authoring of marketing fields + public storefront read.
- `endpoints/billing/product-billing/` — admin management of prices, Stripe link, webhook-driven updates.

The Prisma model does not split. The contracts and the API do. This keeps the schema simple and the contexts clean.

---

## 7. Cross-context invariants

A few invariants span contexts. They do not belong to any single context and are listed here explicitly.

| Invariant                       | Enforced where                                                                                 | Status                                                                                               |
| ------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Access = Subscription State** | Planned: Billing `SubscriptionStatus` gates every LMS / Coaching read.                         | Not implemented. `apps/platform` does not currently check subscription state before serving content. |
| **Purchase = Immediate Value**  | Planned: Billing webhook creates `PlanEnrollment` atomically on successful first transaction.  | Not implemented. Enrollments are currently created manually by coaches.                              |
| **Shared Exercise Library**     | Planned: read access for all authenticated users, write restricted to `ADMIN` and `COACH`.     | `BenchmarkDefinition` matches this shape. Exercise catalog as a whole is not yet modeled (audit 2).  |
| **Logs are Immutable**          | Application convention (`workoutLogs` is create + delete only). No DB-level enforcement.       | De-facto honored. Could be strengthened by a Postgres rule or an application-layer write guard.      |
| **Reference Data Integrity**    | `UserBenchmark.benchmarkDefinitionId` has `onDelete: Restrict`. Applies to any reference data. | Enforced at the DB for benchmarks. Exercises will need the same when added.                          |
| **Money is Integer**            | Every monetary field is `Int @db.Integer`. No `Float` / `Decimal` on money.                    | Enforced schema-wide.                                                                                |
| **Singleton Subscription**      | `Subscription.userId @unique`. ADR 0008.                                                       | Enforced at the DB.                                                                                  |

These are the rules a newcomer needs to know within the first hour of reading the codebase. Audit bullet 2.5 will turn this table into a standalone `docs/INVARIANTS.md` once all invariants have been catalogued.

---

## 8. Dependency rules — what is allowed to import what

This is the authoritative direction graph. The next audit bullet (1.3.A) will encode these rules in `dependency-cruiser`.

```
IAM        →   (leaf, depends on nothing)
LMS        →   IAM
Coaching   →   IAM, LMS
CMS        →   IAM, Billing   (read-only: storefront reads Product + Price)
Billing    →   IAM, LMS       (reference: Product.trainingPlanId)
```

**Forbidden directions:**

- `IAM → any`. IAM is a leaf.
- `LMS → Coaching`. LMS must not know about action items or coach dashboards.
- `LMS → CMS`. LMS must not read marketing content.
- `LMS → Billing`. LMS does not check subscription state directly; the check happens in an upstream guard.
- `Coaching → CMS`, `Coaching → Billing`. Coaching does not render marketing content or manage subscriptions.
- `CMS → LMS`, `CMS → Coaching`. Marketing surface does not read training data or dashboards.
- `Billing → CMS`, `Billing → Coaching`. Commerce does not read marketing content or coach state.

**The only cross-context writes that are allowed:**

- Billing → LMS on purchase success (creates a `PlanEnrollment`). This is a write that has to be atomic with the transaction being recorded. It lives in a Billing endpoint but touches an LMS aggregate. It is the single exception and the reason it exists is the `Purchase = Immediate Value` invariant.

Every other cross-context interaction is a read. Reads are preferable to writes because they do not require distributed transactions.

---

## 9. De-facto non-leak: why this document can be written at all

A context map is only useful if it reflects reality. At the start of the audit, the following was verified by grep and by reading every endpoint file:

- `apps/marketing` imports only `pagesApi` and `contactApi` from `@repo/api-server`. Both are CMS-only. No LMS, no Coaching, no Billing, no IAM writes.
- `apps/admin` imports admin CMS endpoints (`adminBlog`, `adminPages`, `adminContacts`, `adminProducts`, `adminReviews`), admin IAM (`adminUsers`, `adminUpload`), and the admin analytics dashboard (`adminDashboard`). No LMS, no Coaching. No Billing.
- `apps/platform` imports platform LMS endpoints (`platformTrainingPlans`, `platformWorkouts`, `platformWorkoutLogs`, `platformPlanEnrollments`, `platformBenchmarkDefinitions`, `platformUserBenchmarks`), platform Coaching endpoints (`platformCoachProfile`, `platformAthleteProfile`, `platformCoachNotes`, `platformCoachActionItems`, `platformCoachDashboard`, `platformCoachAthletes`), and platform IAM (`platformUsers`). No CMS. No Billing.

**There are zero cross-context leaks between apps and the intended context for each app.** The codebase is already disciplined — but the discipline is enforced by convention (nobody has written a cross-context import yet) rather than by structure. This document and the work in sections 1.2–1.3 will turn convention into structure: subpath exports in `@repo/contracts`, context subfolders in `api-server/endpoints/`, and a `dependency-cruiser` gate that fails CI on a violation.

It is easier to lock in correct behavior that already exists than to fix incorrect behavior that has spread. That is why this work lands now and not in six months.

---

## 10. Open questions to resolve in later bullets

Items flagged during the context-mapping pass that do not belong to any single bullet yet:

- **`CoachActionItem` reconciliation has no scheduler.** Audit 1.5 and 7 flagged this. Reconciliation currently runs synchronously when a coach opens the dashboard — inefficient and means "missed workout" signals only appear when a coach looks, not when the miss happens. Needs a job queue.
- **`enrollment-query.ts` is the cross-boundary read between Coaching and LMS.** It lives in `utils/` today. After the reorg it should move to `coaching/` (it is a Coaching read-model helper, not a generic util).
- **Coach access via `PlanEnrollmentStatus.ACTIVE` only is too narrow.** See `verifyAthleteBelongsToCoach`. A paused enrollment is still the coach's concern.
- **Product split: when to split the Prisma model itself.** The current plan is to split contracts only, not the schema. If the two facets diverge further — separate lifecycles, separate audit logs, separate owners — a schema split may eventually be justified. Out of scope for 1.2.
- **Where does the Stripe webhook live.** A webhook is an inbound, not an outbound; it is a Billing handler. But it also writes to LMS (enrollment). The handler file goes in `endpoints/billing/webhook/` and calls into an LMS-aware service. That service is the single place where the Billing → LMS write rule is exercised.
- **`@repo/shared` split.** `centsToAmount` is a Billing primitive that lives in `shared`. Audit 1.4.B moves it to `contracts/common/money`. Similar primitives will be pulled out of `shared` as their owning context is clarified. Tracked separately.

---

## 11. How to use this document

- **When you add a new endpoint,** identify which context it belongs to first. If it does not fit any of the five contexts above, pause — you may be inventing a new context, and that is a conversation worth having.
- **When you add a new contract entity,** put it in the target folder (`contracts/src/entities/<context>/<entity>/`) if 1.2.B has landed; otherwise put it in the flat list and tag it in your PR description with the intended context. This keeps the reorganization frictionless.
- **When you find a cross-context import that is not explicitly allowed in §8,** treat it as a bug and file it against audit section 1.2 or 1.3. Do not rationalize it — the rules are finite and tight on purpose.
- **When product decisions change** (e.g., multiple concurrent subscriptions per user become a requirement), update the affected section here **before** writing code. The document is the intent; the code is the proof.

## References

- `docs/BIGTECH-AUDIT.md` — section 1.2 tracks the context reorganization work.
- `docs/adr/0005-contracts-first-with-zod.md` — the contract-first discipline this context map reinforces.
- `docs/adr/0007-prisma-client-isolated-in-api-server.md` — the rule that puts all Prisma code in one package, which is what makes per-context endpoint reorganization possible.
- `docs/adr/0008-singleton-subscription-invariant.md` — the canonical example of a context-owned invariant enforced at the DB.
- `docs/adr/0010-bff-via-http-loopback-for-rsc.md` — the reason context-to-context reads go over HTTP today and why that might change.
- `CLAUDE.md` section "Global Invariants" — the codified system laws referenced throughout §7.
- `packages/api-server/prisma/schema.prisma` — the physical data reality every context projects from.
