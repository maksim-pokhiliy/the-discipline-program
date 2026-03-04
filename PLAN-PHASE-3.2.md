# Plan: Phase 3.2 — Coach Dashboard & Training Plan Management

## Context

Phase 3.1 complete. Coach shell готов, все pages — заглушки. Backend полностью готов (Prisma, contracts, api-server, routes). Задача: построить рабочее пространство тренера — полнофункциональный dashboard + управление планами.

**Принципы:**

- Никто не имеет права лишать юзера купленного товара → enrollment protection на уровне DB
- Design debt = blocker → User.name, CoachNote, AthleteFlag — делаем сейчас
- Quality > Speed, no deadlines → делаем всё из ChatGPT списка
- Mobile-first, 2×2 grid для stats (не horizontal scroll)

---

## Schema Changes

### 1. `User.name: String?`

Имя принадлежит пользователю, не профилю. Текущий `AthleteProfile.name` — design debt.

- Добавить `name String?` в User model
- Data migration: `UPDATE users SET name = (SELECT name FROM athlete_profiles WHERE userId = users.id)`
- `AthleteProfile.name` — удалить (clean break, не deprecated)
- Обновить contracts: `User`, `AthleteProfile`
- Обновить mappers, endpoints

### 2. `TrainingPlanStatus` enum

```prisma
enum TrainingPlanStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}
```

Заменяет `isActive: Boolean`. Migration: `true → ACTIVE`, `false → DRAFT`.

State machine:

```
DRAFT → ACTIVE (activate)
ACTIVE → ARCHIVED (archive)
ARCHIVED → ACTIVE (restore)
DRAFT → soft delete (safe, never was live)
ARCHIVED + no ACTIVE enrollments → soft delete
ARCHIVED + ACTIVE enrollments → DELETE BLOCKED
ACTIVE → delete NOT POSSIBLE (UI hides button)
```

### 3. `CoachNote` model

Простые заметки тренера об атлете. Замена messaging без WebSocket.

```prisma
model CoachNote {
  id           String       @id @default(cuid())
  coachId      String
  coach        CoachProfile @relation(...)
  athleteId    String
  athlete      User         @relation(...)
  content      String       @db.Text
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
  @@index([coachId, athleteId])
  @@map("app_coach_notes")
}
```

### 4. `AthleteFlag` model

Флаги внимания: травма, ограничение, требует внимания.

```prisma
model AthleteFlag {
  id         String       @id @default(cuid())
  coachId    String
  coach      CoachProfile @relation(...)
  athleteId  String
  athlete    User         @relation(...)
  type       FlagType
  note       String?
  resolvedAt DateTime?
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt
  @@index([coachId, resolvedAt])
  @@map("app_athlete_flags")
}

enum FlagType {
  INJURY
  RESTRICTION
  ATTENTION
}
```

### 5. DB Trigger — enrollment protection

PostgreSQL trigger: запрещает soft delete TrainingPlan если есть ACTIVE enrollments.

