# ARCHITECTURE & DOMAIN CONTRACT

## PRODUCT CONCEPT

**The Discipline Program** — цифровая инфраструктура для одного тренерского бизнеса.

Не маркетплейс. Не multi-tenant SaaS. Одна команда тренеров, их атлеты, их программы.

Аналогия: Shopify для магазина — витрина + back-office + клиентский кабинет. У нас: маркетинг-сайт + админ-панель + тренерская платформа.

### Value Proposition

**Для тренера:**
Создавать тренировочные программы, назначать их атлетам, отслеживать выполнение и прогресс, видеть бенчмарки и статистику, управлять библиотекой упражнений.

**Для атлета:**
Видеть свою программу, выполнять тренировки, логировать результаты, отслеживать прогресс и PR, управлять профилем и бенчмарками.

**Для владельца бизнеса:**
Управлять маркетинг-сайтом, настраивать продукты и ценообразование, видеть подписки и платежи, управлять пользователями и справочниками.

### Core Flow

    Атлет → маркетинг-сайт → покупает продукт → авто-энроллмент на план → видит программу
    Тренер → создаёт план → добавляет тренировки → тренировки появляются у атлетов на плане
    Атлет → выполняет тренировку → логирует результаты → тренер видит логи → даёт фидбек

### Key Design Decisions

- **Одна библиотека упражнений** на весь бизнес. CRUD доступен из admin и platform. Нет разделения на "системные" и "тренерские".
- **Coach ↔ Athlete** связь через PlanEnrollment. Нет отдельной таблицы "мои атлеты". Атлеты тренера = все юзеры, записанные на его планы.
- **Product → TrainingPlan**. Товар на витрине привязан к тренировочному плану. Покупка = авто-энроллмент. Атлет сразу получает программу.
- **Бенчмарки** — профильные данные юзера, не аналитика. Каталог метрик (BenchmarkDefinition) + значения на юзере (UserBenchmark). Не привязаны к упражнениям.
- **Групповые vs индивидуальные программы** — системе без разницы. Программа это программа, 0..N атлетов.
- **Коммуникация MVP** — отметка выполнения тренировки для статистики. Чат и мессенджинг — через внешние инструменты (WhatsApp/Telegram).

---

## SYSTEM IDENTITY

**Система:**
High-Performance Coaching Platform (LMS + Billing) + Marketing CMS.

**Архитектура:**
Monorepo. Strict Domains. Singleton Subscriptions.

**Стек данных:**
PostgreSQL + Prisma.

**Стек API:**
Next.js Route Handlers (BFF) → Domain Services.

---

## USER ROLES & ACCESS

| Role           | Admin App   | Platform App                          | Marketing   |
| -------------- | ----------- | ------------------------------------- | ----------- |
| ADMIN          | Full access | Coach interface (if has CoachProfile) | —           |
| COACH          | No access   | Programming, athletes, monitoring     | —           |
| USER (Athlete) | No access   | My program, logging, progress         | —           |
| Public         | —           | —                                     | Full access |

**ADMIN** — владелец/оператор бизнеса. Может быть одновременно тренером (иметь CoachProfile).
**COACH** — тренер в команде. Создаёт программы, работает с атлетами.
**USER** — атлет. Тренируется, логирует, отслеживает прогресс.

Admin app защищён middleware: только ADMIN.
Platform app: разные интерфейсы по роли (COACH vs USER).

---

## GLOBAL INVARIANTS

_(System Laws — Violation is a Critical Bug)_

1. **Strict Subscription Uniqueness**
   1 User = 1 Subscription Record (Singleton).
   Никаких параллельных или "исторических" подписок в рамках MVP.

2. **Money is Integer**
   Все денежные значения хранятся в минимальных единицах (cents/kopeks).
   Float/Double для денег строго запрещены.

3. **Logs are Immutable**
   WorkoutLog никогда не меняется. Создаётся один раз. Удаляется целиком (cascade SetLogs).

4. **Reference Data Integrity**
   Тренировочные данные (PrescribedSet, SetLog) ссылаются на Exercise по ID.
   Использование строковых имен запрещено.
   Exercise с активными ссылками (планы, логи, бенчмарки) не может быть удалён — только soft delete.

5. **Access = Subscription State**
   Доступ атлета к платформе определяется состоянием подписки:
   ACTIVE, TRIAL, либо PAST_DUE (в рамках grace period).

6. **Purchase = Immediate Value**
   Покупка продукта → авто-энроллмент на связанный TrainingPlan.
   Атлет никогда не попадает на платформу "в пустоту".

