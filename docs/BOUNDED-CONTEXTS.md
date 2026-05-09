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

This file answers those questions. It is the canonical record of the context-first organization that landed across `packages/contracts/src/entities/` and `packages/api-server/src/endpoints/`. The intended reader uses this document to decide, for any new feature or refactor, which context a piece of code belongs to and which other contexts it is allowed to depend on.

## The five contexts at a glance

```
                ┌──────────────┐
                │     IAM      │  ← User, Account, Session
                └──────┬───────┘
                       │ everyone has a User
            ┌──────────┼──────────┬──────────┐
            ▼          ▼          ▼          ▼
      ┌─────────┐  ┌────────┐  ┌────────┐  ┌─────────┐
      │   CMS   │  │  LMS   │  │ Coach. │  │ Billing │
      │ (mktg   │  │ (plan  │  │(profile│  │(products│
      │ content │  │ list + │  │ notes, │  │,prices, │
      │ + forms)│  │ athlete│  │action  │  │subscrip.│
      │         │  │ logs)  │  │items,  │  │,trans.) │
      │         │  │        │  │dashb.) │  │         │
      └────┬────┘  └───┬────┘  └───┬────┘  └────┬────┘
           │           ▲           │            │
           │           │           │            │
           │           └───────────┘            │
           │     Coaching reads LMS state       │
           │     to compute dashboards          │
           │                                    │
           └────────► Product is a shared  ◄────┘
                       entity with two
                       facets: CMS view
                       and Billing view
```

- **IAM** sits under everything. Every other context assumes a `User` exists and has a stable ID.
- **CMS** is the marketing surface — landing page content, blog posts, reviews, contact-form inbox. Mostly read on `apps/marketing`, mostly written on `apps/admin`.
- **LMS** is the training product — training plans plus their authoring tree (day → session → block → item per [ADR 0038](adr/0038-training-plan-domain.md)), the shared library catalog (BlockType, SchemeType, DayType, Exercise per [ADR 0039](adr/0039-training-plan-library-catalog.md)), athlete enrollments, and the athlete-log domain (workout sessions, exercise logs, set logs, personal records). Almost entirely owned by `apps/platform`. The earlier slim-metadata rollback ([ADR 0037](adr/0037-plan-editor-and-library-rollback.md)) was undone across PRs #181/#184/#185/#186/#187; the editor save model is governed by [ADR 0043](adr/0043-plan-editor-save-model.md).
- **Coaching** sits on top of LMS and IAM. It does not own workout data — it consumes it. Coaching owns coach-athlete relationships, notes, action items, and the coach dashboard read model.
- **Billing** exists only in `schema.prisma` today. No contracts, no API, no UI. It is the one context where we still have a clean window to get the design right before any code is written against it.

The rest of this document describes each context in detail: what it owns, which invariants protect it, which other contexts it depends on, where it lives today, and where it should live after section 1.2 closes.

---

## 1. IAM — Identity and Access

**Responsibility:** Who the user is, how they prove it, and what they are allowed to do. IAM is the authentication + authorization boundary. Every other context takes `userId: string` as a given and trusts that IAM already validated it. Media/file upload used to live here as an "everything admin-only lives under IAM" convenience; it was moved to its own Storage supporting context in 1.4.D — see §6.

### Aggregates and entities

| Aggregate / entity  | Prisma model        | Role                                                                                              |
| ------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `User` (root)       | `User`              | Identity, role, timezone, soft-delete. Email is the natural key.                                  |
| `Account`           | `Account`           | NextAuth OAuth link table. Currently unused (credentials-only, see ADR 0004) but schema-reserved. |
| `Session`           | `Session`           | NextAuth DB session rows. Not actively used because JWT strategy is in effect (ADR 0012).         |
| `VerificationToken` | `VerificationToken` | NextAuth email verification scaffolding. Reserved.                                                |

`Account`, `Session`, and `VerificationToken` are NextAuth adapter tables. They are required by the adapter contract but not part of the current authentication flow. They stay in IAM because they describe **how identity is proved**, not anything about the domain.

### Value objects

- `Role` (`USER | COACH | ADMIN`) — authorization primitive. The only role hierarchy the system recognizes.
- `timezone: string` — stored as IANA string, but **not validated** (known data-validation gap; see ADR 0019 for the database-strategy deferral).
- `email: string` — stored lowercase by convention but not enforced.

### Invariants

- **Email is unique.** `User.email @unique`.
- **One user may have at most one `AthleteProfile` and at most one `CoachProfile`.** Enforced by `@unique` on `userId` in both profile tables. This is a cross-context invariant — the profiles themselves live in LMS (athlete) and Coaching (coach). IAM owns the uniqueness guarantee because the profiles key off `User.id`.
- **Soft-deleted users should not authenticate.** Enforced by the soft-delete extension in `packages/api-server/src/db/client.ts` on every read path (`findMany`, `findFirst`, `findFirstOrThrow`, `findUnique`, `findUniqueOrThrow`, `count`, `aggregate`, `groupBy`). The remaining gap is `update` / `updateMany` / `upsert` — those are intentionally unfiltered as the restoration path; see ADR 0009 for the authoritative coverage spec.
- **Cannot remove the last admin.** Application-level check in `iamUserAdminApi.updateRole` — there is no DB constraint behind it. This is a rare case where the invariant cannot be expressed in SQL and must live in the service layer.

### Where it lives today

- **DB:** `User`, `Account`, `Session`, `VerificationToken`, and the role enum in `schema.prisma`.
- **Contracts:** `packages/contracts/src/entities/iam/auth/`, `iam/user/` (subpath exports `@repo/contracts/iam/*`). Upload shapes moved to `contracts/src/entities/storage/upload/` in 1.4.D.
- **API — `api-server`:** `endpoints/iam/users-admin.ts` (admin user management), `endpoints/iam/users-search.ts` (athlete search inside coach flow), and `endpoints/iam/auth-service.ts` (exports `iamAuthService` used by both NextAuth instances — previously `services/auth.ts`). The upload endpoint moved to `endpoints/storage/upload.ts` in 1.4.D.
- **Consumer apps:** all three. Each app has its own NextAuth route handler (`api/auth/[...nextauth]`) that proxies into `iamAuthService`.

### Dependencies

**None.** IAM does not import anything from the other four contexts. Every other context depends on `userId: string` coming from IAM, but IAM itself is self-contained. This is the correct direction — identity is the foundation.

### Target state

