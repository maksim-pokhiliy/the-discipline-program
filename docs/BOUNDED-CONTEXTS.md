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
- **Billing** exists only in `schema.prisma` today. No contracts, no API, no UI. It is the one context where we still have a clean window to get the design right before any code is written against it.

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

| Aggregate / entity              | Prisma model                 | Role                                                                                                                             |
| ------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `MarketingPage` (root)          | `MarketingPage`              | A static landing page — home, about, blog, contact, faq, storefront. Keyed by slug.                                              |
| `MarketingPageSection`          | `MarketingPageSection`       | Child entity of `MarketingPage`. Each page has a fixed list of section keys; the section payload is typed `Json`.                |
| `MarketingBlogPost` (root)      | `MarketingBlogPost`          | One blog article. Has publish/feature flags, category, tags, precomputed read time.                                              |
| `MarketingReview` (root)        | `MarketingReview`            | A customer review shown on the home page and storefront.                                                                         |
| `MarketingContactSubmission`    | `MarketingContactSubmission` | An inbound contact form submission. Append-only from public POST, triaged from admin.                                            |
| **`Product` (marketing facet)** | `Product`                    | **Shared with Billing.** The marketing facet uses slug, title, description, features, cover image, isFeatured, isActive. See §6. |

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
- **CMS → Billing:** CMS reads `Product` and `Price` to render the storefront and to populate the contact-form program dropdown. See §6.

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
- **LMS ⇄ Billing:** future. There is currently no `Product.trainingPlanId` linkage.

---

## 4. Coaching — Coach-Athlete Relationship

**Responsibility:** Everything the coach sees about the athletes they work with, _on top of_ LMS state. Coaching owns profiles (coach and athlete), notes, action items, and the coach dashboard read model.

### Aggregates and entities