7. **Shared Exercise Library**
   Одна библиотека упражнений и категорий на весь бизнес.
   Доступна для чтения всем ролям, для редактирования — ADMIN и COACH.

---

## DOMAIN: TRAINING CORE

### Exercise Library

Централизованный каталог упражнений и категорий.
CRUD доступен из Admin app и Platform app.

- `Exercise` — атомарное движение/активность. name, description, videoUrl, categoryId.
- `ExerciseCategory` — группировка. Strength, Cardio, Gymnastics, WOD, etc.

### Training Plan → Workout → Block → Set

Иерархия тренировочного программирования:

- `TrainingPlan` — программа, созданная тренером. name, description, isActive. Принадлежит Coach (coachId).
- `Workout` — одна тренировочная сессия в плане. title, scheduledDate, description. Soft delete.
- `WorkoutBlock` — секция внутри тренировки. Группирует упражнения по категории. rounds, restSeconds, timeCap. Hard delete (CASCADE).
- `PrescribedSet` — конкретное предписание. exerciseId, sets, reps, weight, unit, rpe, notes. Hard delete (CASCADE).

### Prescription & Substitution

- Назначение только по ссылке (`exerciseId`).
- `substitutionExerciseId` = NULL → Атлет выполнил план.
- `substitutionExerciseId` = SET → Атлет выполнил замену.

### Workout Logging

- `WorkoutLog` — запись о выполнении тренировки атлетом. Immutable. userId, workoutId, date, notes, isRx.
- `SetLog` — что атлет реально сделал. prescribedSetId, repsDone, weightDone, rpeActual. Вложен в WorkoutLog (CASCADE delete).

### Workout Completion Tracking

Атлет отмечает тренировку как выполненную. MVP: на уровне тренировки целиком (WorkoutLog = выполнена). В будущем: по блокам, по упражнениям.

---

## DOMAIN: PLAN ENROLLMENT

Связь атлета с тренировочным планом.

    PlanEnrollment(
      id,
      trainingPlanId → TrainingPlan,
      userId → User,
      startDate,
      endDate?,
      status: ACTIVE | PAUSED | COMPLETED,
      createdAt
    )

- Один атлет может быть на нескольких планах одного или разных тренеров.
- "Мои атлеты" = `SELECT DISTINCT userId FROM PlanEnrollment WHERE plan.coachId = :me`.
- Создаётся вручную тренером или автоматически при покупке продукта.

---

## DOMAIN: PURCHASE & ENROLLMENT

### Product → TrainingPlan Link

Товар на маркетинг-сайте привязан к тренировочному плану.

    Product.trainingPlanId → TrainingPlan (nullable)

- Если товар привязан к плану, покупка автоматически создаёт PlanEnrollment.
- Удалить план, привязанный к товару → запрет или предупреждение.
- Удалить товар → существующие подписки и enrollment продолжают работать.

### Purchase Flow

    Атлет на маркетинг-сайте → выбирает продукт → оплата → Subscription created →
    → if Product.trainingPlanId → PlanEnrollment created →
    → Атлет заходит на платформу → видит программу

---

## DOMAIN: BENCHMARKS

Профильные данные юзера. Описывают текущие возможности: "присед 100кг", "Fran 3:15", "вес 85кг".

### Benchmark Definition (каталог)

    BenchmarkDefinition(
      id,
      name,       — "Back Squat 1RM", "Fran", "Body Weight"
      unit,       — "kg", "time", "%"
      category?   — "Strength", "WOD", "Body Comp"
    )

Справочник бизнеса. CRUD доступен из Admin и Platform (ADMIN + COACH).

### User Benchmark (значение)

    UserBenchmark(
      id,
      userId → User,
      benchmarkDefinitionId → BenchmarkDefinition,
      value,      — числовое значение
      updatedAt
    )

- Вводится при онбординге или вручную тренером/атлетом.
- Один юзер, одна бенчмарка, одно значение (обновляемое).
- В будущем: автоматическое предложение обновления на основе WorkoutLog данных.

---

## DOMAIN: BILLING

- **Status Flow:**
  TRIAL → ACTIVE → PAST_DUE → CANCELED.

- **Grace Policy:**
  72 часа.
  Доступ разрешён, если PAST_DUE **И** `now < graceEndsAt`.

- **Source of Truth:**
  БД (синхронизация через идемпотентные вебхуки).

- **Payment Provider:**
  TBD. Архитектура provider-agnostic.

---

