# Athletes Page — Product Spec

## Purpose

Dashboard answers "what's happening right now?" (today, this week, alerts).
Athletes page answers "who are my athletes and how are they doing overall?" — roster management, entry point to each athlete's profile.

## Route

`/coach/athletes`

## Sections

### 1. Search + Filters (URL state)

- Search by name/email
- Filter by health status (Healthy / Injured / Restricted)
- Filter by training plan (select from active plans)
- Filter by trend (Improving / Stagnating / Declining)

### 2. Summary Strip

3-4 key numbers above the list:

- Total athletes
- Injured / Restricted count (accent if > 0)
- Avg engagement rate
- Open action items

### 3. Athlete List

Cards with:

- Avatar + Name + Email
- Current plan (or "No active plan")
- Health status chip
- Completion rate + trend arrow
- Days since last activity
- Badge with open action items count (if any)
- Click -> `/coach/athletes/[userId]`

## Out of Scope

- Today's statuses (that's dashboard)
- Enrolling athletes to plans (that's on the plan page via enroll dialog)
- Workout logs (that's detail page)

## Backend

Dedicated endpoint: `GET /api/platform/coach/athletes`

Returns per athlete:

- Profile + enrollment + completion rate + trend + action items count
- Server-side filtering (health, plan, trend)
- Pagination

Implementation: combine existing `computeAthletesSummary()` and `computeProgressBuckets()` utilities from `packages/api-server/src/utils/dashboard-computations.ts` into a new service function with filter support.

This endpoint also serves as foundation for the future detail page (`/coach/athletes/[userId]`).

## Data Flow

```
DB Schema -> Contracts (Zod) -> API Server -> API Route -> Client UI
```

New artifacts needed:

1. `packages/contracts/src/entities/coach-athletes/` — request/response schemas
2. `packages/api-server/src/endpoints/platform/coach-athletes.ts` — service layer
3. `apps/platform/src/app/api/platform/coach/athletes/route.ts` — route handler
4. `apps/platform/src/lib/hooks/use-coach-athletes.ts` — React Query hook
5. `apps/platform/src/modules/athletes/` — page module with sections
