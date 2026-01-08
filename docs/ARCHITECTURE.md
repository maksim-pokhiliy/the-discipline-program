# ARCHITECTURE & DOMAIN CONTRACT

## SYSTEM IDENTITY

**Система:**
**High-Performance Coaching Platform** (LMS + Billing) + **Marketing CMS**.

**Архитектура:**
Monorepo. Strict Domains. Singleton Subscriptions.

**Стек данных:**
PostgreSQL + Prisma.

**Стек API:**
Next.js Route Handlers (BFF) → Domain Services.

---

## GLOBAL INVARIANTS

_(System Laws — Violation is a Critical Bug)_

1. **Strict Subscription Uniqueness**
   1 User = 1 Subscription Record (Singleton).
   Никаких параллельных или “исторических” подписок в рамках MVP.

2. **Money is Integer**
   Все денежные значения хранятся в минимальных единицах (cents/kopeks).
   Float/Double для денег строго запрещены.

3. **Logs are Immutable**
   Исторические логи (`WorkoutLog`) никогда не меняются, даже если план изменен тренером.
   Любые изменения тренировок — через Copy-on-Write.

4. **Reference Data Integrity**
   Тренировочные данные (`PrescribedSet`, `SetLog`) обязаны ссылаться на каноническую сущность `Exercise` (ID).
   Использование строковых имен упражнений запрещено.

5. **Access = Subscription State**
   Доступ к функциональности платформы определяется **только** состоянием подписки:
   `ACTIVE`, `TRIAL`, либо `PAST_DUE` (в рамках grace period).
   Никаких флагов `isAdmin` для доступа к контенту атлета.

---

## DOMAIN: TRAINING CORE

- **Exercise Library:**
  Централизованный словарь движений (`app_exercises`).

- **Prescription:**
  Назначение только по ссылке (`exerciseId`).

- **Substitution:**

  - `substitutionExerciseId` = NULL → Атлет выполнил план.
  - `substitutionExerciseId` = SET → Атлет выполнил замену.

- **Copy-on-Write:**
  Редактирование выполненного воркаута архивирует старую версию и создает новую.

---

## DOMAIN: BILLING

- **Status Flow:**
  `TRIAL` → `ACTIVE` → `PAST_DUE` → `CANCELED`.

- **Grace Policy:**
  72 часа.
  Доступ разрешён, если `PAST_DUE` **И** `now < graceEndsAt`.

- **Source of Truth:**
  БД (синхронизация через идемпотентные вебхуки).

---

## PHYSICAL BOUNDARIES & APPS (MONOREPO STRUCTURE)

### 1. API Gateway (`apps/api`)

- **Роль:** HTTP Routing / BFF / Entrypoint.
- **Содержимое:**
  Next.js Route Handlers (`src/app/api/**/route.ts`), Auth options, Middleware.
- **Правило:** **NO Business Logic, NO Prisma Client.**
- **Действие:**
  Принимает запрос → Валидирует (Zod) →
  Вызывает метод из `packages/api-server` →
  Возвращает JSON.

### 2. Marketing App (`apps/marketing`)

- **Роль:** Public Landing & SEO.
- **Доступ к данным:** **HTTP API Only.**
- **Правило:**
  Приложение НИКОГДА не знает о структуре БД и не имеет доступа к Prisma.
- **Изоляция:**
  Не знает про Auth Users, Training Plans или Subscriptions
  (оперирует только публичными ID цен/продуктов).

### 3. Admin App (`apps/admin`)

- **Роль:** Инструмент тренера и CMS.
- **Контекст CMS:**
  Управление контентом маркетинга (через API).
- **Контекст Coach:**
  Управление атлетами, планами и библиотекой упражнений.
- **Ограничение:**
  Управление библиотекой `Exercise` доступно только роли ADMIN/HEAD_COACH.

### 4. Platform App (`apps/platform`)

- **Статус:** **TO BE CREATED**.
- **Причина:**
  Реализация запланирована после стабилизации Schema, API Core, CMS и Admin.
- **Роль:**
  Core Athlete Experience (PWA).

---

## SHARED PACKAGES STRATEGY

### `packages/api-server` (The Brain)

- **Ответственность:**
  Реализация бизнес-логики, инвариантов и работа с БД.
- **Содержимое:**
  - Prisma Client Instance.
  - Domain Services (`TrainingService`, `BillingService`).
  - API Handlers Implementation
    (функции, которые вызываются из `apps/api`).
- **Правило:**
  Единственное место в монорепо, где разрешен импорт `@prisma/client`.

### `packages/contracts` (The Law)

- **Ответственность:**
  Единый контракт общения между Frontend и API.
- **Содержимое:**
  Zod Schemas (Validation), TypeScript Types (DTOs).
- **Правило:**
  Используется во всех приложениях для типизации запросов и ответов.

### `packages/auth`

- **Ответственность:**
  Изолированная конфигурация и утилиты NextAuth.

### `packages/errors`

- **Ответственность:**
  Единая иерархия ошибок (`AppError`, `HttpError`)
  и маппинг кодов ошибок.
