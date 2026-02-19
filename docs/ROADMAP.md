# ROADMAP: The Discipline Program

> Last updated: 2026-02-19
> Approach: Quality > Speed. Sequential execution. No deadlines.

## Current State (Phase 0 — Complete)

Foundation built. Architecture enforced. All layers aligned.

| Area                                                      | Status                              |
| --------------------------------------------------------- | ----------------------------------- |
| DB Schema (all entities)                                  | ✅ Complete                         |
| Marketing site                                            | ✅ Complete (billing flow excluded) |
| Admin CMS (blog, pages, reviews, products, contacts)      | ✅ Complete                         |
| Admin Platform (exercises + categories, users, dashboard) | ✅ Complete                         |
| API (serves admin + marketing)                            | ✅ Complete                         |
| CRUD boilerplate elimination                              | ✅ Complete (PR #92)                |
| `pnpm check-types` passes                                 | ✅                                  |

### What exists in schema but has NO contracts/API/UI:

- `TrainingPlan`, `Workout`, `WorkoutBlock`, `PrescribedSet` — Training core
- `WorkoutLog`, `SetLog` — Athlete workout logging
- `Subscription`, `Transaction` — Billing (provider TBD, NOT necessarily Stripe)
- `AthleteProfile`, `CoachProfile` — Contracts exist partially, no meaningful API/UI

### Known schema debt:

- `Product.stripeProductId`, `Price.stripePriceId` — hardcoded to Stripe. Will need renaming when payment provider is chosen (e.g. `providerProductId`, `providerPriceId`).
- `Subscription.id` has no `@default(cuid())` — likely expects external provider ID. Review when billing starts.

---

## Phase 1 — Training Core (Contracts + API)

**Goal:** Full contract and API layer for the training domain. No UI yet.

**Why first:** This is the product. Without training plans and workout logging, there's nothing to sell or use.

**Order:** DB Schema (done) → Contracts (Zod) → API Server endpoints → API Route Handlers.

### 1.1 CoachProfile & AthleteProfile — flesh out contracts + API

Contracts exist partially. Need:

- [ ] Review and complete `coach-profile` contracts (schema, types, API request/response)
- [ ] Review and complete `athlete-profile` contracts
- [ ] API Server endpoints: CRUD for profiles
- [ ] API Route Handlers

### 1.2 TrainingPlan — contracts + API

- [ ] Create `packages/contracts/src/entities/training-plan/`
  - `training-plan.schema.ts` — Zod schemas
  - `training-plan.types.ts` — inferred types
  - `training-plan-api.schema.ts` — request/response schemas
  - `training-plan-api.types.ts` — API types
  - `index.ts` — barrel export
- [ ] API Server: `endpoints/platform/training-plans.ts` (or coach-scoped)
  - getAll (by coachId), getById, create, update, delete (soft)
- [ ] API Route Handlers
- [ ] Mapper: `training-plan.mapper.ts`

### 1.3 Workout — contracts + API

- [ ] Create `packages/contracts/src/entities/workout/`
- [ ] Full entity contract structure (schema, types, API schemas)
- [ ] Workout belongs to TrainingPlan, has dayOrder, blocks
- [ ] API Server endpoints: CRUD scoped to plan
- [ ] API Route Handlers
- [ ] Mapper

### 1.4 WorkoutBlock + PrescribedSet — contracts + API

- [ ] Create `packages/contracts/src/entities/workout-block/`
- [ ] Create `packages/contracts/src/entities/prescribed-set/`
- [ ] These are nested within Workout — may be managed as part of Workout CRUD (nested create/update) rather than standalone endpoints. Decision during implementation.
- [ ] API Server endpoints
- [ ] API Route Handlers

### 1.5 WorkoutLog + SetLog — contracts + API

- [ ] Create `packages/contracts/src/entities/workout-log/`
- [ ] Create `packages/contracts/src/entities/set-log/`
- [ ] WorkoutLog: athlete creates log for a workout session
- [ ] SetLog: individual set records, supports exercise substitution
- [ ] Immutability invariant: logs never change (Global Invariant #3)
- [ ] API Server endpoints
- [ ] API Route Handlers

### 1.6 Verification

- [ ] `pnpm check-types` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm build` passes
- [ ] All contracts follow entity structure convention
- [ ] No Prisma types leak into contracts

---

## Phase 2 — Platform App: Coach Experience

**Goal:** Coach can create and manage training programs.

**Why second:** Content must exist before athletes can consume it.

### 2.1 App scaffolding

- [ ] Create `apps/platform` (Next.js, PWA-ready, mobile-first)
- [ ] Auth integration (NextAuth, role-based)
- [ ] Role-based routing: COACH vs USER (Athlete)
- [ ] Navigation structure
- [ ] API client setup (`packages/api-client` integration)

### 2.2 Coach: Training Plan management

- [ ] List plans (dashboard view)
- [ ] Create/edit plan (name, description)
- [ ] Activate/deactivate plan

### 2.3 Coach: Workout builder

- [ ] List workouts within a plan (day order)
- [ ] Create/edit workout
- [ ] Workout block editor (group exercises by category)
- [ ] Prescribed set editor (exercise picker, sets, reps, weight, RPE)

### 2.4 Coach: Athlete oversight

- [ ] View assigned athletes
- [ ] View athlete workout logs and progress

---

## Phase 3 — Billing

**Goal:** Accept payments. Control platform access via subscription state.

**Why third:** Invariant #5 — access = subscription state. Athletes need this before they can use the platform.

**Payment provider:** TBD. Architecture must be provider-agnostic where possible.

### 3.1 Provider selection & schema alignment

- [ ] Choose payment provider
- [ ] Align schema fields (rename stripe-specific fields if needed)
- [ ] Provider SDK integration in `api-server`

### 3.2 Billing contracts + API

- [ ] Create `packages/contracts/src/entities/subscription/`
- [ ] Create `packages/contracts/src/entities/transaction/`
- [ ] API: checkout flow, subscription management, webhook handler
- [ ] Idempotent webhook processing (Global Invariant: DB is source of truth)

### 3.3 Access control middleware

- [ ] Subscription-gated access in Platform app
- [ ] Status check: ACTIVE | TRIAL | PAST_DUE (within grace period)
- [ ] Grace policy: 72 hours

### 3.4 Marketing checkout integration

- [ ] Storefront → checkout → provider → success/error pages
- [ ] Complete payment success/error pages (currently stubs)

---

## Phase 4 — Platform App: Athlete Experience

**Goal:** Athletes subscribe, train, log workouts, track progress.

### 4.1 Onboarding & profile

- [ ] Athlete registration flow
- [ ] Profile setup (AthleteProfile: name, gender, height, weight)
- [ ] Subscription activation

### 4.2 Training

- [ ] View assigned training plan and workouts
- [ ] Workout execution view (prescribed sets with targets)
- [ ] Workout logging (SetLog creation, exercise substitution support)
- [ ] Rx/scaled tracking (isRx flag)

### 4.3 Progress

- [ ] Workout history
- [ ] Progress tracking / trends

---

## Phase 5 — Admin Billing Views + Release Polish

**Goal:** Admin visibility into billing. Final quality pass.

### 5.1 Admin billing

- [ ] Subscription list/detail views in admin
- [ ] Transaction history
- [ ] Revenue metrics in dashboard

### 5.2 Polish

- [ ] E2E testing of full flow (coach creates → athlete subscribes → athlete trains → coach reviews)
- [ ] PWA enhancements (offline, push notifications)
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] SEO final pass on marketing

---

## Execution Rules

1. **Sequential only.** One phase at a time. One step at a time.
2. **Each step verified.** `check-types` + `lint` after every meaningful change.
3. **No mocks, no fakes.** If the data layer doesn't support it, UI doesn't pretend it does.
4. **Schema first.** Any new data need starts at `schema.prisma`, flows down through contracts → API → UI.
5. **Payment provider agnostic.** No Stripe-specific code until provider is chosen.