```sql
CREATE FUNCTION prevent_plan_deletion_with_active_enrollments()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."deletedAt" IS NOT NULL AND OLD."deletedAt" IS NULL THEN
    IF EXISTS (
      SELECT 1 FROM "app_plan_enrollments"
      WHERE "trainingPlanId" = NEW.id AND "status" = 'ACTIVE'
    ) THEN
      RAISE EXCEPTION 'Cannot delete training plan with active enrollments';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

Даже если в application code баг — база данных не позволит испортить enrollment.

---

## Coach Dashboard — Full Specification

Dashboard отвечает на 5 вопросов:

1. Что происходит сегодня?
2. Где проблемы?
3. Кому нужно моё внимание?
4. Какие программы в работе?
5. Что я должен сделать прямо сейчас?

### "Today" в calendar модели

Тренировки привязаны к календарю через `scheduledDate: DateTime?`.

**Алгоритм:**

1. Для каждого enrolled атлета: проверить тренировки с scheduledDate на сегодня
2. Все сегодняшние тренировки выполнены → COMPLETED
3. Есть невыполненные сегодня → PENDING
4. Нет тренировок на сегодня, но есть пропущенные на этой неделе → MISSED
5. Нет тренировок вообще → NO_PLAN
6. missedCount = непрерывная серия невыполненных тренировок назад от вчера (в пределах текущей недели), выполненная тренировка прерывает серию

### Секции Dashboard

**A. Overview (2×2 grid)**

```
┌─────────────────────┬─────────────────────┐
│  Active Athletes    │  Today: Completed   │
│       24            │     18 / 24 (75%)   │
├─────────────────────┼─────────────────────┤
│  Open Flags         │  Plans Ending Soon  │
│       3 🔴          │       5             │
└─────────────────────┴─────────────────────┘
```

Data: `overview { totalActiveAthletes, workoutsCompletedToday, workoutsPlannedToday, openFlagsCount, endingPlansCount }`

**B. Needs Attention (alerts, sorted by severity)**

Типы алертов (computed, no ML):

- `MISSED_WORKOUTS`: >3 дней без активности. Severity: >7d=CRITICAL, 3-7d=WARNING
- `LOAD_ANOMALY`: avg weight за 2 недели < 70% от предыдущих 2 недель. Severity: WARNING
- `PLAN_ENDING`: enrollment.endDate < 14 дней. Severity: WARNING (<7d) / INFO (7-14d)
- `NEW_NO_START`: enrolled <7 дней, zero workout logs. Severity: INFO
- `NO_PROGRESS`: completion rate < 30% за 2 недели при наличии enrollments. Severity: WARNING
- `OPEN_FLAG`: unresolved AthleteFlag (INJURY/RESTRICTION). Severity: CRITICAL

Data: `attentionAlerts[]: { type, severity, athleteId, athleteName, message, href }`

**C. Athletes Today (compact list)**

Все enrolled атлеты с сегодняшним статусом:

- Имя / фото (User.name || User.email, User.image)
- Текущий план
- Статус сегодня: chip (COMPLETED=green, PENDING=gray, MISSED=red, NO_PLAN=disabled)
- Последняя активность (relative time)
- Active flags (icons)
- Tap → athlete detail (Phase 3.5 page, placeholder for now)
- Client-side search/filter

Data: `athletesSummary[]: { userId, name, image, planId, planName, todayStatus, todayWorkoutTitle, lastActivityDate, daysSinceLastActivity, activeFlags[] }`

**D. Training Load Today**

Распределение атлетов по типу нагрузки (ExerciseCategory текущего workout):

- Category name + progress bar + athlete count
- Показывает что весь "класс" делает сегодня

Data: `loadDistributionToday[]: { categoryId, categoryName, athleteCount, percentage }`

**E. Progress & Analytics (compressed)**

3 bucket'а атлетов по тренду:

- Improving ↑ (completion rate >70%, weight trend up)
- Stagnating → (stable metrics)
- Declining ↓ (completion rate <40% or weight trend down)

Общие метрики:

- Average completion rate across all athletes
- Average engagement rate (active athletes / total enrolled)

Data: `progressBuckets { improving[], stagnating[], declining[], avgCompletionRate, avgEngagementRate }`

Computation: compare last 2 weeks vs previous 2 weeks per athlete. Weight trend: median change in MAX(weightDone) per exercise. Completion rate: workoutsLogged / expectedWorkouts.

**F. Communication (Coach Notes)**

Последние заметки тренера:

- Athlete name, note preview, created time
- Tap → athlete detail

Data: `recentNotes[]: { id, athleteId, athleteName, content, createdAt }`

**G. Quick Actions**

Static navigation links (no API data):

- Create New Plan → `/coach/plans/create`
- Add Exercise → `/coach/exercises/create`
- View Athletes → `/coach/athletes`
- Copy Plan → `/coach/plans?action=duplicate`

**H. Onboarding**

Athletes enrolled <7 дней назад:

- Name, enrolled date
- Progress: enrolled → started → completed 1st workout (step indicators)
- Tap → athlete detail

Data: `onboarding[]: { userId, name, image, enrolledAt, hasAnyLog, hasCompletedFirst }`

**I. Ending Plans**

Enrollments where endDate < 14 дней:

- Athlete name, plan name, days left (chip: red <7d, orange 7-14d)

Data: `endingPlans[]: { athleteId, athleteName, planId, planName, endDate, daysLeft }`

### Dashboard API Contract

Один endpoint: `GET /api/platform/coach/dashboard` → `CoachDashboardData`

API server: `Promise.all` параллельных Prisma запросов → compute all metrics in memory → return structured response.

Key Prisma query: `getActiveEnrollments(coachId)` с include `user { name, image, workoutLogs, athleteProfile }` + `trainingPlan { name, workouts { scheduledDate, createdAt, title, blocks { category } } }`.

---

## Training Plans — Full CRUD with Archive Flow

### Plan Card (mobile-first)

Each card shows:

- Name + Status badge (DRAFT=gray, ACTIVE=green, ARCHIVED=amber)
- Stats: workouts count, enrolled athletes, last activity
- Context-aware actions based on status:
  - DRAFT: Activate | Edit | Duplicate | Delete
  - ACTIVE: Archive | Edit | Duplicate (NO delete)
  - ARCHIVED: Restore | Duplicate | Delete (blocked if ACTIVE enrollments)

### List Page

- Filter tabs: All | Active | Draft | Archived
- Stack of plan cards
- FAB: Create Plan

### Create/Edit Pages

- FormView: name (TextField), description (TextField multiline)
- Status NOT editable in form (managed by actions: activate/archive/restore)

### Plan Duplication

Deep copy in $transaction: plan → workouts → blocks → prescribed sets.
New plan: "Copy of {name}", status: DRAFT.
NOT copied: enrollments, logs.

### Enriched List Data

```ts
TrainingPlanListItem = TrainingPlan & {
  workoutsCount: number
  enrolledAthletesCount: number
  lastActivityAt: string | null
  hasLinkedProducts: boolean
}
```

---

## Implementation Steps

### Step 1: Schema + DB

1. `User.name: String?`
2. Remove `AthleteProfile.name`
3. `TrainingPlanStatus` enum, replace `isActive`
4. `CoachNote` model
5. `AthleteFlag` model + `FlagType` enum
6. `pnpm db:push && pnpm db:generate`
7. Data migration SQL (isActive → status, AthleteProfile.name → User.name)
8. DB trigger for enrollment protection

**Files:**

- `packages/api-server/prisma/schema.prisma`
- Migration SQL script

### Step 2: Contracts

1. Update `training-plan` contracts: status enum, remove isActive, add TrainingPlanListItem, CoachPlansPageData, TRAINING_PLAN_STATUSES constants
2. Update `user` contracts: add name field
3. Update `athlete-profile` contracts: remove name field
4. Create `coach-dashboard` entity: CoachDashboardData, all nested schemas
5. Create `coach-note` entity: CoachNote, CreateCoachNoteData
6. Create `athlete-flag` entity: AthleteFlag, CreateAthleteFlagData, UpdateAthleteFlagData, FlagType
7. Export paths in package.json, barrel exports

**Files:**

- `packages/contracts/src/entities/training-plan/` (4 files)
- `packages/contracts/src/entities/user/` (update)
- `packages/contracts/src/entities/athlete-profile/` (update)
- `packages/contracts/src/entities/coach-dashboard/` (new, ~4 files)
- `packages/contracts/src/entities/coach-note/` (new, ~4 files)
- `packages/contracts/src/entities/athlete-flag/` (new, ~4 files)
- `packages/contracts/package.json`
- `packages/contracts/src/index.ts`

### Step 3: API Server

1. Update mappers: training plan (status), user (name), athlete profile (no name)
2. Update `training-plans.ts`: getPageData, duplicate, archive, restore, enhanced delete (check enrollments)
3. Create `coach-dashboard.ts`: getDashboard (complex aggregation with all sections)
4. Create `coach-notes.ts`: CRUD
5. Create `athlete-flags.ts`: CRUD + resolve
6. Create `utils/dashboard-computations.ts`: helper functions for metrics (progress buckets, load distribution, attention alerts, today status)
7. Update existing endpoints using isActive → status

**Files:**

- `packages/api-server/src/endpoints/platform/training-plans.ts`
- `packages/api-server/src/endpoints/platform/coach-dashboard.ts` (new)
- `packages/api-server/src/endpoints/platform/coach-notes.ts` (new)
- `packages/api-server/src/endpoints/platform/athlete-flags.ts` (new)
- `packages/api-server/src/endpoints/platform/index.ts`
- `packages/api-server/src/mappers/`
- `packages/api-server/src/utils/dashboard-computations.ts` (new)

### Step 4: API Routes

**New:**

- `GET /api/platform/coach/dashboard`
- `POST /api/platform/training-plans/[planId]/duplicate`
- `POST /api/platform/training-plans/[planId]/archive`
- `POST /api/platform/training-plans/[planId]/restore`
- `GET/POST /api/platform/coach/notes`
- `GET/PUT/DELETE /api/platform/coach/notes/[noteId]`
- `GET/POST /api/platform/coach/flags`
- `PUT/DELETE /api/platform/coach/flags/[flagId]`

**Modified:**

- `GET /api/platform/training-plans` → getPageData
- All training plan routes: isActive → status validation

**Files:**

- `apps/api/src/app/api/platform/coach/dashboard/route.ts` (new)
- `apps/api/src/app/api/platform/training-plans/[planId]/duplicate/route.ts` (new)
- `apps/api/src/app/api/platform/training-plans/[planId]/archive/route.ts` (new)
- `apps/api/src/app/api/platform/training-plans/[planId]/restore/route.ts` (new)
- `apps/api/src/app/api/platform/coach/notes/` (new, 2 files)
- `apps/api/src/app/api/platform/coach/flags/` (new, 2 files)
- `apps/api/src/app/api/platform/training-plans/route.ts` (modify)

### Step 5: Extract useDeleteConfirmation → packages/query

Move from admin, update admin imports (~3-4 files).

**Files:**

- `packages/query/src/use-delete-confirmation.ts` (new)
- `packages/query/src/index.ts`
- `apps/admin/src/lib/hooks/use-delete-confirmation.ts` (delete)
- Admin modules importing it (update)

### Step 6: Navigation

Add Home to COACH_NAVIGATION (5 items). Add Home icon to bottom nav.

**Files:**

- `packages/shared/src/navigation/platform.ts`
- `apps/platform/src/modules/shell/components/platform-bottom-nav.tsx`

### Step 7: Platform API client + hooks

**New endpoints:**

- `coach-dashboard.ts` — getDashboard
- `coach-notes.ts` — CRUD
- `athlete-flags.ts` — CRUD + resolve

**Updated:**

- `training-plans.ts` — getPageData, duplicate, archive, restore

**New hooks:**

- `use-coach-dashboard.ts`
- `use-coach-notes.ts`
- `use-athlete-flags.ts`

**Updated:**

- `use-training-plans.ts` — CoachPlansPageData, useDuplicateTrainingPlan, useArchiveTrainingPlan, useRestoreTrainingPlan

**Keys:**

- `packages/query/src/keys/platform.ts` — add coachDashboard, coachNotes, athleteFlags

**Files:**

- `apps/platform/src/lib/api/endpoints/` (3 new, 1 modified)
- `apps/platform/src/lib/api/index.ts`
- `apps/platform/src/lib/hooks/` (3 new, 1 modified)
- `apps/platform/src/lib/hooks/index.ts`
- `packages/query/src/keys/platform.ts`

### Step 8: Dashboard module — `/frontend-design`

```
modules/dashboard/
  components/
    stat-card.tsx              # 2×2 grid item: icon, label, value, accent color
    attention-alert-item.tsx   # severity icon, athlete name, message, action link
    athlete-summary-card.tsx   # compact: image, name, plan, status chip, last activity, flags
    athlete-status-chip.tsx    # COMPLETED/PENDING/MISSED/NO_PLAN colors
    load-bar-item.tsx          # category name + MUI LinearProgress + count
    progress-athlete-row.tsx   # name, completion %, trend arrow icon
    coach-note-item.tsx        # athlete name, note preview, relative time
    onboarding-step.tsx        # enrolled → started → completed (step indicator)
    ending-plan-row.tsx        # athlete, plan, days-left chip
    quick-action-button.tsx    # icon + label, large touch target
  sections/
    overview-section.tsx       # 2×2 Grid of stat-cards
    attention-section.tsx      # list of alerts sorted by severity
    athletes-today-section.tsx # athlete cards with search, sortable
    load-section.tsx           # vertical bars by category
    progress-section.tsx       # 3 columns: improving/stagnating/declining
    notes-section.tsx          # recent notes list
    quick-actions-section.tsx  # action buttons
    onboarding-section.tsx     # new athletes list
    ending-plans-section.tsx   # ending plans list
  views/
    dashboard-view.tsx         # QueryWrapper → all sections vertically
  index.ts
