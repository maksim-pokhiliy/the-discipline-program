# ROADMAP: The Discipline Program

> Last updated: 2026-03-03 (Phase 3.2 in progress)
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
- [ ] `AthleteFlag` model (INJURY/RESTRICTION/ATTENTION flags) — not in schema yet
- [ ] DB trigger: enrollment protection — not implemented (API-level check exists in delete handler)

Dashboard (9 sections):

- [x] Pulse (Coach Snapshot) — backend ✅, UI ✅ (6 metric cards)
- [x] Needs Attention — backend (reconcile + severity) ✅, UI ✅
- [x] Athletes Today — backend ✅ (`athletesSummary`), UI ✅ (5 tabs: Missed/Pending/Completed/Rest Day/No Schedule)
- [ ] Compliance / Adherence Summary — backend ✅ (`progressBuckets`), UI not started
- [ ] Load Distribution — backend ✅ (`loadDistributionToday`), UI not started
- [ ] Onboarding Tracker — backend ✅ (`onboarding`), UI not started
- [ ] Athlete Leaderboard — not started
- [ ] PR & Benchmark Changes — backend not started, UI not started
- [ ] Quick Actions — UI not started

Training Plans:

- [x] Backend: full CRUD + archive/restore/activate/duplicate endpoints
- [x] API client + React Query hooks
- [x] Archive-first delete flow (ACTIVE → archive → delete from ARCHIVED)
- [x] Plan duplication (deep copy: workouts → blocks → prescribed sets)
- [x] Enriched list data (workouts count, enrolled athletes, last activity, linked products)
- [ ] UI: list page with filter tabs — backend ready, UI is stub (was implemented, reset in `0af5807`)
- [ ] UI: create/edit form — backend ready, UI is stub

Known bug: Dashboard loading flash — reconcile mutation races with getDashboard query, causing ~2s delay where action items appear empty.

Recent notes (`recentNotes`) are returned from API but not rendered — no dedicated section yet.

### 3.3 Coach: Workout builder

Backend layer (contracts + API server + route handlers): ✅ complete

- [x] Contracts: Workout, WorkoutBlock, PrescribedSet — full CRUD schemas
- [x] API Server: CRUD endpoints with ownership verification and mappers
- [x] Route handlers: all protected with `withPlatformAuth`

Frontend layer: not started

- [ ] API client endpoints + React Query hooks (workouts, blocks, sets)
- [ ] Plan detail page = workout builder entry point
- [ ] Workouts as accordion items (sorted by scheduledDate)
- [ ] Add/edit/delete workouts (dialog)
- [ ] Blocks within workout (category, rounds, time cap)
- [ ] Prescribed sets within block (exercise picker, sets, reps, weight, unit, RPE, notes)
- [ ] Lazy loading: workouts → blocks → sets per level

### 3.4 Coach: Exercise library

Backend layer: ✅ complete (contracts, API server, route handlers, API client + hooks)

- [ ] Browse exercises from platform (with search/filter by category)
- [ ] Add new exercise (name, description, video URL, category)
- [ ] Add new category
- [ ] Integrated into workout builder (inline create when exercise not found)

### 3.5 Coach: Athlete management

Backend layer: ✅ complete (enrollments CRUD, coach notes CRUD, athlete profile get/upsert, action items)

Missing API client: planEnrollments, athleteProfile hooks not created

- [ ] View athletes enrolled in plans (derived from PlanEnrollment)
- [ ] Enroll/unenroll athletes from plans
- [ ] View athlete profile and benchmarks
- [ ] View athlete workout logs
- [ ] Coach notes per athlete (CRUD) — backend + hooks ready
- [ ] Athlete flags (INJURY/RESTRICTION/ATTENTION) with resolve — schema not created yet

### 3.6 Coach: Benchmarks

Backend layer: ✅ complete (BenchmarkDefinition CRUD, UserBenchmark CRUD, route handlers)

Missing API client: benchmarkDefinitions, userBenchmarks hooks not created

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
