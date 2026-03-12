Plan: Coach Plan Editor — Week View, Workout Editor, Calendar, % Weights

Context

Coach plans training programs for athletes. A plan can run for years with hundreds of workouts. The coach's primary workflow: open the platform on
weekends → plan next week across multiple plans → create/edit workouts with blocks and exercises.

What exists:

- ✅ Prisma schema: TrainingPlan → Workout → WorkoutBlock → PrescribedSet → PlanEnrollment
- ✅ Backend CRUD: all endpoints for plans, workouts, blocks, sets, enrollments
- ✅ Route handlers: all exist in apps/platform/src/app/api/platform/
- ✅ API client + hooks: only for TrainingPlans
- ✅ UI: Plans list page with status tabs, cards, create dialog, action menu
- ❌ API clients + hooks for workouts, blocks, sets, enrollments
- ❌ Plan Detail page (stub)
- ❌ Workout Detail page (doesn't exist)
- ❌ Calendar view (doesn't exist)
- ❌ Weight percentage support (no WeightType enum, no AthleteMax model)

Product decisions (confirmed by user):

- Multiple workouts per day allowed
- Copy week = clone workouts with +7 day shift (no templates yet)
- Weight prescription: both absolute and percentage of 1RM, with auto-calculation
- Cross-plan calendar = tab within Plans page (not a separate nav item)
- Navigation stays unchanged: Home, Plans, Athletes, Exercises, Profile

---

Phase 1: Schema + Contracts (foundation)

1.1 Prisma Schema Changes

File: packages/api-server/prisma/schema.prisma

Add WeightType enum:
enum WeightType {
ABSOLUTE
PERCENTAGE
}

Add weightType field to PrescribedSet:
model PrescribedSet {
...
weightType WeightType @default(ABSOLUTE)
...
}

Add AthleteMax model:
model AthleteMax {
id String @id @default(cuid())
userId String
exerciseId String
value Decimal @db.Decimal(6, 2)
unit WeightUnit @default(KG)
testedAt DateTime @default(now())
createdAt DateTime @default(now())

user User @relation(fields: [userId], references: [id])
exercise Exercise @relation(fields: [exerciseId], references: [id])

@@index([userId, exerciseId, testedAt])
}

Add relation arrays to User and Exercise models.

Run: pnpm db:generate && pnpm db:push

1.2 Contracts: Update PrescribedSet

Files: packages/contracts/src/entities/prescribed-set/

- prescribed-set.constants.ts — add WeightType enum (ABSOLUTE, PERCENTAGE), WEIGHT_TYPE_LABELS
- prescribed-set.schema.ts — add weightType to schemas (base, create, update)
- prescribed-set.types.ts — types auto-update from schema inference

  1.3 Contracts: New AthleteMax Entity

Create: packages/contracts/src/entities/athlete-max/

Files:

- athlete-max.schema.ts — athleteMaxSchema, createAthleteMaxSchema, updateAthleteMaxSchema
- athlete-max.types.ts — AthleteMax, CreateAthleteMaxData, UpdateAthleteMaxData
- athlete-max-api.schema.ts — request/response schemas
- athlete-max-api.types.ts — API types
- athlete-max.constants.ts — constants if needed
- index.ts — barrel export

Add export path to packages/contracts/package.json and barrel export to packages/contracts/src/index.ts.

1.4 Contracts: Calendar Types

File: packages/contracts/src/entities/training-plan/training-plan-api.schema.ts

Add schema for calendar response — array of workouts enriched with plan name/id, grouped for a date range.

---

Phase 2: API Server + API Clients + Hooks

2.1 AthleteMax Backend

Create: packages/api-server/src/endpoints/platform/athlete-maxes.ts

Endpoints:

- getAll(userId, exerciseId?) — all maxes for coach's athletes, optionally filtered by exercise
- getByAthleteAndExercise(userId, athleteUserId, exerciseId) — latest max for specific athlete+exercise
- getForPlanExercises(userId, planId, exerciseIds) — batch: latest maxes for all enrolled athletes for given exercises (used by workout editor)
- create(userId, data) — create max record
- delete(userId, id) — delete max record

  2.2 Calendar Aggregate Endpoint

File: packages/api-server/src/endpoints/platform/training-plans.ts

Add getCalendarWeek(userId, weekStart: Date):

- Fetches all workouts across all active plans for the coach within the 7-day range
- Returns workouts enriched with plan name, plan id, plan status
- Ordered by scheduledDate, then createdAt

  2.3 Copy Week Endpoint

File: packages/api-server/src/endpoints/platform/workouts.ts

Add copyWeek(userId, planId, sourceDate: Date, targetDate: Date):

- Finds all workouts in the plan within source week (7 days from sourceDate)
- Deep clones each (workout + blocks + sets) with scheduledDate shifted by the day difference
- Returns created workouts
- Runs in a transaction

  2.4 Route Handlers for New Endpoints

Create:

- apps/platform/src/app/api/platform/athlete-maxes/route.ts — GET, POST
- apps/platform/src/app/api/platform/athlete-maxes/[id]/route.ts — GET, DELETE
- apps/platform/src/app/api/platform/training-plans/calendar/route.ts — GET (query param: weekStart)
- apps/platform/src/app/api/platform/training-plans/[planId]/copy-week/route.ts — POST

  2.5 API Clients (Platform App)

Create in apps/platform/src/lib/api/endpoints/:

- workouts.ts — createWorkoutsAPI: getAll(planId), getById(planId, id), create(planId, data), update(planId, id, data), delete(planId, id)
- workout-blocks.ts — createWorkoutBlocksAPI: getAll(workoutId), create(workoutId, data), update(workoutId, id, data), delete(workoutId, id)
- prescribed-sets.ts — createPrescribedSetsAPI: getAll(blockId), create(blockId, data), update(blockId, id, data), delete(blockId, id)
- plan-enrollments.ts — createPlanEnrollmentsAPI: getAll(planId), create(planId, data), update(planId, id, data), delete(planId, id)
- athlete-maxes.ts — createAthleteMaxesAPI: getForPlanExercises(planId, exerciseIds), create(data), delete(id)
- calendar.ts — createCalendarAPI: getWeek(weekStart)
- Update training-plans.ts — add copyWeek(planId, sourceDate, targetDate)

Update apps/platform/src/lib/api/endpoints/index.ts with all new exports.

2.6 React Query Hooks (Platform App)

Create in apps/platform/src/lib/hooks/:

- use-workouts.ts — useWorkouts(planId), useWorkout(planId, id), useCreateWorkout(), useUpdateWorkout(), useDeleteWorkout()
- use-workout-blocks.ts — useWorkoutBlocks(workoutId), useCreateWorkoutBlock(), useUpdateWorkoutBlock(), useDeleteWorkoutBlock()
- use-prescribed-sets.ts — usePrescribedSets(blockId), useCreatePrescribedSet(), useUpdatePrescribedSet(), useDeletePrescribedSet()
- use-plan-enrollments.ts — usePlanEnrollments(planId), useCreatePlanEnrollment(), useUpdatePlanEnrollment(), useDeletePlanEnrollment()
- use-athlete-maxes.ts — useAthleteMaxesForPlan(planId, exerciseIds), useCreateAthleteMax(), useDeleteAthleteMax()
- use-calendar.ts — useCalendarWeek(weekStart)
- Update use-training-plans.ts — add useCopyWeek()

---

Phase 3: Plan Detail Page (Week View + Athletes)

3.1 Page Setup

File: apps/platform/src/app/coach/plans/[planId]/page.tsx

Server component: fetch plan data via serverApi, pass to client component.

3.2 Module Structure

Create: apps/platform/src/modules/plan-detail/

plan-detail/
views/
plan-detail-view.tsx — root client component, tabs
sections/
plan-schedule-section.tsx — week view with workouts
plan-athletes-section.tsx — enrolled athletes management
components/
week-navigator.tsx — ◄ Week 10 — Mar 9-15 ►, prev/next/today
week-day-group.tsx — single day: date header + workout cards
week-workout-card.tsx — compact workout card (title, block count, tap to open)
create-workout-dialog.tsx — modal: title, date (pre-filled), description
copy-week-button.tsx — triggers copy of previous week's workouts
enroll-athlete-dialog.tsx — modal: search/select athlete to enroll
enrollment-card.tsx — athlete row with status, dates, action menu
enrollment-action-menu.tsx — pause/complete/remove actions
index.ts

3.3 Plan Detail View

plan-detail-view.tsx:

- Fetches plan by ID via useTrainingPlan(planId)
- Plan header: name + status chip + action menu (inline editable name/description)
- MUI Tabs: "Schedule" | "Athletes"
- URL state for active tab: ?tab=schedule / ?tab=athletes

  3.4 Schedule Section (Week View)

plan-schedule-section.tsx:

- useWorkouts(planId) — fetches all workouts (API returns sorted by scheduledDate)
- Client-side filters workouts to current week (from weekStart URL param)
- Week navigator at top (prev/next arrows, "today" button)
- Groups workouts by day → renders WeekDayGroup for each day
- Days with no workouts show "Rest day" + "+" button
- Bottom: "Copy previous week" button

week-navigator.tsx:

- Stores current week start in URL param ?week=2026-03-09
- Prev/Next shift by 7 days
- "Today" button jumps to current week
- Displays: "Week N — Mon D – Sun D, Month Year"

week-day-group.tsx:

- Date header (day of week + date)
- List of WeekWorkoutCard components
- "+" button to add workout (opens CreateWorkoutDialog with date pre-filled)

week-workout-card.tsx:

- Title, block count, brief info
- Click → navigate to /coach/plans/[planId]/workouts/[workoutId]
- Action menu: edit, move to another day, duplicate, delete

  3.5 Athletes Section

plan-athletes-section.tsx:

- usePlanEnrollments(planId) — fetches enrolled athletes
- List of EnrollmentCard components
- FAB or button: "+ Add Athlete" → opens EnrollAthleteDialog

enroll-athlete-dialog.tsx:

- Autocomplete search across coach's athletes (need endpoint: users with active subscription under this coach)
- Select athlete → POST enrollment with status ACTIVE
- Filters out already-enrolled athletes

enrollment-card.tsx:

- Avatar/name, status chip, start date
- Action menu: Pause, Complete, Remove (with ConfirmationModal for remove)

---

Phase 4: Workout Detail Page (Editor)

4.1 Page Setup

Create: apps/platform/src/app/coach/plans/[planId]/workouts/[workoutId]/page.tsx

Server component: fetch workout data, pass to client.

4.2 Module Structure

Create: apps/platform/src/modules/workout-detail/

workout-detail/
views/
workout-detail-view.tsx — root client component
sections/
workout-blocks-section.tsx — list of blocks with add button
components/
workout-header.tsx — title, date, description (inline editable)
workout-block-card.tsx — accordion: category header + sets list
workout-block-header.tsx — category name, rounds, timeCap, actions
prescribed-set-card.tsx — compact card for one exercise prescription
prescribed-set-edit-form.tsx — expanded inline edit form for a set
add-block-button.tsx — "+ Block" with category selection
add-set-button.tsx — "+ Exercise" with exercise autocomplete
exercise-autocomplete.tsx — exercise search/select with category filter
weight-type-toggle.tsx — ABSOLUTE ↔ PERCENTAGE radio toggle
calculated-weights-list.tsx — shows calculated kg for each enrolled athlete
index.ts

4.3 Workout Detail View

workout-detail-view.tsx:

- Back link to plan detail
- useWorkout(planId, workoutId) for header data
- useWorkoutBlocks(workoutId) for blocks
- Renders WorkoutHeader + WorkoutBlocksSection

  4.4 Inline Editing Pattern

All editable fields follow the same pattern:

1.  Display mode: shows value as text (Typography)
2.  Tap/click: switches to edit mode (TextField)
3.  On blur or Enter: triggers mutation (PUT request)
4.  Shows loading indicator during save

Implemented as a reusable hook or component: useInlineEdit(mutationFn) or InlineEditField.

Blocks and sets use individual mutations — each field change saves independently. No global "Save" button.

4.5 Block Accordion

workout-block-card.tsx:

- MUI Accordion (or custom expandable)
- Header: category name (from included category relation), rounds badge, timeCap badge, action menu (delete block)
- Expanded content: list of PrescribedSetCard + "Add Exercise" button
- usePrescribedSets(blockId) fetched per block

  4.6 PrescribedSet Card (Compact View)

prescribed-set-card.tsx:

- Exercise name
- Formatted prescription: "5×5 · 75% (82.5 kg)" or "4×10 · 30 kg · RPE 8"
- Notes preview (truncated)
- Tap → expands to PrescribedSetEditForm (inline, not a modal)
- Action menu: delete (with confirmation)

  4.7 PrescribedSet Edit Form (Expanded Inline)

prescribed-set-edit-form.tsx:

- Exercise: Autocomplete (read-only after creation — changing exercise = delete + create new)
- Row 1: Sets [input] × Reps [input]
- Row 2: Weight type toggle (Absolute | Percent) + Value input + Unit select (KG/LB, only for absolute)
- Row 3: RPE [input 1-10]
- Row 4: Notes [multiline text]
- Row 5 (if weightType=PERCENTAGE): Calculated weights per athlete
  - Fetches via useAthleteMaxesForPlan(planId, [exerciseId])
  - Displays: "Ivan: 82.5 kg · Maria: 67.5 kg · Oleg: no 1RM"
- Each field saves on blur via useUpdatePrescribedSet()

  4.8 Adding a Block

add-block-button.tsx:

- Button opens a small popover/dialog
- Category autocomplete (from exercise categories)
- Optional: rounds, timeCap
- Submit → useCreateWorkoutBlock() → block appears in the list

  4.9 Adding an Exercise to Block

add-set-button.tsx:

- Button inside block's expanded content
- Opens ExerciseAutocomplete inline
- On select → useCreatePrescribedSet(blockId, { exerciseId }) — creates skeleton set
- New set card appears, auto-expanded for editing
- Coach fills in sets, reps, weight, etc.

---

Phase 5: Calendar Tab (Cross-Plan Week View inside Plans Page)

Calendar is NOT a separate page — it's a tab within the existing /coach/plans page.

5.1 Refactor Plans Page

File: apps/platform/src/app/coach/plans/page.tsx

The Plans page becomes a two-tab view:

- Tab "Calendar" — cross-plan weekly view (default tab)
- Tab "Plans" — current plans list (PlansListSection moved here)

URL state: /coach/plans?tab=calendar&week=2026-03-09 or /coach/plans?tab=list

5.2 Update Plans Module

Refactor: apps/platform/src/modules/plans/

Add to existing module:
plans/
views/
plans-view.tsx — refactor: add top-level tabs (Calendar | Plans)
sections/
plans-list-section.tsx — existing, moved under "Plans" tab
plans-calendar-section.tsx — NEW: cross-plan week view
components/
...existing plan components...
calendar-workout-card.tsx — workout card with plan name badge
calendar-add-workout-dialog.tsx — create workout: select plan + title + date

5.3 Calendar Section

plans-calendar-section.tsx:

- useCalendarWeek(weekStart) — fetches all workouts across all active plans
- Reuses WeekNavigator from shared components (also used by Plan Detail)
- Groups workouts by day → renders day groups
- Each workout card shows: plan name + workout title + block count
- Click → navigates to /coach/plans/[planId]/workouts/[workoutId]
- "+" on any day → CalendarAddWorkoutDialog (select plan → title → date pre-filled)

  5.4 Shared Week Components

Extract to apps/platform/src/lib/components/week/:

- week-navigator.tsx — ◄ Week N — Date Range ►, reused in Calendar tab and Plan Detail
- week-day-group.tsx — single day rendering, accepts render prop for workout card variant

  5.5 Navigation

No changes to bottom nav. Navigation stays: Home, Plans, Athletes, Exercises, Profile.

---

Verification

After each phase:

- pnpm check-types — TypeScript validation
- pnpm lint — ESLint
- pnpm build — Full build

End-to-end flow to test:

1.  Open /coach/plans → see Calendar tab (default) with week view
2.  Switch to "Plans" tab → see plans list (existing functionality preserved)
3.  Create a plan → navigate to plan detail → see empty week view
4.  Add a workout to Monday → see it appear
5.  Open workout → add a block (select category) → add exercise → fill in sets/reps/weight
6.  Toggle weight to PERCENTAGE → see calculated weights (after adding AthleteMax records)
7.  Enroll an athlete in the plan (Athletes tab)
8.  Go back to Plans → Calendar tab → see workouts from all plans
9.  Copy previous week → verify workouts cloned with +7 day shift
10. Navigate between weeks → verify URL state preserved (?tab=calendar&week=...)
    ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌

Claude has written up a plan and is ready to execute. Would you like to proceed?

❯ 1. Yes, clear context (38% used) and auto-accept edits 2. Yes, auto-accept edits 3. Yes, manually approve edits 4. Type here to tell Claude what to change

ctrl-g to edit in VS Code · ~/.claude/plans/concurrent-waddling-unicorn.md
