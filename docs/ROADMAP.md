# ROADMAP: The Discipline Program

> Last updated: 2026-02-20 (Phase 3.2 in progress)
> Approach: Quality > Speed. Sequential execution. No deadlines.
> Product concept: see docs/ARCHITECTURE.md

## Phase 0 — Foundation (Complete)

| Area                                                      | Status                     |
| --------------------------------------------------------- | -------------------------- |
| DB Schema (core entities)                                 | ✅                         |
| Marketing site                                            | ✅ (billing flow excluded) |
| Admin CMS (blog, pages, reviews, products, contacts)      | ✅                         |
| Admin Platform (exercises + categories, users, dashboard) | ✅                         |
| API (serves admin + marketing)                            | ✅                         |
| CRUD boilerplate elimination                              | ✅ (PR #92)                |

### Known schema debt

- `Product.stripeProductId`, `Price.stripePriceId` — hardcoded to Stripe. Rename when payment provider is chosen.
- `Subscription.id` has no `@default(cuid())` — expects external provider ID. Review when billing starts.
- ~`Product.trainingPlanId` exists as field but missing `@relation` definition.~ Fixed in Phase 2.

---

## Phase 1 — Training Core: Contracts + API (Complete)

**Goal:** Full contract and API layer for the training domain. No UI.

### 1.1 CoachProfile & AthleteProfile ✅

### 1.2 TrainingPlan ✅

### 1.3 Workout ✅

### 1.4 WorkoutBlock + PrescribedSet ✅

### 1.5 WorkoutLog + SetLog ✅

### 1.6 Verification ✅

---

## Phase 2 — Schema Extension + Data Layer (Complete)

**Goal:** Complete the data model for the full product vision. Add missing entities, contracts, and API endpoints.

### 2.1 Platform app scaffolding ✅

### 2.2 Schema: new entities ✅

### 2.3 Contracts + API: PlanEnrollment ✅

### 2.4 Contracts + API: Benchmarks ✅

### 2.5 Platform exercise access ✅

### 2.6 Admin role protection ✅

### 2.7 Verification ✅

---

## Phase 3 — Platform App: Coach Experience

**Goal:** Coach can manage training programs, exercises, athletes, and benchmarks through the platform UI.

**Why after Phase 2:** Data model must be complete before building UI (Rule #3: no mocks, no fakes).

### 3.1 App infrastructure ✅

- [x] Auth middleware / route protection (role-based)
- [x] Role-based routing: COACH vs USER layout groups
- [x] Coach navigation structure (5 tabs: Home, Plans, Athletes, Exercises, Profile)
- [x] API client layer (endpoints + hooks)
- [x] Login page

### 3.2 Coach: Dashboard & Training Plan management

Schema changes:

- [x] `User.name: String?` (moved from AthleteProfile — design debt resolved)
- [x] `TrainingPlanStatus` enum (DRAFT → ACTIVE → ARCHIVED), replaces `isActive: Boolean`
- [x] `CoachNote` model (coach→athlete notes)
- [x] `AthleteFlag` model (INJURY/RESTRICTION/ATTENTION flags)
- [x] DB trigger: enrollment protection (prevents soft-deleting plans with active enrollments)

Dashboard (7 sections):

- [ ] Needs Attention — priority-sorted alerts requiring coach intervention (missed workouts, unreviewed logs, injuries, subscription issues, new enrollees)
- [ ] Today Overview — athletes scheduled today with completion status, plan info, last activity
- [ ] Athlete Activity Feed — reverse-chronological stream of athlete events (completions, substitutions, benchmarks, enrollments, status changes)
- [ ] Compliance / Adherence Summary — weekly adherence %, active athletes count, missed sessions, per-plan engagement metrics
- [ ] PR & Benchmark Changes — personal records and benchmark improvements from current week
- [ ] Quick Actions — shortcuts: create plan, add workout, add athlete to plan, add exercise, view athletes, manage benchmarks
- [ ] Coach Snapshot — portfolio overview: total active athletes, active plans, new athletes in period, paused/completed enrollments

Training Plans:

- [x] List with filter tabs (All/Active/Draft/Archived), mobile-first cards
- [x] Create/edit plan (FormView)
- [x] Archive-first delete flow (ACTIVE → archive → delete from ARCHIVED)
- [x] Plan duplication (deep copy: workouts → blocks → prescribed sets)
- [x] Enriched list data (workouts count, enrolled athletes, last activity, linked products)

### 3.3 Coach: Workout builder

- [ ] Plan detail page = workout builder entry point
- [ ] Workouts as accordion items (sorted by dayOrder)
- [ ] Add/edit/delete workouts (dialog)
- [ ] Blocks within workout (category, rounds, time cap)
- [ ] Prescribed sets within block (exercise picker, sets, reps, weight, unit, RPE, notes)
- [ ] Lazy loading: workouts → blocks → sets per level

### 3.4 Coach: Exercise library

- [ ] Browse exercises from platform (with search/filter by category)
- [ ] Add new exercise (name, description, video URL, category)
- [ ] Add new category
- [ ] Integrated into workout builder (inline create when exercise not found)

### 3.5 Coach: Athlete management

- [ ] View athletes enrolled in plans (derived from PlanEnrollment)
- [ ] Enroll/unenroll athletes from plans
- [ ] View athlete profile and benchmarks
- [ ] View athlete workout logs
- [ ] Coach notes per athlete (CRUD)
- [ ] Athlete flags (INJURY/RESTRICTION/ATTENTION) with resolve

### 3.6 Coach: Benchmarks

- [ ] Manage benchmark catalog (CRUD definitions)
- [ ] Add/update benchmarks on athlete profiles
- [ ] View benchmarks dashboard per athlete

---

## Phase 4 — Platform App: Athlete Experience

**Goal:** Athletes see their program, train, log, and track progress.

### 4.1 Onboarding & profile

- [ ] Athlete profile setup (name, gender, height, weight)
- [ ] Benchmarks input (select from catalog, enter values)

### 4.2 Training

- [ ] View assigned training plan(s) and workouts
- [ ] Workout view (prescribed sets with targets)
- [ ] Workout completion (mark as done)
- [ ] Detailed workout logging (SetLog: reps, weight, RPE per exercise)
- [ ] Exercise substitution support
- [ ] Rx/scaled tracking

### 4.3 Progress

- [ ] Workout history
- [ ] PR tracking (computed best results from logs)
- [ ] Benchmark history and trends

---

## Phase 5 — Billing

**Goal:** Accept payments. Control platform access via subscription state. Auto-enroll on purchase.

**Payment provider:** TBD. Architecture must be provider-agnostic.

### 5.1 Provider selection & schema alignment

- [ ] Choose payment provider
- [ ] Rename stripe-specific fields (providerProductId, providerPriceId)
- [ ] Provider SDK integration in api-server

### 5.2 Billing contracts + API

- [ ] Subscription contracts
- [ ] Transaction contracts
- [ ] Checkout flow, subscription management, webhook handler
- [ ] Idempotent webhook processing

### 5.3 Auto-enrollment on purchase

- [ ] Product → TrainingPlan link in admin product form
- [ ] Purchase webhook → auto-create PlanEnrollment
- [ ] Handle edge cases (plan deleted, product archived)

### 5.4 Access control

- [ ] Subscription-gated access in Platform app
- [ ] Status check: ACTIVE | TRIAL | PAST_DUE (grace period 72h)

### 5.5 Marketing checkout integration

- [ ] Storefront → checkout → provider → success/error pages

---

## Phase 6 — Admin Billing Views + Release Polish

**Goal:** Admin visibility into billing. Final quality pass.

### 6.1 Admin billing

- [ ] Subscription list/detail views
- [ ] Transaction history
- [ ] Revenue metrics in dashboard

### 6.2 Admin benchmark catalog management

- [ ] BenchmarkDefinition CRUD in admin UI

### 6.3 Polish

- [ ] E2E testing (coach creates → athlete subscribes → athlete trains → coach reviews)
- [ ] PWA enhancements (offline, push notifications)
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] SEO final pass on marketing

---

## Execution Rules

1. **Sequential only.** One phase at a time. One step at a time.
2. **Each step verified.** `check-types` + `build` after every meaningful change.
3. **No mocks, no fakes.** If the data layer doesn't support it, UI doesn't pretend it does.
4. **Schema first.** Any new data need starts at `schema.prisma`, flows down through contracts → API → UI.
5. **Payment provider agnostic.** No provider-specific code until provider is chosen.
6. **Concept is law.** All decisions aligned with docs/ARCHITECTURE.md.