| Aggregate / entity                | Prisma model      | Role                                                                                                                                                                    |
| --------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CoachProfile` (root)             | `CoachProfile`    | Extends `User` with coach-specific fields (bio). Soft-deletable.                                                                                                        |
| `AthleteProfile`                  | `AthleteProfile`  | Extends `User` with athlete-specific fields (height, weight, health status). **Not soft-deletable.**                                                                    |
| `CoachNote` (root)                | `CoachNote`       | Hard-deletable free-form text note about an athlete, written by a coach.                                                                                                |
| `CoachActionItem` (root)          | `CoachActionItem` | A coaching-workflow signal: health report flags, plus the `MISSED_WORKOUTS` slot (currently a no-op condition until the workout-log surface returns). Mutable `status`. |
| `CoachDashboardData` (read model) | _computed_        | Not a Prisma model — computed on each request from assignments + `CoachActionItem` state in `coach-dashboard.ts`.                                                       |

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

- **DB:** `CoachProfile`, `AthleteProfile`, `CoachAthleteAssignment`, `CoachNote`, `CoachActionItem`.
- **Contracts:** `packages/contracts/src/entities/coaching/`.
- **API — `api-server`:** `endpoints/coaching/` — `coach-profile.ts`, `athlete-profile.ts`, `coach-note.ts`, `coach-action-item.ts`, `coach-dashboard.ts`, `coach-athletes/{index,detail,list}.ts`. The dashboard returns zero counts for the `workouts*` fields and an empty `progressBuckets` because the workout-log surface is not in the live system.
- **Consumer apps:** `apps/platform`.

### Dependencies

- **Coaching → IAM:** every coach/athlete is a `User`.
- **Coaching → LMS:** reads `TrainingPlan` and `PlanEnrollment` for plan counts on the dashboard.
- **Coaching ↛ CMS / Billing:** no dependency.

---

## 5. Billing — Products, Prices, Subscriptions, Transactions

**Responsibility:** What users pay for, how much they pay, and the record of those payments. Billing exists only in `schema.prisma` today — no contracts, no API, no UI.

### Aggregates and entities

| Aggregate / entity            | Prisma model   | Role                                                                                                  |
| ----------------------------- | -------------- | ----------------------------------------------------------------------------------------------------- |
| **`Product` (billing facet)** | `Product`      | **Shared with CMS.** The billing facet uses `stripeProductId`, `isActive`, and the `prices` relation. |
| `Price`                       | `Price`        | A price line item on a product — amount in cents, currency, interval.                                 |
| `Subscription` (root)         | `Subscription` | A user's current subscription state. **Singleton per user.**                                          |
| `Transaction`                 | `Transaction`  | An append-only payment attempt record. Keyed by provider transaction ID.                              |

### Value objects

- `Currency` (`USD | EUR | UAH`).
- `PriceInterval` (`MONTHLY | YEARLY | ONE_TIME`).
- `SubscriptionStatus` (`TRIAL | ACTIVE | PAST_DUE | CANCELED`).
- `TransactionStatus` (`PENDING | SUCCEEDED | FAILED`).
- `amountCents: Int` — the "Money is Integer" invariant.

### Invariants

- **Singleton subscription per user.** `Subscription.userId @unique`.
- **Provider transaction ID is unique.** `Transaction.providerTxId @unique`.
- **Idempotency key is unique.** `Transaction.idempotencyKey @unique` and `NOT NULL`.
- **Money is integer.** All monetary amounts are `Int` in cents/kopeks.

### Where it lives today

- **DB:** `Product`, `Price`, `Subscription`, `Transaction`, plus the four supporting enums.
- **Contracts:** `packages/contracts/src/entities/cms/product/` covers the marketing facet only. `packages/contracts/src/entities/billing/` is a placeholder.
- **API — `api-server`:** nothing.
- **Consumer apps:** stubs only.

### Dependencies

- **Billing → IAM:** every `Subscription` and `Transaction` keys off `userId`.
- **Billing → external (Stripe):** implicit. ADR 0014 backfills this as the de-facto payment provider decision.

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

`Product` is the only entity in the repo that lives in two contexts simultaneously. The table holds both marketing fields and billing fields.

**How to decide which context owns a read or a write.** The rule is: **does the operation affect money?** If yes, it is Billing. If no, it is CMS.

- Writing `title` or `features` → CMS.
- Writing `stripeProductId` or creating a `Price` → Billing.
- Writing `isFeatured` → CMS.
- Writing `isActive` → Billing.
- Reading the marketing storefront → CMS.
- Reading the billing catalog → Billing.

The Prisma model does not split. The contracts and the API do.

---

## 8. Cross-context invariants

| Invariant                       | Enforced where                                                              | Status                |
| ------------------------------- | --------------------------------------------------------------------------- | --------------------- |
| **Access = Subscription State** | Planned: Billing `SubscriptionStatus` gates every LMS / Coaching read.      | Not implemented.      |
| **Money is Integer**            | Every monetary field is `Int @db.Integer`. No `Float` / `Decimal` on money. | Enforced schema-wide. |
| **Singleton Subscription**      | `Subscription.userId @unique`. ADR 0008.                                    | Enforced at the DB.   |

### Per-aggregate DB-enforced invariants

| Aggregate            | Invariant                                 | Constraint                                                              |
| -------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| User                 | One user per email                        | `email @unique`                                                         |
| Subscription         | One subscription per user (singleton)     | `userId @unique`                                                        |
| MarketingPageSection | One section per page+section-name pair    | `@@unique([pageSlug, section])`                                         |
| Product              | One product per slug                      | `slug @unique`                                                          |
| Product              | One product per Stripe product ID         | `stripeProductId @unique`                                               |
| Price                | One price per Stripe price ID             | `stripePriceId @unique`                                                 |
| Transaction          | One transaction per provider TX ID        | `providerTxId @unique`                                                  |
| Transaction          | One transaction per idempotency key       | `idempotencyKey @unique`                                                |
| MarketingBlogPost    | One post per slug                         | `slug @unique`                                                          |
| MarketingPage        | One page per slug                         | `slug @unique`                                                          |
| PlanEnrollment       | One active enrollment per (plan, athlete) | partial unique index on `(planId, athleteId) WHERE "deletedAt" IS NULL` |

---

## 9. Dependency rules — what is allowed to import what

```
IAM        →   (leaf)
LMS        →   IAM
Coaching   →   IAM, LMS
CMS        →   IAM, Billing   (read-only)
Billing    →   IAM
Storage    →   (leaf supporting context)
```

**Forbidden directions:**

- `IAM → any`. IAM is a leaf.
- `LMS → Coaching`, `LMS → CMS`, `LMS → Billing`.
- `Coaching → CMS`, `Coaching → Billing`.
- `CMS → LMS`, `CMS → Coaching`.
- `Billing → CMS`, `Billing → Coaching`.
- `Storage → any domain`.

Every cross-context interaction is currently a read. Reads are preferable to writes because they do not require distributed transactions.

---

## 10. Ubiquitous language — domain glossary

| Term                | Context     | Definition                                                                                                                                | Not to be confused with                                                              |
| ------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **User**            | IAM         | The identity record. Every person in the system is a User with a `Role`.                                                                  | Athlete, Coach — those are role-specific profiles attached to a User                 |
| **Athlete**         | Coaching    | A User with an `AthleteProfile`.                                                                                                          | User — Athlete is a role, User is the identity                                       |
| **Coach**           | Coaching    | A User with a `CoachProfile`.                                                                                                             | Admin — Admin manages the business, Coach manages athletes                           |
| **TrainingPlan**    | LMS         | Coach-owned plan metadata with a lifecycle (DRAFT → ACTIVE → ARCHIVED).                                                                   | Product — Product is the billing wrapper around a TrainingPlan                       |
| **PlanEnrollment**  | LMS         | Active/paused/removed link between an athlete and a training plan.                                                                        | CoachAthleteAssignment — that one binds coach to athlete                             |
| **Product**         | Billing/CMS | The public-facing purchasable item on the marketing site. Has prices, features, and a slug.                                               | TrainingPlan — Product is what athletes buy, TrainingPlan is internal coach metadata |
| **Price**           | Billing     | A specific monetary offer for a Product (amount in cents, currency, interval).                                                            | —                                                                                    |
| **Subscription**    | Billing     | A recurring payment relationship: one User, one Price. Singleton per user.                                                                | —                                                                                    |
| **Transaction**     | Billing     | A single payment event (PENDING → SUCCEEDED / FAILED).                                                                                    | —                                                                                    |
| **CoachActionItem** | Coaching    | A system-generated task about an athlete (health report, missed-workouts slot).                                                           | CoachNote — ActionItem is structured and has status, Note is free-text               |
| **CoachNote**       | Coaching    | Free-text note a coach writes about an athlete. No status, no lifecycle.                                                                  | CoachActionItem — Note is observation, ActionItem is action                          |
| **MarketingPage**   | CMS         | A page on the public site (home, about, pricing). Content stored as JSON sections.                                                        | —                                                                                    |
| **Program**         | —           | **Not a term in the codebase.** Marketing copy may say "program" loosely. Do not use "Program" in code — use Product (billing/marketing). | TrainingPlan, Product                                                                |

---

## 11. How to use this document

- **When you add a new endpoint,** identify which context it belongs to first. If it does not fit any of the contexts above, pause — you may be inventing a new context, and that is a conversation worth having.
- **When you add a new contract entity,** put it in the correct context folder (`contracts/src/entities/<context>/<entity>/`) and add its subpath export to `packages/contracts/package.json`.
- **When you find a cross-context import that is not explicitly allowed in §9,** treat it as a bug. `.dependency-cruiser.cjs` enforces them in CI.
- **When product decisions change**, update the affected section here **before** writing code.

## References

- `docs/adr/0005-contracts-first-with-zod.md` — the contract-first discipline this context map reinforces.
- `docs/adr/0007-prisma-client-isolated-in-api-server.md` — the rule that puts all Prisma code in one package.
- `docs/adr/0008-singleton-subscription-invariant.md` — the canonical example of a context-owned invariant enforced at the DB.
- `docs/adr/0010-bff-via-http-loopback-for-rsc.md` — the reason context-to-context reads go over HTTP today.
- `CLAUDE.md` section "Global Invariants" — the codified system laws referenced throughout §8.
- `packages/api-server/prisma/schema.prisma` — the physical data reality every context projects from.