Landed in 1.2.B (contracts) and 1.2.C (endpoints). `iam/` subdirectory exists in both `contracts/src/entities/` and `api-server/src/endpoints/`. `upload` migrated behind a dedicated `StoragePort` in 1.4.A and was then moved out of IAM entirely into a Storage supporting context in 1.4.D (see §6). `auth-service.ts` may move into a dedicated `services/` subfolder inside `iam/` if more IAM domain services appear.

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
| **`Product` (marketing facet)** | `Product`                    | **Shared with Billing.** The marketing facet uses slug, title, description, features, cover image, isFeatured, isActive. See §7. |

The marketing facet of `Product` is the only cross-context entity in the repo today. CMS reads `Product` to render the storefront grid and the contact form's program dropdown; it never writes the billing fields. Billing writes the billing fields; it never writes the marketing ones. This de-facto split is honored by the code but not enforced by the schema.

### Value objects

- `PageSlug` (`home | about | blog | contact | faq | storefront`) — enumerated in `contracts/pages`. Drives which page-section schemas are valid.
- `SectionKey` — string literal union per page, in `PAGE_SECTIONS_MAP`. Each section payload is validated by a dedicated Zod schema (`SECTION_SCHEMAS`).
- `MarketingBlogCategory` enum — fitness, nutrition, mindset, training, recovery, uncategorized.
- `ContactSubmissionStatus` — inbox triage state (new, in-progress, replied, closed).

### Invariants

- **Unique slug per page.** `MarketingPage.slug @unique`, `MarketingBlogPost.slug @unique`, `Product.slug @unique`.
- **One section of each kind per page.** `@@unique([pageSlug, section])` on `MarketingPageSection`. A page cannot have two "hero" sections.
- **Section payload must match its Zod schema.** Enforced at read time in `cmsPagesPublicApi.extractSectionData` via `SECTION_SCHEMAS[key].parse(...)`. This is an invariant that lives in the contract layer, not the DB — the DB stores the payload as untyped JSON (known domain-modeling gap: section `data` would benefit from a discriminated-union representation).
- **At most one featured blog post / featured product at a time.** Enforced by `ensureExclusiveFeatured` / `toggleExclusiveFeatured` utilities inside `$transaction`. This is a mutable-invariant — not a DB constraint, so in principle a concurrent writer could break it, but the `updateMany` inside the same transaction closes the race for single-node Postgres.
- **Featured-post transition on publish.** A blog post being published for the first time gets `publishedAt = now()`. This is a `prepareCreateInput`/`updatePost` detail, not a DB default.
- **Read-time is derived, not authoritative.** `MarketingBlogPost.readTime` is computed from `content` word count during create/update. A hand edit to the raw column would be stale. Treat it as a cache.

### Where it lives today

- **DB:** `MarketingPage`, `MarketingPageSection`, `MarketingBlogPost`, `MarketingReview`, `MarketingContactSubmission`, and the `Product` model (shared with Billing). Physical prefix is `marketing_*` except for `Product` (`app_products`).
- **Contracts:** `packages/contracts/src/entities/cms/pages/`, `cms/blog/`, `cms/review/`, `cms/contact/`, `cms/product/`, `cms/dashboard/` (admin analytics read-model) — subpath exports `@repo/contracts/cms/*`.
- **API — `api-server`:** all CMS lives under `endpoints/cms/` after 1.2.C. Each entity is a subfolder with sibling admin-write and public-read files: `cms/blog/admin.ts`, `cms/contact/{admin,inbound}.ts`, `cms/dashboard/admin.ts`, `cms/pages/{admin,public,page-sections}.ts`, `cms/product/{admin,public}.ts`, `cms/review/{admin,public}.ts`. The `cms/toggle-exclusive-featured.ts` helper is shared between `blog/admin.ts` and `product/admin.ts` (moved here from `utils/`). Blog reads still live inside `cms/pages/public.ts` — 1.2.G will extract them into a dedicated `cms/blog/public.ts`.
- **Consumer apps:** `apps/admin` (authoring, triage), `apps/marketing` (public rendering). `apps/platform` does not touch CMS.

### Dependencies

- **CMS → IAM:** the admin authoring side requires an authenticated admin session. The dependency is enforced by `withAdminAuth` on every admin CMS route handler. Public CMS read endpoints (`/api/public/*`) do not require authentication and do not depend on IAM at runtime, only at the contract level (they do not use `User`).
- **CMS → Billing:** CMS reads `Product` and `Price` to render the storefront and to populate the contact-form program dropdown. The read is restricted to the marketing facet of `Product` plus `Price.amountCents` / `currency` for display. This is the one cross-context read in the current codebase. See §7.

### Target state

Landed in 1.2.C. The `admin/` and `marketing/` parallel folders collapsed into `endpoints/cms/` grouped by entity. Actual shape:

```
api-server/src/endpoints/cms/
  blog/
    admin.ts        (create / update / delete / toggle featured)
    admin.test.ts
    # public.ts — pending 1.2.G (blog reads currently live in pages/public.ts)
  contact/
    admin.ts        (triage)
    inbound.ts      (public form submission)
  dashboard/
    admin.ts        (admin analytics read-model)
  pages/
    admin.ts
    public.ts
    page-sections.ts  (CMS-only helper, moved from utils/)
  product/
    admin.ts
    public.ts
  review/
    admin.ts
    public.ts
  index.ts          (context barrel)
  toggle-exclusive-featured.ts  (shared CMS admin helper, moved from utils/)
```

The `Product` model itself keeps its current physical shape; only the contracts and endpoints are split along the CMS / Billing line. See §7 for the split rule. The entity folder is named `product/` (not `product-marketing/`) for now — it will be renamed when the billing facet is added and a `billing/product-billing/` sibling appears.

---

## 3. LMS — Learning Management System

**Responsibility:** The training surface — coach-authored training plans with a four-level authoring tree (day → session → block → item per [ADR 0038](adr/0038-training-plan-domain.md)), a shared library catalog (BlockType, SchemeType, DayType, Exercise per [ADR 0039](adr/0039-training-plan-library-catalog.md)), athlete enrollments onto plans, and the athlete-log domain (workout sessions, exercise logs, set logs, personal records). The earlier rollback in [ADR 0037](adr/0037-plan-editor-and-library-rollback.md) was undone across PRs #181/#184/#185/#186/#187; the per-block atomic save model now lives in [ADR 0043](adr/0043-plan-editor-save-model.md), superseding ADR 0035.

### Aggregates and entities