## PHYSICAL BOUNDARIES & APPS

### 1. API Gateway (`apps/api`)

- **Роль:** HTTP Routing / BFF / Entrypoint.
- **Содержимое:**
  Next.js Route Handlers (`src/app/api/**/route.ts`), Auth helpers.
- **Правило:** NO Business Logic, NO Prisma Client.
- **Действие:**
  Принимает запрос → Валидирует (Zod) →
  Вызывает метод из `packages/api-server` →
  Возвращает JSON.
- **Route namespaces:**
  - `/api/admin/*` — endpoints для Admin app (ADMIN only)
  - `/api/platform/*` — endpoints для Platform app (auth required, role-dependent)
  - `/api/public/*` — endpoints для Marketing app (no auth)
  - `/api/auth/*` — NextAuth

### 2. Marketing App (`apps/marketing`)

- **Роль:** Public Landing & SEO.
- **Доступ к данным:** HTTP API Only.
- **Правило:**
  Не знает о структуре БД, Prisma, Auth Users, Training Plans, Subscriptions.
  Оперирует только публичными данными (блог, страницы, продукты, цены).
- **UX:** Public, responsive.

### 3. Admin App (`apps/admin`)

- **Роль:** Back-office для владельца бизнеса.
- **Доступ:** Только ADMIN (middleware role check).
- **Контекст CMS:**
  Управление контентом маркетинга: блог, страницы, отзывы, продукты, контакты.
- **Контекст Business:**
  Управление пользователями, обзор подписок и платежей, аналитика,
  справочник упражнений и категорий, каталог бенчмарков.
- **Граница:**
  Admin НЕ управляет тренировочными планами, воркаутами и логами.
  Это продуктовый контент, который живёт в Platform.
- **UX:** Desktop-first. Таблицы, формы, дашборды.

### 4. Platform App (`apps/platform`)

- **Роль:** Core Product Experience (PWA). Mobile-first.
- **Доступ:** Auth required. Разные интерфейсы по роли.
- **Coach (роль COACH):**
  - Создание и редактирование тренировочных планов (Plan → Workout → Block → Set)
  - Добавление упражнений в общую библиотеку
  - Назначение атлетов на планы (PlanEnrollment)
  - Просмотр логов и прогресса атлетов
  - Управление бенчмарками атлетов
  - Статистика выполнения
- **Athlete (роль USER):**
  - Просмотр назначенной программы и тренировок
  - Логирование выполнения (WorkoutLog → SetLog)
  - Отметка выполнения тренировки
  - Отслеживание прогресса и PR
  - Управление профилем и своими бенчмарками
- **Принцип:**
  Тренер и атлет работают над одним контентом (планы, воркауты, логи)
  в одном приложении с разными интерфейсами по роли.

---

## SHARED PACKAGES STRATEGY

### `packages/api-server` (The Brain)

- **Ответственность:**
  Бизнес-логика, инварианты, работа с БД.
- **Содержимое:**
  Prisma Client Instance, Domain endpoints
  (функции, которые вызываются из `apps/api`),
  Guards (resolveCoachId, verifyPlanOwnership, etc.), Mappers.
- **Правило:**
  Единственное место в монорепо, где разрешен импорт `@prisma/client`.

### `packages/contracts` (The Law)

- **Ответственность:**
  Единый контракт общения между Frontend и API.
- **Содержимое:**
  Zod Schemas (Validation), TypeScript Types (DTOs).
- **Правило:**
  Используется во всех приложениях. Никаких Prisma types.

### `packages/auth`

- **Ответственность:**
  NextAuth конфигурация, session types, auth utilities (isPublicRoute).

### `packages/errors`

- **Ответственность:**
  Иерархия ошибок (AppError → HttpError → UnauthorizedError, ForbiddenError, NotFoundError, etc.).

### `packages/api-client`

- **Ответственность:**
  HTTP client (ApiClient class) для вызова API из приложений.

### `packages/ui`

- **Ответственность:**
  Shared React components: Sidebar, AdminHeader, DataTable, FormView, FormCard, Logo, etc.

### `packages/query`

- **Ответственность:**
  React Query setup: QueryProvider, query keys (admin, platform), CRUD hooks factory, stale times.

### `packages/shared`

- **Ответственность:**
  Navigation configs (admin, coach), types, SEO constants, layout constants.

### `packages/mui`

- **Ответственность:**
  MUI theme, NextProvider (AppRouterCacheProvider + ThemeProvider).

### `packages/env`

- **Ответственность:**
  Environment variable validation (Zod).