```

Production-grade mobile-first via `/frontend-design`. Section order on page:

1. Overview (2×2 grid)
2. Needs Attention (collapsible if empty)
3. Athletes Today (with search)
4. Quick Actions
5. Training Load Today
6. Progress & Analytics
7. Communication (Notes)
8. Onboarding
9. Ending Plans

### Step 9: Plans module — `/frontend-design`

```
modules/plans/
  components/
    plan-form.tsx              # name, description fields
    plan-card.tsx              # name, status badge, stats, context-aware action menu
    plan-status-badge.tsx      # DRAFT/ACTIVE/ARCHIVED with colors
  sections/
    plans-list-section.tsx     # filter tabs + stack of plan-cards + ConfirmationModal
  views/
    plans-list-view.tsx        # QueryWrapper → list section
    plan-create-view.tsx       # FormView
    plan-edit-view.tsx         # FormView (pre-filled)
  index.ts
```

### Step 10: Route pages

- `coach/page.tsx` → DashboardView (server component fetch, NOT redirect)
- `coach/plans/page.tsx` → PlansListView
- `coach/plans/create/page.tsx` → PlanCreateView (new)
- `coach/plans/[planId]/page.tsx` → PlanEditView (new)

### Step 11: Admin cascade + ROADMAP

- Update admin code using `isActive` → `status`
- Update admin code using `AthleteProfile.name` → `User.name`
- ROADMAP: mark 3.1 ✅, update 3.2
- Add CLAUDE.md anti-pattern if needed

---

## Execution Order

1. **Step 1** (schema) — blocks everything
2. **Step 2** (contracts) + **Step 5** (extract useDeleteConfirmation) — parallel
3. **Step 3** (api-server) — depends on 1, 2
4. **Step 4** (api routes) — depends on 3
5. **Step 6** (navigation) — independent, parallel with 3-4
6. **Step 7** (platform client + hooks) — depends on 2, 4
7. **Step 8** + **Step 9** (dashboard + plans modules) — parallel, `/frontend-design`
8. **Step 10** (routes) — depends on 8, 9
9. **Step 11** (admin + roadmap)

---

## Verification

- `pnpm db:push` + `pnpm db:generate` — schema migration
- `pnpm check-types` — all packages
- `pnpm build` — all 4 apps
- Admin: nothing broken after isActive→status + name migration
- Platform `/coach` — full dashboard with all sections populated
- Platform `/coach/plans` — plans list with filter tabs, cards, actions
- Platform `/coach/plans/create` — create plan (DRAFT)
- Platform `/coach/plans/[id]` — edit plan
- Archive flow: ACTIVE → Archive → Restore | Delete
- Delete blocked: ARCHIVED plan with ACTIVE enrollments → error
- DB trigger: raw SQL attempt to soft-delete plan with enrollments → exception
- Duplicate: creates DRAFT copy with all workouts/blocks/sets
- Dashboard "today" logic: correct status per athlete
- Dashboard attention: flags inactive athletes, new athletes, ending plans