| Aggregate / entity      | Prisma model     | Role                                                                                                                                                                                                             |
| ----------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TrainingPlan` (root)   | `TrainingPlan`   | Coach-owned plan metadata: name, description, status lifecycle `DRAFT → ACTIVE → ARCHIVED`. Soft-deletable. Owns the authoring tree below.                                                                       |
| `PlanDay`               | `PlanDay`        | Child of `TrainingPlan`. Date-keyed day on the plan rail. Optional `dayTypeId` color tag. Owns sessions.                                                                                                         |
| `PlanSession`           | `PlanSession`    | Child of `PlanDay`. Order within the day, optional label. Owns blocks.                                                                                                                                           |
| `PlanBlock`             | `PlanBlock`      | Child of `PlanSession`. Carries `SchemeType` reference, scheme params, `BlockType` refs (via `PlanBlockTypeRef`), modifiers, notes. Owns items. `MAX_ITEMS_PER_BLOCK = 50`.                                      |
| `PlanItem`              | `PlanItem`       | Child of `PlanBlock`. Carries an `Exercise` reference, prescription, alternatives, notes. **Hard-deleted** (excluded from soft-delete extension — see [ADR 0009](adr/0009-soft-delete-via-prisma-extension.md)). |
| `PlanEnrollment`        | `PlanEnrollment` | Athlete enrollment onto a plan with active/paused/removed lifecycle. **Hard-deleted** (excluded from soft-delete extension).                                                                                     |
| `BlockType`             | `BlockType`      | Library entry — block role taxonomy (warmup, strength, conditioning, etc.). Soft-deletable.                                                                                                                      |
| `SchemeType`            | `SchemeType`     | Library entry — abstract scheme template `{id, name, archetypeKind}` per [ADR 0042](adr/0042-drop-scheme-type-default-params.md). Soft-deletable.                                                                |
| `DayType`               | `DayType`        | Library entry — day archetype with color tag. Soft-deletable.                                                                                                                                                    |
| `Exercise`              | `Exercise`       | Library entry — exercise definition (primary movement, metrics). Soft-deletable.                                                                                                                                 |
| `WorkoutSession` (root) | `WorkoutSession` | An athlete's training session. Owns scheduling + completion fields, mood, perceived exertion. Holds child `BlockSession`s.                                                                                       |
| `BlockSession`          | `BlockSession`   | Child of `WorkoutSession`. Carries `archetypeKind` + `schemeParamsSnapshot` (discriminated JSON snapshot per ADR 0040).                                                                                          |
| `ExerciseLog`           | `ExerciseLog`    | Child of `BlockSession`. Carries `exerciseSnapshot` JSON (movement + metrics). Holds `SetLog`s.                                                                                                                  |
| `SetLog`                | `SetLog`         | Per-set actuals (reps, load, distance, time) tied to a single `ExerciseLog`.                                                                                                                                     |
| `PersonalRecord` (root) | `PersonalRecord` | An athlete's PR row. `kind` ∈ `PrKind`. Append-only — "current PR" comes from `findFirst` ordered by date.                                                                                                       |

The authoring tree is what coaches edit; the athlete-log subtree is what athletes execute. The two are linked by snapshots ([ADR 0040](adr/0040-training-plan-snapshot-and-analytics.md)) — `BlockSession.schemeParamsSnapshot` and `ExerciseLog.exerciseSnapshot` capture immutable state at log time, decoupling logs from later edits to the source plan or library.

### Value objects

- `TrainingPlanStatus` (`DRAFT | ACTIVE | ARCHIVED`).
- `PlanEnrollmentStatus` (`ACTIVE | PAUSED | REMOVED`).
- `WorkoutSessionStatus` (`PLANNED | IN_PROGRESS | COMPLETED | SKIPPED`).
- `RxStatus` on `BlockSession` and `ExerciseLog` — Rx / scaled / DNF posture.
- `SchemeArchetypeKind` on `BlockSession` and `SchemeType` — nine archetypes (`COUNT_DOWN`, `COUNT_UP`, `STRAIGHT_SETS`, `SUPERSET`, `EMOM`, `AMRAP`, `LADDER`, `TABATA`, `SETS_REPS`); the discriminator for `schemeParamsSnapshot` JSON ([ADR 0031](adr/0031-scheme-params-as-discriminated-json.md), [ADR 0041](adr/0041-sets-reps-archetype.md) added `SETS_REPS`).
- `PrKind` (`MAX_LOAD_FOR_REPS | ONE_REP_MAX | N_REP_MAX | MAX_REPS_UNBROKEN | MAX_REPS_TOTAL | BEST_TIME_FOR_X | MAX_DISTANCE_IN_T | MAX_CALORIES_IN_T`).
- `MovementPattern` — used on `Exercise.primaryMovement` and on prescription metric typing.

### Invariants

- **Plan ownership.** Every `TrainingPlan` is owned by exactly one `User` via `creatorId`. Authorization routes through `verifyPlanOwnership` in `authz/guards.ts` (creator OR `ADMIN` / `HEAD_COACH`).
- **Plan archive lifecycle.** `TrainingPlanStatus` transitions are gated by the training-plan endpoint code. `ARCHIVED` is terminal until restored.
- **Authoring-tree integrity.** `MAX_ITEMS_PER_BLOCK = 50` per ADR 0038. `PlanBlock.items.id` cannot be smuggled across blocks — batch update validates the `id`'s parent block before applying (see `applyItemDiff` in `endpoints/lms/plan-content/plan-block/plan-item-batch.ts`).
- **Athlete-log immutability.** Conventionally, log rows are create-only — no edit semantics in the surviving endpoints. There is no DB-level write guard; the convention is enforced by the absence of update routes.
- **PR uniqueness — none.** `PersonalRecord` no longer holds `@@unique([userId, exerciseId, kind])`. Rows stack chronologically; "current PR for kind X" comes from `findFirst({ where: { userId, kind }, orderBy: { achievedAt: 'desc' }})`.
- **Editor save model.** Per [ADR 0043](adr/0043-plan-editor-save-model.md): per-block atomic save (block + nested `items[]` in one transaction); explicit Save (no autosave); LWW silent for MVP. Five-state save indicator at the form layer (`clean | dirty | saving | saved | error`).
- **Per-archetype scheme-param shape.** `SchemeType.archetypeKind` is the contract between the library entry and the editor's typed param form ([ADR 0042](adr/0042-drop-scheme-type-default-params.md)) — no `defaultParams` column; defaults come from the factory at block creation.

### Where it lives today

- **DB:** `TrainingPlan`, `PlanDay`, `PlanSession`, `PlanBlock`, `PlanBlockTypeRef`, `PlanItem`, `PlanEnrollment`, `BlockType`, `SchemeType`, `DayType`, `Exercise`, `WorkoutSession`, `BlockSession`, `ExerciseLog`, `SetLog`, `PersonalRecord`. `AthleteProfile` is logically half-LMS half-Coaching (see §4).
- **Contracts:** `packages/contracts/src/entities/lms/{training-plan,plan-day,plan-session,plan-block,plan-item,plan-enrollment,block-type,scheme-type,day-type,exercise,workout-session,block-session,exercise-log,set-log,_domain}/` (subpath exports `@repo/contracts/lms/*`).
- **API — `api-server`:** `packages/api-server/src/endpoints/lms/` houses `training-plan/`, `plan-content/{plan-day,plan-session,plan-block,plan-item}/`, `library/{block-type,scheme-type,day-type,exercise}/`, `plan-enrollment/`. Ownership guards live in `packages/api-server/src/authz/guards.ts`.
- **Consumer apps:** `apps/platform` exclusively. `apps/admin` does not currently read LMS state.

### Dependencies

- **LMS → IAM:** every LMS aggregate references `User.id`. Plan ownership routes through `verifyPlanOwnership` in `authz/guards.ts`.
- **LMS → Coaching:** TrainingPlan ownership is by `User` (creator role checked via IAM); LMS does not know about action items or coach dashboards.
- **LMS ⇄ Billing:** future. There is currently no `Product.trainingPlanId` linkage — when Billing comes online, the access-on-purchase model will be re-evaluated alongside whatever shape it takes.

### Target state

Current shape:

```
api-server/src/endpoints/lms/
  index.ts                                  (parent barrel)
  training-plan/                            (list / get / create / update / delete / status transitions)
  plan-content/
    plan-day/
    plan-session/
    plan-block/
    plan-item/
  library/
    block-type/
    scheme-type/
    day-type/
    exercise/
  plan-enrollment/                          (active / paused / removed lifecycle, athlete-side reads)
```

Contracts mirror under `packages/contracts/src/entities/lms/<entity>/` with subpath exports `@repo/contracts/lms/<entity>`. `apps/platform` is the only legitimate consumer of LMS endpoints. The remaining editor work tracked at the time of writing — drag-and-drop reordering across the four levels, the enrollments management tab UI, and the compliance gradient with weighted blocks ([ADR 0033](adr/0033-compliance-gradient-with-weighted-blocks.md), pending column implementation) — extends this shape rather than reshaping it.

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

`CoachDashboardData` is a read-model — no backing table. Every request recomputes aggregations over `CoachAthleteAssignment`, athlete-log rows, and `CoachActionItem`. Audit section 2 flagged this as a nascent CQRS-lite split that is currently ad-hoc.

### Value objects

- `HealthStatus` (`HEALTHY | INJURED | RESTRICTED`).
- `Gender` (`MALE | FEMALE`) — an intentional product decision that should be revisited as the product matures.
- `ActionItemType` (`MISSED_WORKOUTS | HEALTH_REPORT`).
- `ActionItemStatus` (`OPEN | RESOLVED`).
- `ActionItemSeverity` (`INFO | WARNING | CRITICAL`).
- `ActionItemResolveReason` (`AUTO_CONDITION_CLEARED | AUTO_ENROLLMENT_ENDED | MANUAL_CONTACTED`) — distinguishes human from automatic resolution. `AUTO_ENROLLMENT_ENDED` fires on `CoachAthleteAssignment` removal; with `PlanEnrollment` restored, whether enrollment removal should also trigger this is a follow-up to evaluate.
- Adherence thresholds and priority maps in `coach-dashboard.constants.ts`.

### Invariants

- **One profile per user.** `CoachProfile.userId @unique`, `AthleteProfile.userId @unique`. A user can be both (rare), or one, or neither.
- **Action items are generated, not authored.** An action item exists because its condition existed at some point in LMS state. The `reconcile` pass (currently synchronous, triggered from the dashboard query) creates new items when a condition first appears and auto-resolves existing items when the condition clears. Audit section 1 flagged the lack of a background scheduler for this work.
- **Action item scoping.** `@@index([coachId, status, athleteId])` — every action item belongs to a coach-athlete pair. No global action items.
- **Coach notes are scoped to coach-athlete pairs.** `@@index([coachId, athleteId])`. There is no schema-level unique constraint, so a coach can have many notes about the same athlete.
- **Coach access to athlete data is mediated by `CoachAthleteAssignment`.** `verifyAthleteBelongsToCoach` in `guards.ts` checks that the coach has an active assignment row for the athlete. The previous enrollment-based gate is gone with `PlanEnrollment` itself (rolled back).

### Where it lives today

- **DB:** `CoachProfile`, `AthleteProfile`, `CoachNote`, `CoachActionItem`. The action item type/status/severity/resolve-reason enums are defined here too.
- **Contracts:** `packages/contracts/src/entities/coaching/coach-profile/`, `coaching/athlete-profile/`, `coaching/coach-note/`, `coaching/coach-action-item/`, `coaching/coach-dashboard/`, `coaching/coach-athletes/` (subpath exports `@repo/contracts/coaching/*`).
- **API — `api-server`:** all under `endpoints/coaching/` after 1.2.C: `coach-profile.ts`, `athlete-profile.ts`, `coach-note.ts`, `coach-action-item.ts`, `coach-dashboard.ts`, and the aggregator subfolder `coach-athletes/{index,detail,list}.ts`. Context-specific helpers that used to live in `utils/` now live alongside the endpoints that consume them: `coaching/dashboard-computations.ts` (computes adherence windows, progress buckets) and `coaching/assigned-athlete-query.ts` (builds the nested Prisma include for assignment-scoped athlete read-models — replaces the former enrollment-based shape). Shared authz guards live in top-level `authz/guards.ts` — imported as `../../authz/guards`.
- **Consumer apps:** `apps/platform` (coach area + athlete self-service for `AthleteProfile`).

### Dependencies

- **Coaching → IAM:** every coach/athlete is a `User`. Role `COACH` gates coach-area access (currently only per-endpoint, not in middleware — see ADR 0018 for the policy-layer deferral).
- **Coaching → LMS:** read dependency. The dashboard query pulls athlete-log rows via the nested Prisma include on `CoachAthleteAssignment` (`assigned-athlete-query.ts`). Action item reconciliation reads `WorkoutSession`. Coaching does not include `PlanEnrollment` directly — coach-athlete binding goes through assignments, even after enrollments returned.
- **Coaching ↛ CMS:** no dependency. Coach dashboards do not show marketing content.
- **Coaching ↛ Billing:** currently no dependency, but once Billing exists, subscription status will gate whether an athlete shows in a coach dashboard at all (via "Access = Subscription State" invariant).

### Target state

Landed in 1.2.B (contracts) and 1.2.C (endpoints). Coaching lives mostly flat-per-entity, with `coach-athletes/` as a subfolder because its aggregator was already split into three files:

```
api-server/src/endpoints/coaching/
  athlete-profile.ts
  coach-action-item.ts
  coach-action-item.test.ts
  coach-action-item.test-helpers.ts
  coach-athletes/
    index.ts
    detail.ts
    list.ts
  coach-dashboard.ts
  coach-dashboard.test.ts
  coach-note.ts
  coach-profile.ts
  dashboard-computations.ts       (Coaching-specific read computations, moved from utils/)
  dashboard-computations.test.ts
  dashboard-computations.test-helpers.ts
  dashboard-progress.test.ts
  assigned-athlete-query.ts       (nested Prisma include for assignment-scoped athlete reads)
  index.ts
```

Shared authz guards (`resolveCoachId`, `verifyAthleteBelongsToCoach`, `verifyPlanOwnership`, `verifyWorkoutOwnership`) moved to the top-level `packages/api-server/src/authz/guards.ts` — they are cross-cutting policy that spans both LMS and Coaching concerns, not owned by either single context. Coaching endpoints import them as `../../authz/guards`.

---

## 5. Billing — Products, Prices, Subscriptions, Transactions

**Responsibility:** What users pay for, how much they pay, and the record of those payments. Billing exists only in `schema.prisma` today — no contracts, no API, no UI. This is both a gap (payments are unimplemented) and an opportunity (no retrofitting debt).

### Aggregates and entities

| Aggregate / entity            | Prisma model   | Role                                                                                                                                                                                                     |
| ----------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`Product` (billing facet)** | `Product`      | **Shared with CMS.** The billing facet uses `stripeProductId`, `isActive`, and the `prices` relation. The previous LMS link via `trainingPlanId` was dropped during the plan-editor rollback (ADR-0037). |
| `Price`                       | `Price`        | A price line item on a product — amount in cents, currency, interval. One product can have many prices (tiers, intervals).                                                                               |
| `Subscription` (root)         | `Subscription` | A user's current subscription state. **Singleton per user.** External ID = Stripe subscription ID (`sub_xxx`).                                                                                           |
| `Transaction`                 | `Transaction`  | An append-only payment attempt record. Keyed by provider transaction ID.                                                                                                                                 |

### Value objects

- `Currency` (`USD | EUR | UAH`) — multi-currency enabled in the schema. Audit section 2 flagged that this doubles the complexity and needs an ADR.
- `PriceInterval` (`MONTHLY | YEARLY | ONE_TIME`).
- `SubscriptionStatus` (`TRIAL | ACTIVE | PAST_DUE | CANCELED`). The `Access = Subscription State` invariant (CLAUDE.md) says platform access requires `ACTIVE | TRIAL | PAST_DUE`.
- `TransactionStatus` (`PENDING | SUCCEEDED | FAILED`).
- `amountCents: Int` — the "Money is Integer" invariant (CLAUDE.md). Floats are forbidden in this context.

### Invariants

- **Singleton subscription per user.** `Subscription.userId @unique` — enforced at the DB. See ADR 0008 for the full reasoning.
- **Provider transaction ID is unique.** `Transaction.providerTxId @unique` — the payment provider's native idempotency. This is enforced at the DB.
- **Idempotency key is unique.** `Transaction.idempotencyKey @unique` and `NOT NULL` — required idempotency for API-level retries. Enforced at the DB.
- **Price active flag independent of product.** `Price.isActive` vs `Product.isActive` are independent booleans. A product can be marketed but its prices deprecated, or vice versa. Currently there is no coordination logic for this.
- **Subscription references a specific price.** `Subscription.priceId → Price.id` with `onDelete: Restrict`. You cannot delete a price that an active subscription points at.
- **Transaction → subscription is optional.** `Transaction.subscriptionId` is nullable (`onDelete: SetNull`). Preserves transaction history even if a subscription is removed, though subscription rows should never be hard-deleted in practice.
- **Money is integer.** All monetary amounts are `Int` in cents/kopeks. Enforced schema-wide. Audit section 11 noted that `centsToAmount` is the only conversion helper and it currently lives in `@repo/shared`.

### Where it lives today

- **DB:** `Product`, `Price`, `Subscription`, `Transaction`, plus the four supporting enums. All prefixed `app_*`.
- **Contracts:** `packages/contracts/src/entities/cms/product/` covers the marketing facet only (exposed as `@repo/contracts/cms/product`). `packages/contracts/src/entities/billing/` exists as a placeholder with a README but contains **no contract entity** for `Price`, `Subscription`, `Transaction`, or a billing facet of `Product`.
- **API — `api-server`:** nothing. No Billing endpoints exist in any of the three endpoint folders. `@vercel/blob` is the only payment-adjacent integration, and that is storage, not payments.
- **Route handlers:** no `/api/.../billing/*`, no `/api/webhooks/stripe`, no `/api/webhooks/*` at all.
- **Consumer apps:** the marketing and platform apps have billing UI stubs. The admin app does not administer billing (no subscription management, no refund flow).

### Dependencies

- **Billing → IAM:** every `Subscription` and `Transaction` keys off `userId`.
- **Billing → LMS:** the previous `Product.trainingPlanId` reference was removed during the plan-editor rollback. When Billing comes online, the link to LMS will be reintroduced alongside the access-on-purchase model.
- **Billing → CMS:** none. CMS reads `Product` for storefront display; that is a CMS → Billing read, not the other way around.
- **Billing → external (Stripe):** implicit in the schema. ADR 0014 backfills this as the de-facto payment provider decision. A webhook handler is the missing piece.

### Target state (after 1.2 and later sections)

Create the missing pieces top-down:

1. **Split `Product` contract into two facets.** `contracts/src/entities/cms/product-marketing/` (title, description, features, slug, cover image, isFeatured) and `contracts/src/entities/billing/product-billing/` (stripeProductId, isActive, prices). The Prisma model stays single; the contracts enforce the split.
2. **Add missing billing contracts.** `billing/price/`, `billing/subscription/`, `billing/transaction/`.
3. **Add `endpoints/billing/`**, initially empty, with a README placeholder describing the target shape (`subscription/`, `transaction/`, `webhook/`).
4. **Add `endpoints/billing/webhook/stripe.ts`** when Stripe goes in — with signature verification and idempotency via `providerTxId`. Re-introducing the LMS access-on-purchase write is gated on the future plan-authoring re-implementation.

Until steps 1–3 are done, `endpoints/billing/` stays empty and acts as a placeholder reminding contributors that Billing is a recognized context.

---

## 6. Storage — supporting context (file upload)

**Responsibility:** File upload and deletion for admin-authored media (blog cover images, marketing page hero backgrounds, product photos, review author avatars, profile pictures). Storage is a **supporting context**, not a domain context — it provides a capability any domain context can use, but it owns no business rules of its own.

### Why it exists as a separate context

Before 1.4.D, the upload endpoint lived in `endpoints/iam/upload.ts` because "only admins can upload, so file it under the admin-only context." That was a placement of convenience, not of meaning. Identity has nothing to do with file bytes. Putting upload inside IAM broke the "responsibility is what makes the context" test: IAM is about _who the user is_, upload is about _where bytes go_.

Section 1.4.A (commit `6f9ca98`) inverted the vendor dependency by introducing `StoragePort` in `packages/api-server/src/infrastructure/storage/`. The endpoint was refactored to the factory-DI pattern `createIamUploadAdminApi(storage: StoragePort)`, but still physically lived under `endpoints/iam/`. Section 1.4.D (this bullet) completes the move: the endpoint, the contracts, and the symbol names all now live under `storage/`.

### What it owns

| Shape / symbol                     | Location                                                       | Role                                                                                     |
| ---------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `UploadContext` (union)            | `contracts/src/entities/storage/upload/upload.types.ts`        | Names the kind of upload: `avatar`, `blog`, `marketing`.                                 |
| `UPLOAD_CONFIG`                    | `contracts/src/entities/storage/upload/upload.constants.ts`    | Per-context max size, allowed MIME types, storage-key prefix.                            |
| `uploadImageRequestSchema` + types | `contracts/src/entities/storage/upload/upload-api.schema.ts`   | Zod schema for the route-handler boundary.                                               |
| `storageUploadAdminApi`            | `endpoints/storage/index.ts` (default via `defaultStorage` DI) | Admin-scoped upload/delete API. Built by `createStorageUploadAdminApi(storage)`.         |
| `StoragePort`                      | `api-server/src/infrastructure/storage/port.ts`                | The interface — `put(key, file, options?)`, `delete(url)`. See §1 of this doc and 1.4.A. |
| `createVercelBlobAdapter`          | `api-server/src/infrastructure/storage/vercel-blob-adapter.ts` | The only file in the repo that imports `@vercel/blob`.                                   |

The port + adapter (`infrastructure/storage/`) is **separate** from the endpoint (`endpoints/storage/`). Infrastructure is ports-and-adapters machinery; endpoints is application-layer code that consumes a port. They happen to share the word "storage" because they describe the same concept at different layers.

### Dependencies

**None inbound from domain contexts that Storage would need to understand.** Storage doesn't know what a `TrainingPlan` is, what a `BlogPost` is, or what a `User` is. It takes a `File`, a `UploadContext` enum value, and writes bytes to a vendor-provided URL. It returns the URL as a string.

**Outbound:** depends only on `StoragePort` from `infrastructure/storage/`, which in turn depends on a vendor SDK in exactly one adapter file. No domain dependencies.

This is enforced mechanically by the dep-cruiser rule `api-server-storage-is-leaf` (1.4.D): `endpoints/storage/` + `mappers/storage/` cannot import from `endpoints/mappers of {cms,lms,coaching,iam,billing}/`. Similarly, `contracts-storage-is-leaf` forbids `contracts/src/entities/storage/` → `contracts/src/entities/(cms|lms|coaching|iam|billing)/`.

### Who can import from Storage

Any domain context that legitimately needs file upload. Storage is a leaf in the dependency graph from Storage's own perspective, but anyone can reach INTO Storage. The admin route handler `apps/admin/src/app/api/admin/upload/image/route.ts` is the current (and only) consumer; admin-scoped UI forms for blog and review import `UPLOAD_CONFIG` from `@repo/contracts/storage/upload`. When the coach platform grows a "change athlete avatar" flow, it'll reach into Storage the same way: import `storageUploadAdminApi` (or a `storageUploadPlatformApi` sibling if authorization shape diverges) from `@repo/api-server/storage`.

### Invariants

- **Vendor isolation.** Exactly one file in the repo imports the vendor SDK: the adapter. Everything else (port, endpoint, consumers) depends on the `StoragePort` interface. Enforced by convention; could be mechanized with a scoped dep-cruiser rule if drift appears.
- **Upload config is contract-level.** `UPLOAD_CONFIG[context]` is the source of truth for file size limits and MIME allowlists. UI and backend both import from `@repo/contracts/storage/upload` — no duplication, no drift.
- **`UploadContext` is a closed union.** Adding a new context (e.g. `"athlete-progress-photo"`) means adding a new entry to `UPLOAD_CONFIG`. The TypeScript compiler forces exhaustiveness; you cannot reach for the port with an unknown context.

### Where it lives today (post-1.4.D)

- **DB:** None. Storage has no Prisma models — it writes to a vendor-provided object store, and consumers persist the returned URL as a plain `String` in their own tables (`MarketingBlogPost.coverImage`, `MarketingReview.authorImage`, `Product.image`, etc.).
- **Contracts:** `packages/contracts/src/entities/storage/upload/` — subpath export `@repo/contracts/storage/upload`.
- **API — `api-server`:** `packages/api-server/src/endpoints/storage/upload.ts` + `upload.test.ts` + `index.ts` barrel. Subpath export `@repo/api-server/storage`. Infrastructure lives at `packages/api-server/src/infrastructure/storage/`.
- **Consumer apps:** `apps/admin` — route handler + UI form components + mutation hooks. No other app consumes Storage today.

### Target state

Landed in 1.4.D (this commit). The supporting-context split is complete:

- `contracts/iam/upload/` → `contracts/storage/upload/`
- `endpoints/iam/upload.ts` → `endpoints/storage/upload.ts`
- `iamUploadAdminApi` → `storageUploadAdminApi`
- `createIamUploadAdminApi` → `createStorageUploadAdminApi`
- `IamUploadAdminApi` → `StorageUploadAdminApi`
- New subpath export `@repo/api-server/storage`
- New subpath export `@repo/contracts/storage/upload`
- New dep-cruiser rules `contracts-storage-is-leaf` and `api-server-storage-is-leaf`
- ADR 0013 updated to reference new paths and symbol names

Future work under this context (ports: email, cache, queue, payment from 1.4.C) would NOT live under Storage — those are their own supporting contexts once real adapters appear. Storage is specifically the "file bytes" supporting context; email/queue/etc. each get their own if/when they materialize.

---

## 7. Shared entities: the Product model

`Product` is the only entity in the repo that lives in two contexts simultaneously. The table holds both marketing fields and billing fields, and both contexts legitimately read and write it.

The current schema:

```prisma
model Product {
  id              String   @id @default(cuid())
  slug            String   @unique      // ← CMS
  title           String                 // ← CMS
  description     String                 // ← CMS
  features        String[]               // ← CMS
  stripeProductId String?   @unique      // ← Billing
  isFeatured      Boolean   @default(false)  // ← CMS
  isActive        Boolean   @default(true)   // ← Billing (gates checkout)
  prices          Price[]                // ← Billing
  ...
}
```

**How to decide which context owns a read or a write.** The rule is: **does the operation affect money?** If yes, it is Billing. If no, it is CMS.

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

## 8. Cross-context invariants

A few invariants span contexts. They do not belong to any single context and are listed here explicitly.

| Invariant                       | Enforced where                                                                             | Status                                                                                               |
| ------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| **Access = Subscription State** | Planned: Billing `SubscriptionStatus` gates every LMS / Coaching read.                     | Not implemented. `apps/platform` does not currently check subscription state before serving content. |
| **Logs are Immutable**          | Application convention — athlete-log endpoints are create + delete only, no update routes. | De-facto honored. Could be strengthened by a Postgres rule or an application-layer write guard.      |
| **Money is Integer**            | Every monetary field is `Int @db.Integer`. No `Float` / `Decimal` on money.                | Enforced schema-wide.                                                                                |
| **Singleton Subscription**      | `Subscription.userId @unique`. ADR 0008.                                                   | Enforced at the DB.                                                                                  |

### Per-aggregate DB-enforced invariants

These invariants are guaranteed by database constraints (`@@unique`, `@unique`, `onDelete`). They do not require application-level guards.

| Aggregate            | Invariant                              | Constraint                      |
| -------------------- | -------------------------------------- | ------------------------------- |
| User                 | One user per email                     | `email @unique`                 |
| Subscription         | One subscription per user (singleton)  | `userId @unique`                |
| MarketingPageSection | One section per page+section-name pair | `@@unique([pageSlug, section])` |
| Product              | One product per slug                   | `slug @unique`                  |
| Product              | One product per Stripe product ID      | `stripeProductId @unique`       |
| Price                | One price per Stripe price ID          | `stripePriceId @unique`         |
| Transaction          | One transaction per provider TX ID     | `providerTxId @unique`          |
| Transaction          | One transaction per idempotency key    | `idempotencyKey @unique`        |
| MarketingBlogPost    | One post per slug                      | `slug @unique`                  |
| MarketingPage        | One page per slug                      | `slug @unique`                  |

### Application-level invariants (not DB-enforced)

| Invariant                                               | Current enforcement                                                    | Risk                                                                        |
| ------------------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Logs are immutable (create + delete only, no update)    | Application convention in endpoint code                                | No DB-level write guard; a new endpoint could accidentally add update logic |
| Money is integer (cents)                                | All monetary fields are `Int`; `centsToAmount`/`amountToCents` helpers | A developer could bypass helpers and do inline math                         |
| Coach owns plan (authorization)                         | `verifyPlanOwnership` guard in endpoint code                           | Forgotten guard = unauthorized access                                       |
| Coach-athlete relationship via `CoachAthleteAssignment` | `verifyAthleteBelongsToCoach` checks an active assignment row          | Forgotten guard = coach reads athlete data they shouldn't                   |

These are the rules a newcomer needs to know within the first hour of reading the codebase.

---

## 9. Dependency rules — what is allowed to import what

This is the authoritative direction graph. These rules are encoded in `.dependency-cruiser.cjs` and enforced in CI via `pnpm dep:check`.

```
IAM        →   (leaf, depends on nothing)
LMS        →   IAM
Coaching   →   IAM, LMS
CMS        →   IAM, Billing   (read-only: storefront reads Product + Price)
Billing    →   IAM            (no current LMS link; access-on-purchase model deferred to future Billing work)
Storage    →   (leaf supporting context — depends on nothing domain-side)
```

Storage is a supporting context, not a domain context. Its arrow points at nothing (domain-wise); any domain context is free to import from Storage when it needs upload functionality. The dependency graph reads **domain → Storage**, never the reverse — Storage has no idea what a `BlogPost` or an `AthleteProfile` is.

**Forbidden directions:**

- `IAM → any`. IAM is a leaf.
- `LMS → Coaching`. LMS must not know about action items or coach dashboards.
- `LMS → CMS`. LMS must not read marketing content.
- `LMS → Billing`. LMS does not check subscription state directly; the check happens in an upstream guard.
- `Coaching → CMS`, `Coaching → Billing`. Coaching does not render marketing content or manage subscriptions.
- `CMS → LMS`, `CMS → Coaching`. Marketing surface does not read training data or dashboards.
- `Billing → CMS`, `Billing → Coaching`. Commerce does not read marketing content or coach state.
- `Storage → any domain`. Storage is a leaf supporting context. If an upload shape needs to reference a `User` or a `TrainingPlan`, the reference belongs in the domain context, not in Storage.

**Cross-context writes:**

There are no allowed cross-context writes today. A previously sanctioned `Billing → LMS` write (purchase success creates a plan enrollment) is not currently wired — Billing has no endpoints, and the access-on-purchase flow will be designed once Billing comes online. The LMS authoring vertical and `PlanEnrollment` are now in place to receive such a write when the time comes.

Every cross-context interaction is currently a read. Reads are preferable to writes because they do not require distributed transactions.

---

## 10. De-facto non-leak: why this document can be written at all

A context map is only useful if it reflects reality. At the time this document was first written, the following was verified by grep and by reading every endpoint file:

- `apps/marketing` imports only `cmsPagesPublicApi` and `cmsContactInboundApi` from `@repo/api-server`. Both are CMS-only. No LMS, no Coaching, no Billing, no IAM writes.
- `apps/admin` imports admin CMS endpoints (`adminBlog`, `adminPages`, `adminContacts`, `adminProducts`, `adminReviews`), admin IAM (`adminUsers`, `adminUpload`), and the admin analytics dashboard (`adminDashboard`). No LMS, no Coaching. No Billing.
- `apps/platform` imports platform LMS endpoints (training-plan, plan-content for the day/session/block/item authoring tree, library catalog, plan-enrollment, plus the athlete-log shells), platform Coaching endpoints (`coachingCoachProfileApi`, `coachingAthleteProfileApi`, `coachingCoachNoteApi`, `coachingCoachActionItemApi`, `coachingCoachDashboardApi`, `coachingCoachAthletesApi`), and platform IAM. No CMS. No Billing.

**There are zero cross-context leaks between apps and the intended context for each app.** The codebase is already disciplined and the discipline is now enforced by structure: subpath exports in `@repo/contracts`, context subfolders in `api-server/endpoints/`, and the `dependency-cruiser` gate that fails CI on a violation.

It is easier to lock in correct behavior that already exists than to fix incorrect behavior that has spread. That is why this work lands now and not in six months.

---

## 11. Open questions to resolve in later bullets

Items flagged during the context-mapping pass that do not belong to any single bullet yet:

- **`CoachActionItem` reconciliation has no scheduler.** Reconciliation currently runs synchronously when a coach opens the dashboard — inefficient and means "missed workout" signals only appear when a coach looks, not when the miss happens. Needs a job queue (see ADR 0021 §3 for the queue trigger).
- ~~**`enrollment-query.ts` is the cross-boundary read between Coaching and LMS.**~~ Closed in 1.2.C — the helper moved to `endpoints/coaching/enrollment-query.ts` alongside the endpoints that consume it. Superseded by `assigned-athlete-query.ts` in Follow-up #1 after the `CoachAthleteAssignment` model landed.
- ~~**Coach access via `PlanEnrollmentStatus.ACTIVE` only is too narrow.**~~ Closed in Follow-up #1 — `verifyAthleteBelongsToCoach` and every coach-facing read now resolve athletes via `CoachAthleteAssignment`, independent of enrollment state.
- **Product split: when to split the Prisma model itself.** The current plan is to split contracts only, not the schema. If the two facets diverge further — separate lifecycles, separate audit logs, separate owners — a schema split may eventually be justified. Out of scope for 1.2.
- **Where does the Stripe webhook live.** A webhook is an inbound, not an outbound; it is a Billing handler. The handler file goes in `endpoints/billing/webhook/`. Whether it writes anything to LMS depends on the access-on-purchase model — the LMS authoring vertical and `PlanEnrollment` are in place; what remains is the Billing-side wiring.
- **`@repo/shared` split.** `centsToAmount` was a Billing primitive that lived in `shared`; it was relocated to `contracts/common/money`. Similar primitives will be pulled out of `shared` as their owning context is clarified. Tracked separately.

---

## 12. Ubiquitous language — domain glossary

These are the agreed-upon terms used in the codebase. When writing code, docs, or commit messages — use these exact words. If a term is ambiguous or missing, add it here before using it.

| Term                | Context     | Definition                                                                                                                                                 | Not to be confused with                                                              |
| ------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **User**            | IAM         | The identity record. Every person in the system is a User with a `Role`.                                                                                   | Athlete, Coach — those are role-specific profiles attached to a User                 |
| **Athlete**         | Coaching    | A User with an `AthleteProfile`. Consumes training plans.                                                                                                  | User — Athlete is a role, User is the identity                                       |
| **Coach**           | Coaching    | A User with a `CoachProfile`. Creates plans, monitors athletes.                                                                                            | Admin — Admin manages the business, Coach manages athletes                           |
| **TrainingPlan**    | LMS         | Coach-owned plan metadata with a lifecycle (DRAFT → ACTIVE → ARCHIVED). Owns the four-level authoring tree (PlanDay → PlanSession → PlanBlock → PlanItem). | Product — Product is the billing wrapper around a TrainingPlan                       |
| **WorkoutSession**  | LMS         | An athlete's training session record. Owns scheduling, completion timing, mood, perceived exertion. Holds child `BlockSession`s.                           | TrainingPlan — TrainingPlan is metadata, WorkoutSession is what the athlete did      |
| **BlockSession**    | LMS         | Child of `WorkoutSession`. Holds `archetypeKind` + `schemeParamsSnapshot` JSON.                                                                            | —                                                                                    |
| **ExerciseLog**     | LMS         | Child of `BlockSession`. Holds `exerciseSnapshot` JSON identifying the movement and metrics. Holds child `SetLog`s.                                        | —                                                                                    |
| **SetLog**          | LMS         | Per-set actuals for an `ExerciseLog` — reps, load, distance, time.                                                                                         | —                                                                                    |
| **PersonalRecord**  | LMS         | Append-only PR row, keyed by `userId` + `kind`. "Current PR for kind X" comes from `findFirst` ordered by date.                                            | —                                                                                    |
| **WeeklyVolume**    | LMS         | Aggregate row per athlete-week — total tonnage, tonnage by movement pattern, duration.                                                                     | —                                                                                    |
| **Product**         | Billing/CMS | The public-facing purchasable item on the marketing site. Has prices, features, and a slug. No current LMS plan link.                                      | TrainingPlan — Product is what athletes buy, TrainingPlan is internal coach metadata |
| **Price**           | Billing     | A specific monetary offer for a Product (amount in cents, currency, interval).                                                                             | —                                                                                    |
| **Subscription**    | Billing     | A recurring payment relationship: one User, one Price. Singleton per user (enforced by DB).                                                                | —                                                                                    |
| **Transaction**     | Billing     | A single payment event (PENDING → SUCCEEDED / FAILED). Linked to a Subscription.                                                                           | —                                                                                    |
| **CoachActionItem** | Coaching    | A system-generated or coach-created task about an athlete (missed workouts, health report).                                                                | CoachNote — ActionItem is structured and has status, Note is free-text               |
| **CoachNote**       | Coaching    | Free-text note a coach writes about an athlete. No status, no lifecycle.                                                                                   | CoachActionItem — Note is observation, ActionItem is action                          |
| **MarketingPage**   | CMS         | A page on the public site (home, about, pricing). Content stored as JSON sections.                                                                         | —                                                                                    |
| **Program**         | —           | **Not a term in the codebase.** Marketing copy may say "program" loosely. Do not use "Program" in code — use Product (billing/marketing).                  | TrainingPlan, Product                                                                |

---

## 13. How to use this document

- **When you add a new endpoint,** identify which context it belongs to first. If it does not fit any of the five contexts above, pause — you may be inventing a new context, and that is a conversation worth having.
- **When you add a new contract entity,** put it in the correct context folder (`contracts/src/entities/<context>/<entity>/`) and add its subpath export to `packages/contracts/package.json` (`"./<context>/<entity>": "./src/entities/<context>/<entity>/index.ts"`). The flat layout is gone — every entity sits inside its bounded context.
- **When you find a cross-context import that is not explicitly allowed in §9,** treat it as a bug — the rules in §8 are finite and tight on purpose, and `.dependency-cruiser.cjs` enforces them in CI. Do not rationalize it; raise a finding instead.
- **When product decisions change** (e.g., multiple concurrent subscriptions per user become a requirement), update the affected section here **before** writing code. The document is the intent; the code is the proof.

## References

- `docs/adr/0005-contracts-first-with-zod.md` — the contract-first discipline this context map reinforces.
- `docs/adr/0007-prisma-client-isolated-in-api-server.md` — the rule that puts all Prisma code in one package, which is what makes per-context endpoint reorganization possible.
- `docs/adr/0008-singleton-subscription-invariant.md` — the canonical example of a context-owned invariant enforced at the DB.
- `docs/adr/0010-bff-via-http-loopback-for-rsc.md` — the reason context-to-context reads go over HTTP today and why that might change.
- `CLAUDE.md` section "Global Invariants" — the codified system laws referenced throughout §8.
- `packages/api-server/prisma/schema.prisma` — the physical data reality every context projects from.
