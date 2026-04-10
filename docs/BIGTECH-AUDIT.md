# Big Tech Audit: рефакторинг и полировка

Что команда staff+ инженеров из FAANG / M7 проверяла бы на этом проекте при ревью на рефакторинг и полировку. Отсортировано по важности: от блокирующего фундамента к процессной зрелости.

**Контекст стека:** Turbo monorepo, Next.js 16, Prisma, MUI, CMS + LMS + billing. Проект до продакшена (база пустая, реальных пользователей нет) → идеальное время закладывать фундамент, а не латать задним числом.

**Критерий сортировки:** impact × блокирование следующих пунктов × стоимость ретрофита.

**Документ живой.** В процессе research каждого пункта новые находки добавляются как отдельные bullets. Удалять пункты запрещено, кроме случая «код доказал, что проблема не существует».

---

## Прогресс

- [ ] 1. Архитектура и границы
- [ ] 2. Доменная модель
- [ ] 3. Безопасность
- [ ] 4. Надёжность и операционка
- [ ] 5. База данных и миграции
- [ ] 6. API Design
- [ ] 7. Архитектурные риски на 6 месяцев вперёд
- [ ] 8. Monorepo дисциплина
- [ ] 9. Тестирование
- [ ] 10. Фронт и Next.js 16
- [ ] 11. Качество кода
- [ ] 12. DX и процесс

---

## 1. Архитектура и границы

**Статус:** В работе — research завершается, ждёт утверждения плана

System, not code. Это фундамент — всё остальное стоит на нём, поэтому идёт первым. Неправильные решения на этом уровне отравляют все последующие.

### 1.1. ADR-инфраструктура

- [ ] **Нет папки `docs/adr/` и ADR-процесса.** Все архитектурные решения (Turbo, MUI, NextAuth, Prisma, Vercel Blob, Stripe как провайдер будущего, singleton Subscription, soft-delete extension, BFF-via-HTTP-loopback для RSC, два независимых NextAuth instance в admin/platform, JWT session strategy) не задокументированы. Через год никто не вспомнит, почему так.
- [ ] **Некоторые решения уже «протекли» в код без ADR.** `Product.stripeProductId` / `Price.stripePriceId` в `schema.prisma` означают, что Stripe выбран как провайдер — но обоснование нигде не зафиксировано. Любой последующий developer увидит поле и примет факт, не понимая trade-offs.
- [ ] **BFF via HTTP loopback** (`packages/api-client/src/server.ts:createNextServerClient` делает fetch на `NEXT_PUBLIC_APP_URL`) — архитектурный выбор, на который завязан весь server-side data fetching. Альтернатива — прямой вызов `apiFn` из `api-server` без HTTP-hop. Выбор без ADR.
- [ ] **Два независимых NextAuth instance** (`apps/admin/src/lib/server/auth.ts` и `apps/platform/src/lib/server/auth.ts` почти идентичны, создают отдельные `authOptions`). Это либо сознательная изоляция, либо тех-долг. ADR требуется.
- [ ] **Нет template для новых ADR.** Формат (context / decision / consequences / alternatives) — стандарт Michael Nygard — надо принять и оформить.

### 1.2. Bounded contexts

- [ ] **`packages/api-server/src/endpoints/` сгруппирован по consumer (`admin/`, `marketing/`, `platform/`), а не по domain.** Это создаёт физическое дублирование: `products.ts`, `pages.ts`, `reviews.ts`, `contact(s).ts` существуют и в `admin/`, и в `marketing/` как разные файлы — один домен, две реализации.
- [ ] **В `admin/endpoints/` смешаны CMS-ресурсы (blog, contacts, pages, products, reviews) и admin analytics (dashboard, users, upload).** Нет явного места для «admin analytics» и «CMS» как отдельных контекстов.
- [ ] **В `contracts/src/entities/` 21 сущность плоским списком.** Нет группировки по контекстам (`cms/`, `lms/`, `coaching/`, `iam/`, `billing/`). `contracts/package.json` имеет 22 flat subpath exports.
- [ ] **Billing domain существует только в БД.** `schema.prisma` содержит `Product`, `Price`, `Subscription`, `Transaction`, но `packages/contracts/src/entities/` не имеет ни `subscription`, ни `transaction`, ни `price`. В `api-server/endpoints/` нет ни одного billing endpoint. В route handlers нет `/api/.../billing/*` и `/api/webhooks/stripe`. **Идеальное окно заложить billing bounded context правильно, пока кода нет.**
- [ ] **`api-server` не имеет subpath exports.** `package.json` экспортирует только `.`, и `src/index.ts` делает `export * from "./endpoints"; export * from "./services"`. Любой app получает доступ ко всему domain layer. `marketing` импортирует только `pagesApi` и `contactApi` (конкретные файлы: `apps/marketing/src/app/api/public/pages/[pageSlug]/route.ts`, `apps/marketing/src/app/api/public/contact/route.ts`), но физически тянет весь `api-server`.
- [ ] **Первая dependency rule, которую надо заэнфорсить:** `apps/marketing` не должен видеть `@repo/api-server` ничего, кроме CMS-контекста. Сейчас import-граф ничего не запрещает.
- [ ] **Нет документа, который декларирует bounded contexts** (`docs/BOUNDED-CONTEXTS.md` или подобный). Первый черновик маппинга: CMS = {blog, contact, pages, product marketing view, review}; LMS = {training-plan, workout, workout-log, plan-enrollment, benchmark-definition, user-benchmark}; Coaching = {coach-action-item, coach-athletes, coach-dashboard, coach-note, coach-profile, athlete-profile}; IAM = {auth, user, upload}; Billing = {product billing view, price, subscription, transaction} (пусто в API).
- [ ] **CoachActionItem генерирует события `MISSED_WORKOUTS / NEW_NO_START / HEALTH_REPORT`** (см. `schema.prisma:308-323`), но нет background scheduler'а. Либо эти события создаются лениво при запросе dashboard'а, либо вообще не создаются. Сoaching context не отделён от LMS и не имеет явного event-boundary.

### 1.3. Dependency direction и граф пакетов

- [x] **Циклы между пакетами отсутствуют.** Проверено двумя способами: (1) ручной анализ 13 `package.json` — DAG, циклов нет; (2) `madge` на уровне файлов внутри пакетов — 730 файлов обработано, 0 циклов.
- [ ] **Нет `madge`, нет `dependency-cruiser` в `devDependencies` корневого `package.json`.** Это значит проверка циклов разовая, нет CI-gate.
- [ ] **Нет CI-gate на циклы.** Pre-commit hook (`lefthook.yml`) содержит prettier / lint / type-check / test — dep-cycle check отсутствует.
- [ ] **Граф не задокументирован.** Нет визуализации актуальной картины deps, некуда смотреть при онбординге. `dependency-cruiser` с `.dependency-cruiser.cjs` + `depcruise --output-type dot` в CI-pipeline закроет это.

### 1.4. Dependency inversion (ports & adapters)

- [ ] **`@vercel/blob` напрямую импортируется в `packages/api-server/src/endpoints/admin/upload.ts`.** Нет storage port. Заменить провайдера на S3/R2 = переписать endpoint и тесты. `adminUploadApi.uploadImage/deleteImage` напрямую вызывает `put/del` из `@vercel/blob`.
- [ ] **`centsToAmount` живёт в `@repo/shared`** (используется в `packages/api-server/src/endpoints/admin/dashboard.ts:15`) — domain-primitive Money в utility-помойке рядом с layout constants и date helpers. Должен быть в `contracts/common` или отдельном `@repo/money`.
- [ ] **Нет портов под будущие интеграции** — email (Resend / Postmark), payments (Stripe), queue (BullMQ / Inngest), cache (Upstash / Redis). Когда они появятся, есть риск, что их тоже воткнут напрямую в endpoints, как `@vercel/blob`.
- [ ] **Хороший пример уже есть:** `packages/auth/src/auth-options.ts:20 AuthServiceAdapter` — это настоящий port (`validateUser`, `getUserById` инжектятся извне, пакет не знает про Prisma). Использовать как reference при проектировании остальных портов.

### 1.5. Failure domains и deploy

- [ ] **Deploy config не версионируется.** Нет `vercel.json`, `Dockerfile`, `netlify.toml`, `docker-compose.yml`. Всё живёт в Vercel UI. Нет audit trail, нет rollback через git, нет возможности воспроизвести окружение локально.
- [ ] **`/api/auth/[...nextauth]/route.ts` физически дублируется** в `apps/admin/src/app/api/auth/[...nextauth]/route.ts` и `apps/platform/src/app/api/auth/[...nextauth]/route.ts`. Два разных NextAuth instance. Без ADR неясно: сознательная изоляция или тех-долг.
- [ ] **Нет `/api/health`, `/api/ready`, `/api/version` endpoints ни в одном app.** Оркестратор / балансировщик не умеет отслеживать состояние.
- [ ] **Нет `/api/webhooks/*` вообще.** Когда появится Stripe/Resend — некуда принимать callbacks, инфраструктуры для подписи webhook'а и идемпотентности тоже нет (хотя `Transaction.providerTxId @unique` уже заложен как инвариант).
- [ ] **Нет документации, как три app'а (admin/marketing/platform) запущены в prod** — один Vercel project, три, monorepo deploy. Принципал не может ответить: «если упадёт marketing, упадёт ли platform?»

### 1.6. Monorepo hygiene (локальные проблемы package.json, относящиеся к архитектуре)

_(Эти пункты частично пересекаются с секцией 8 «Monorepo дисциплина», но они влияют на корректность bounded-context enforcement, поэтому их закрытие — часть работы пункта 1.)_

- [ ] **`@repo/auth`: `next-auth` одновременно в `dependencies` и `peerDependencies`.** Риск dual-instance бага (два разных модуля next-auth у потребителя → сломанный session context).
- [ ] **`@repo/ui`: `exports: { "./*": "./src/*.tsx" }`** — wildcard экспорт. Нет controlled public API, любой внутренний компонент доступен снаружи.
- [ ] **`@repo/api-client` не имеет `@repo/contracts` в `dependencies`.** HTTP client не типизирован через контракты: `ApiClient.request<T>` использует generic T без Zod runtime validation (`packages/api-client/src/client.ts:42`). Contract-first архитектура разорвана на клиенте.
- [ ] **`@repo/api-client`: `peerDependencies.next: "*"` без версии.** Нет защиты от конфликта мажоров.
- [ ] **`@repo/query`: `sonner` одновременно в `devDependencies` и `peerDependencies`** — дублирование.
- [ ] **`@repo/env` версия `0.0.0` против `0.1.0` у остальных пакетов** — версионная инконсистентность.

---

## 2. Доменная модель

**Статус:** Не начато

DDD lens. Без правильной модели всё, что на ней построено — кривое. Это второй слой фундамента после архитектурных границ.

- [ ] **Aggregates и инварианты.** «Singleton Subscription: 1 User = 1 Subscription» — это инвариант агрегата. Вопрос: где он гарантирован? В schema уникальным индексом? В domain layer? В route handler? Если в трёх местах — три разные истины. Big Tech ожидает: инвариант живёт в одном месте, ближайшем к данным.
- [x] **Singleton Subscription ЕСТЬ на уровне БД:** `Subscription.userId String @unique` (`schema.prisma:180`). Это правильное место. Теперь нужно задокументировать этот инвариант и убедиться, что он отражён в domain layer.
- [x] **«Money is Integer» ЕСТЬ на уровне БД:** `Transaction.amountCents Int` + `Currency Currency` enum (`schema.prisma:205-206`). Тоже `Price.amountCents Int`. Правильное место.
- [x] **Инвариант «один WorkoutLog на пару user+workout»:** `@@unique([userId, workoutId])` (`schema.prisma:288`). Правильно на БД.
- [x] **Инвариант «один PlanEnrollment на пару plan+user»:** `@@unique([trainingPlanId, userId])` (`schema.prisma:390`). Правильно на БД.
- [ ] **Эти инварианты нигде не документированы как список.** Code reader должен угадывать из `@@unique`. Нужен `docs/INVARIANTS.md` или раздел в новом `BOUNDED-CONTEXTS.md`.
- [ ] **Ubiquitous language.** Код говорит на языке бизнеса? `TrainingPlan` vs `Workout` vs `Program` — синонимы или разные сущности? Если спросить трёх людей — ответят одинаково? Без единого языка домен расползётся.
- [ ] **Дублирование понятия «archived»:** `TrainingPlanStatus.ARCHIVED` (enum) и `Workout.isArchived Boolean` — два разных механизма для одного слова. Plan archives через status transition, workout — через boolean флаг. Непоследовательно.
- [ ] **Value Objects.** `Money` не должен быть `number`. `centsToAmount` есть, но это helper, а не тип. `Money = { amount: number; currency: Currency }` — явный тип, который нельзя сложить с обычным числом. Currency enum уже есть (`USD / EUR / UAH` — multi-currency planned → удваивает сложность). То же для `Email`, `Cuid`, `Slug`, `DurationSeconds`.
- [ ] **`BenchmarkDefinition.unit String`** (`schema.prisma:401`) — свободная строка вместо enum. "kg" / "lb" / "seconds" / "%" / "count" — что угодно. Слабая типизация в самом domain-core.
- [ ] **`BenchmarkDefinition.category String?`** (`schema.prisma:402`) — тоже string, не enum.
- [ ] **`CoachActionItem.metadata Json?`** (`schema.prisma:335`) — untyped JSON без схемы. В domain layer metadata должна иметь discriminated union по ActionItemType.
- [ ] **`MarketingPageSection.data Json` + `section String`** (`schema.prisma:444-445`) — весь контент CMS-секций лежит как untyped JSON, тип секции как строка. Нет domain types вообще.
- [ ] **Общих domain-примитивов практически нет.** `packages/contracts/src/common.ts` содержит только 2 schema: `idParamSchema`, `planIdParamSchema`. Нет `Money`, `Email`, `Cuid`, `Slug`, `Pagination`, `SortOrder`, `DateRange`, `TimeZone`, `ListRequest<T>`. Каждая из 21 entities изобретает Zod schemas с нуля.
- [ ] **`AthleteProfile.weightKg Decimal`, `heightCm Int`** — несогласованные типы measurements. Decimal в Prisma может возвращаться как string в некоторых версиях.
- [ ] **`Gender enum: MALE, FEMALE`** (только 2 значения). Для современного coaching platform в 2026 часто добавляют `OTHER / PREFER_NOT_TO_SAY / NON_BINARY`. Это domain decision, не техническая мелочь.
- [ ] **Anemic vs rich domain.** Сейчас классический anemic: schemas → types → мапперы → handlers. `packages/api-server/src/services/` содержит **только `auth.ts`** — service layer практически отсутствует. Бизнес-логика (`transitionPlanStatus`, `getPageData` с week computation) живёт прямо в endpoint-файлах.
- [ ] **`packages/api-server/src/endpoints/platform/training-plans.ts` — ровно 300 строк, на пределе ESLint `max-lines`**. На след. добавлении придётся или splitt'ить (хорошо), или отключать правило (плохо).
- [ ] **CQRS-lite (команды vs запросы).** Read-models могут иметь другую форму, чем write-models. Сейчас одно и то же. `trainingPlanListItemSchema` добавляет `enrolledAthletesCount`, `workoutsToday`, `workoutsThisWeek` поверх `trainingPlanSchema` — это уже зачаток read-model, но сделанный ad-hoc.
- [ ] **`Workout.content String? @db.Text`** — весь «блок / сет / упражнение» уровень живёт как **plain text**. В БД **нет `WorkoutBlock`, `PrescribedSet`, `SetLog`, `Exercise`, `ExerciseCategory`**. Последствия: нет аналитики по exercise-level, нет PR-tracking, нет substitution, `WorkoutLog.isRx Boolean` — единственный factual feedback.

---

## 3. Безопасность

**Статус:** Не начато

То, на чём валят code review в больших компаниях. Критично закладывать до того, как появятся реальные пользователи и реальные деньги.

- [ ] **AuthZ > AuthN.** AuthN есть (NextAuth + wrappers). AuthZ — тоньше. Сейчас есть `verifyAthleteBelongsToCoach()`, но это ручная проверка в каждом хэндлере. Big Tech-подход: policy layer (CASL, oso, opa) — декларативные правила доступа, а не `if`'ы по всему коду.
- [ ] **`withPlatformAuth` не проверяет роль вообще** (`packages/api-routes/src/auth-wrappers.ts:28-37`) — только наличие session. Любой authenticated user (coach / athlete / admin) может вызвать ЛЮБОЙ platform endpoint. Разграничение полностью лежит на ручных guards внутри endpoint'а. Забыл вызвать guard = утечка.
- [ ] **`withAdminAuth` проверяет только `role === ADMIN`** — нет проверки «этот admin авторизован для ЭТОГО resource». Один ADMIN может всё.
- [ ] **AuthZ guards в `packages/api-server/src/endpoints/platform/guards.ts` делают по 1-2 DB query КАЖДЫЙ перед основной операцией.** Для `updateWorkout(userId, workoutId, data)`: `resolveCoachId` (1 query) + `verifyWorkoutOwnership` (1 query, включая plan join) + сама мутация (1 query) = 3 sequential queries на одно действие. Policy layer с single projection решил бы это одним query.
- [ ] **`resolveCoachId(userId)` не кэшируется** между вызовами одного request'а. Если endpoint делает 3 auth-protected действия — 3 одинаковых DB lookup'а.
- [ ] **Row-level security.** Для multi-tenant (coach видит своих athletes) — либо Postgres RLS, либо централизованный query guard. Никаких `where: { coachId }` по всему коду: один забытый `where` — и утечка. Сейчас `getCalendarWeek` использует inline `plan: { coachId }`, но другие методы делают отдельный `verifyPlanOwnership` — непоследовательно.
- [ ] **`verifyAthleteBelongsToCoach` требует `status === ACTIVE`** (`guards.ts:63`). PAUSED / COMPLETED enrollment не даёт coach'у доступ к логам athlete'а — может быть legitimately нужно для coaching review.
- [ ] **Идемпотентность платёжных мутаций.** Любая платёжная мутация должна принимать `Idempotency-Key`. Не опция — обязательное требование Stripe / PayPal.
- [x] **`Transaction.idempotencyKey String? @unique` уже в БД** (`schema.prisma:209`) — **но Optional**. Схема позволяет создавать транзакции без ключа. Нужно сделать `NOT NULL` + написать middleware, который принимает `Idempotency-Key` header и применяет.
- [x] **`Transaction.providerTxId String @unique`** (`schema.prisma:208`) — идемпотентность со стороны провайдера уже enforced на БД.
- [ ] **Аудит.** Любое изменение денежных или доступных ресурсов должно оставлять append-only запись: кто, когда, что, IP, source. Compliance (GDPR, SOC2) без этого не пройдёшь.
- [ ] **OWASP базово.** Rate limiting (где? на каком уровне? per user / per IP?), CSRF (NextAuth handles формы, но проверить), input sanitization для RichText (XSS-вектор в CMS), SSRF в загрузчиках изображений (`adminUploadApi`), file upload validation.
- [ ] **`adminUploadApi.uploadImage`** использует `Date.now()` как часть filename (`upload.ts:26`) — при двух быстрых загрузках в одном ms возможна коллизия.
- [ ] **Нет rate limiting в `withErrorHandling` / `createAuthWrappers`.** Ни одного вызова `rateLimit` или `@upstash/ratelimit` в коде.
- [ ] **Нет CSRF protection для не-NextAuth endpoints.** Public form `/api/public/contact` принимает POST — нужен rate limit минимум и captcha максимум.
- [ ] **PII классификация.** Какие поля — PII? Где шифруются? Сколько хранятся? У `AthleteProfile` есть `healthStatus`, `healthNote`, `weightKg`, `heightCm` — это потенциально медицинские данные (HIPAA-territory).
- [ ] **`handleApiError` логирует `console.error("API Error:", error)`** (`packages/api-routes/src/error-handler.ts:11`) — unstructured log без redaction. Если error.details содержит password / token / email — попадёт в log as-is. Нужен redactor на уровне logger'а.
- [ ] **Error response включает `details` в dev mode** — если AppError случайно содержит sensitive данные, они уйдут в dev response и в log.
- [ ] **Secrets hygiene.** `@repo/env` с Zod — хорошо. Добавить: проверку «никогда не логировать env в prod», `.env.example` как канон, вращение секретов, отделение build-time vs runtime env.

---

## 4. Надёжность и операционка

**Статус:** Не начато

Блокирует выход в прод. Без observability ты слепой, без timeouts — упираешься в пул соединений.

- [ ] **Observability-first.** Структурированный логгер (pino / winston) + correlation ID через весь запрос. Сейчас этого нет. Единственный logging в `@repo/api-routes/error-handler.ts:11` — `console.error("API Error:", error)` без структуры и метаданных.
- [ ] **Prisma client логирует только `error / warn` даже в dev** (`db/client.ts:56`) — нет `query` log. N+1 сыск затруднён.
- [ ] **Нет correlation ID injection в route handler factories** (`packages/api-routes/src/route-helpers.ts`). Ни одного `crypto.randomUUID()`, ни `headers().get('x-request-id')`. Любой лог не коррелируется с запросом.
- [x] **Error taxonomy частично существует.** `@repo/errors` экспортирует `AppError / HttpError / UnauthorizedError / ForbiddenError / NotFoundError / ConflictError / ValidationError / InternalServerError / BadRequestError`. `ERROR_CODES.INTERNAL_SERVER_ERROR` и подобные константы тоже есть. Нужно: задокументировать полный список, сделать stable machine-readable codes в response, добавить domain-specific коды (`AUTH_EXPIRED`, `QUOTA_EXCEEDED`, `SUBSCRIPTION_PAST_DUE`).
- [ ] **Error response format неидиоматичен:** `{ error: message, code, statusCode, timestamp, details?, stack? }` (`error-handler.ts:16-24`). `statusCode` дублирует HTTP status. Ideal — RFC 7807 Problem Details или `{ error: { code, message, details } }`.
- [ ] **`ApiClient` теряет server error code** (`packages/api-client/src/client.ts:79-89`) — сервер отдаёт стабильный `code: "USER_NOT_FOUND"`, а клиент создаёт generic `NotFoundError(message, details)` и теряет код. Клиент не может программно отличить ошибки.
- [ ] **`ApiClient.HTTP_STATUS_ERROR_MAP` неполный** — нет 429 (rate limit), 503, 502, 504. Все non-mapped ошибки → InternalServerError.
- [ ] **Timeouts и deadlines везде.** `ApiClient.request` делает `fetch` без AbortController → может висеть бесконечно. Любой upstream call без таймаута = потенциальный hang всего пула соединений.
- [ ] **Retry + backoff + jitter.** `ApiClient` не ретраит. Одна сетевая ошибка = fail.
- [ ] **Health / readiness endpoints.** Для каждого app. Ни `/api/health`, ни `/api/ready`, ни `/api/version` не существуют ни в admin, ни в marketing, ни в platform.
- [ ] **Metrics.** Латенси p50 / p95 / p99 на эндпоинт, error rate, saturation. OpenTelemetry — стандарт. Ни одного OpenTelemetry импорта в проекте.
- [ ] **Graceful degradation.** Если CMS отдаёт 500 — marketing должен показать stale cache, а не белый экран. Это архитектурное решение, не `if` в компоненте. `ApiClient` использует `cache: "no-store"` захардкоженно — нет возможности показать stale.

---

## 5. База данных и миграции

**Статус:** Не начато

Блокирует появление реальных данных. Чем позже чинишь — тем дороже, потому что параллельно копится прод-нагрузка.

- [ ] **Migrations как код первого класса.** `db:push` — это dev-режим. В проде должны быть версионированные миграции, обратимые, online (без table lock), с dry-run на staging. Директория `packages/api-server/prisma/migrations/` — проверить наличие.
- [ ] **Транзакционные границы.** Где используется `$transaction`, где нет? Любой мульти-write, который должен быть атомарным — в транзакции. Enrollment после purchase — классика. `createTrainingPlan` → `create` → `handlePrismaError` — одиночный insert, ок. Duplicate plan → надо проверять, делает ли это транзакцию.
- [ ] **Индексы.** Для каждого поля, по которому идёт `where` / `orderBy` в горячем пути, должен быть индекс. Многие модели уже индексированы (User имеет 6 индексов, TrainingPlan — 4), но **нужно ревью с EXPLAIN ANALYZE** на реальных данных.
- [ ] **Дублирующиеся индексы:** `User` имеет `@@index([role])` и `@@index([role, deletedAt])` — второй покрывает первый.
- [ ] **N+1 queries.** Включить Prisma query logging в dev, посчитать запросы на каждую страницу admin. Сюрпризы гарантированы. `training-plans.ts:getPageData` использует nested include — хорошо. Но другие endpoints могут не делать так.
- [ ] **Soft-delete extension дырявый** (`packages/api-server/src/db/client.ts`). Покрывает только `findMany / findFirst / findUnique / delete / deleteMany`. **Не покрывает `count`, `aggregate`, `groupBy`, `findUniqueOrThrow`, `findFirstOrThrow`, `update`, `updateMany`, `upsert`**. Критическая дыра: `prisma.user.count()` возвращает ВКЛЮЧАЯ soft-deleted → dashboard metrics могут быть кривыми. `update` на soft-deleted записи пройдёт без ошибки.
- [ ] **Soft-delete не транзитивен:** `Product` в `SOFT_DELETE_MODELS`, `Price` — НЕТ (`db/client.ts:5-14`). При soft-delete product'а его prices остаются `isActive=true`. На checkout пользователь может получить Price от soft-deleted product'а.
- [ ] **Hardcoded `SOFT_DELETE_MODELS` и `SOFT_DELETE_UNIQUE_FIELDS`** (`db/client.ts:5-19`) — два списка, не связанных со `schema.prisma`. Новая модель с `deletedAt` добавляется в схему → забыть добавить в список → soft-delete молча не применится.
- [ ] **`ModelDelegate` ручной type + `Reflect.get(client, key)` + `as unknown as`** (`db/client.ts:21-40`) — bypass Prisma's generated types. Отдельная неподдерживаемая иерархия типов.
- [ ] **`Price` не soft-deleted** — нет `deletedAt`, только `isActive` flag. Инконсистентно с Product.
- [ ] **`MarketingPage` / `MarketingPageSection` НЕ в `SOFT_DELETE_MODELS`**, только `MarketingBlogPost` / `MarketingReview` / `MarketingContactSubmission`. Инконсистентность CMS soft-delete policy.
- [ ] **`AthleteProfile` нет `deletedAt`** — profile удаляется hard через cascade при User soft-delete, что противоречит «User soft-delete» логике.
- [ ] **`CoachNote` — hard delete только.** Для coaching context может быть OK, но должно быть явное решение.
- [ ] **Check constraints отсутствуют.** `MarketingReview.rating Int @default(5)` — нет constraint'а `1 <= rating <= 5`. Prisma не поддерживает нативно → нужен raw SQL в миграции.
- [ ] **Retention policy.** Сколько хранятся workout logs? Soft-deleted записи? Влияет и на storage, и на GDPR. Не задокументировано.
- [ ] **Test infra обходит soft-delete extension** — `packages/api-server/src/test/helpers.ts:7` делает `new PrismaClient()` напрямую, без extension. `cleanup()` функция делает hard delete через universal `(rawPrisma as unknown as Record<...>)` каст (нарушает правило "No as casts" из CLAUDE.md).
- [ ] **Read replicas readiness.** Код не должен предполагать, что read идёт на primary. Разделение read / write — архитектурный выбор, который делают до того, как понадобится.
- [ ] **`Subscription.id String @id` без `@default(cuid())`** (`schema.prisma:179`) — внешний ID как primary key (Stripe `sub_xxx`). Требует ADR.

---

## 6. API Design

**Статус:** Не начато

Блокирует заморозку контрактов. Чем позже фиксируешь правила — тем больше breaking changes, когда появятся внешние потребители (мобильное приложение, партнёры).

- [ ] **Versioning.** Что делать, когда контракт сломается backward-incompatibly? `/api/admin/v2/...`? Заголовок `Api-Version`? Решение должно быть сейчас, не когда пригорит. Текущая структура: `/api/admin/*`, `/api/platform/*`, `/api/public/*`, `/api/auth/*` — без версии.
- [ ] **Error taxonomy в ответах.** Стабильные коды + консистентная форма: `{ code, message, details? }`. У клиента не должно быть if'ов по текстам сообщений. (См. пункт 4: формат сейчас есть, но неидиоматичен.)
- [ ] **Pagination везде.** Cursor-based, не offset (offset ломается на больших данных). В контрактах — дженерик `ListRequest<T>`. **Сейчас pagination не существует как концепт**: `getTrainingPlans` возвращает `z.array(trainingPlanSchema)`, `getAll: async (userId) => prisma.trainingPlan.findMany({ where: { coachId } })` без limit. Если у coach'а 1000 планов — все вернутся одним запросом.
- [ ] **Query params в `createAuthGetWithQueryHandler` обрабатываются через `Object.fromEntries(searchParams.entries())`** (`auth-factories.ts:26`) — не поддерживает array params (`?ids=1&ids=2` превратится в `ids: "2"`).
- [ ] **Rate limiting.** Где? На каком уровне? По user или по IP? С burst или smooth? Не «потом добавим» — это атака первого дня. Ни `rateLimit`, ни `@upstash/ratelimit` нет в deps.
- [ ] **Caching headers.** `Cache-Control`, `ETag`, `Last-Modified`. Next.js частично делает, но для собственных `/api/*` ты сам по себе. `ApiClient` захардкожено `cache: "no-store"`.
- [ ] **`createDeleteHandler` и `createPatchByParamHandler` возвращают `{ success: true }`** вместо `204 No Content` (`route-helpers.ts:103-106, 145`). Костыль.
- [ ] **`responseSchema?` — optional во всех factories** (`route-helpers.ts` + `auth-factories.ts`) — нарушение правила из CLAUDE.md «Validate API responses with Zod». Легко забыть → Zod валидации не будет.
- [ ] **`createFormDataPostHandler` без requestSchema** (`route-helpers.ts:109-119`) — form data не валидируется через Zod. Для file upload endpoints это дыра.
- [ ] **Нет body size limit на любом handler.** Большой JSON = OOM.
- [ ] **Нет `getByIdResponseSchema` отдельно от `getResponseSchema` для многих endpoints** — один и тот же `trainingPlanSchema` используется для list и detail. Если detail'у потом надо будет показывать больше полей — нельзя будет без breaking change.

---

## 7. Архитектурные риски на 6 месяцев вперёд

**Статус:** Не начато

Non-obvious стафф. Это то, что больнее всего ретрофитить — не из-за сложности кода, а из-за того, что к моменту, когда «пригорит», зависимостей уже слишком много. Решения принимаются сейчас.

- [ ] **Job queue.** Любая работа >100 ms, которую можно отложить, должна быть в очереди (BullMQ, Inngest, Trigger.dev). Синхронное выполнение в request / response упирается в стенку. Это архитектурное решение, не фича. **`CoachActionItem` генерирует события с `AUTO_*` резолюцией** → требует scheduled jobs, но их нет. Либо работает синхронно на запрос coach dashboard, либо вообще не работает.
- [ ] **Emails и notifications как first-class citizen.** Не `Resend.send()` в handler. Отдельный notification service с темплейтами, локалью, очередью, failure handling. Сейчас **ни одного email-провайдера нет в catalog**, `MarketingContactSubmission` в БД есть, но нет подтверждений отправителю.
- [ ] **Платформа vs продукт.** В голове должно быть разделение: «ядро платформы» (auth, billing, storage, notifications) vs «продуктовые фичи». Сейчас перемешано. Через год захочется второй продукт на той же платформе — и не выделится.
- [ ] **CMS governance.** Сейчас любой админ может поменять всё в admin CMS. Нужно: draft / publish workflow, версионирование контента, preview-режим, revision history, rollback. Не «feature» — фундамент. `MarketingPage` / `MarketingBlogPost` не имеют `isPublished` workflow (только `isFeatured`, `isActive`).
- [ ] **`MarketingBlogPost.isPublished` есть**, но нет версионности контента / preview mode.
- [ ] **Internationalization от нулевой строки.** Даже если сейчас только RU — зашить в архитектуру места, где текст живёт (i18n keys), форматирование дат / валют (`Intl`), направление текста. Retrofitting i18n — 3 месяца ада.
- [ ] **Hardcoded English strings в shared коде:** `packages/query/src/hooks/create-crud-hooks.ts:60-64` — `toast.success("${entityName} created successfully")`, `toast.error("Failed to ${action} ${entityName.toLowerCase()}")`. `.toLowerCase()` работает только для английского. Первый концентрированный pain point i18n retrofitting'а.
- [ ] **Billing domain существует в БД, но не в API.** Это окно для правильного проектирования — пока кода нет. Stripe схема (`stripeProductId`, `stripePriceId`, `Subscription.id` как external PK) уже выбрана implicit, но без ADR.

---

## 8. Monorepo дисциплина

**Статус:** Не начато

Усиливает все границы сверху. Без автоматического enforcement любая конвенция разваливается через месяц.

- [ ] **Enforced boundaries.** ESLint `import/no-restricted-paths` или `dependency-cruiser` — чтобы `apps/marketing` физически не мог импортировать из `apps/admin` или из LMS-контекста `api-server`. Конвенция без enforcement = не конвенция. **Хорошая новость:** `eslint-plugin-import` уже установлен → `no-restricted-paths` можно включить без новых deps.
- [ ] **Package API surface.** У каждого пакета явный `index.ts` с публичным API. Всё остальное — private. `exports` в `package.json` есть в большинстве пакетов — проверить, что нет обхода через deep imports.
- [ ] **`@repo/ui` имеет wildcard `exports: { "./*": "./src/*.tsx" }`** — любой .tsx доступен снаружи. **Breaking change**: сделать явный `index.ts` с контролируемым списком.
- [ ] **`api-server` не имеет subpath exports** — любой app получает всё. Добавить `"./cms"`, `"./lms"`, `"./iam"`, `"./billing"`, `"./coaching"` subpaths после рефакторинга bounded contexts.
- [ ] **Single version policy.** Все пакеты используют одну версию React, MUI, TS. **Частично реализовано через `pnpm-workspace.yaml catalog`** — это хороший pattern. Но: версии смешаны (exact + caret без системы): `next 16.1.1` exact, `react ^19.2.3` caret. Для critical infra (next, react, prisma) лучше все exact. `turbo 2.8.0` устарел на `2.9.5`.
- [ ] **`syncpack`** не установлен — нет автоматической проверки.
- [ ] **Две иконные либы:** `lucide-react` только в `apps/marketing`, `@mui/icons-material` в `admin`/`platform`. Инконсистентно.
- [ ] **No «util» packages.** `@repo/shared` — mixed bag: `constants/layout.ts` (UI), `helpers/{capitalize, date-calendar, format-date, locale, math, money, slugify}.ts`, `types/navigation.ts`. Utility-помойка. Разбить на: `@repo/money`, `@repo/dates`, `@repo/ui-tokens` (или просто перенести в соответствующие пакеты).
- [ ] **Turbo cache hit rate.** В CI должен быть 80%+. Ниже — кеши настроены плохо. Сейчас turbo кэш частичный (`build / check-types` cached, `dev / lint / format` не cached).
- [ ] **`turbo.json` не указывает dependsOn для `test`** — глобальный vitest в корневом `package.json`, не через turbo. Это значит turbo не orchestrate тесты. Задумайся — нужно ли?
- [ ] **`pre-commit type-check` периодически висит в parallel mode** (наблюдалось в этой сессии). Либо конкуренция за ресурсы между параллельными шагами, либо specific задача зависает. Надо разобрать.
- [ ] **ESLint `eslint-plugin-only-warn` конвертирует все errors → warnings**, затем `--max-warnings 0` возвращает их в блокирующий режим. Это работает в CI, но в IDE все проблемы показываются жёлтым (warning цвет) → визуально developer не чувствует severity. Спорное решение без ADR.

---

## 9. Тестирование

**Статус:** Не начато

Обычно худший скор у pet-проектов. Нужно до крупных рефакторингов, иначе любое изменение — риск в слепой зоне.

- [ ] **Test pyramid.** Big Tech-минимум:
  - **Unit** — чистые функции домена, без I/O.
  - **Integration** — `api-server` + реальная БД в Docker.
  - **Contract** — `contracts` валидируют совместимость api-server и api-client.
  - **E2E** — Playwright на критические флоу (signup → purchase → access).
- [x] **Integration harness частично есть.** `packages/api-server/src/test/helpers.ts` содержит `createTestUser`, `createTestCoach`, `createTestPlan`, `cleanup`. 14 integration тестов в `endpoints/platform/*.test.ts` используют реальный Prisma + реальный Postgres.
- [ ] **Нет per-test isolation.** Все тесты в одном файле шарят `beforeAll` → `afterAll(cleanup)`. Если тест падает посередине, cleanup может не сработать → мусор в БД → flaky следующие тесты.
- [ ] **`cleanup()` использует `(rawPrisma as unknown as Record<...>)` каст** для universal cleanup по table name — нарушение правила «No as casts» CLAUDE.md.
- [ ] **`cleanup()` глушит ошибки: `.catch(() => {})`** (`helpers.ts:59`) — silent failure.
- [ ] **Test helpers обходят `db/client.ts` extension** — `new PrismaClient()` напрямую, без soft-delete. Значит поведение тестов и прода различается.
- [ ] **Нет testing-library, нет jsdom/happy-dom environment.** `vitest.config.ts` использует `environment: "node"`. Все frontend components без тестов.
- [ ] **Нет тестов в `apps/*`, `packages/ui`, `packages/query`, `packages/api-client`, `packages/auth`, `packages/shared`.** Только `contracts` (2 файла) и `api-server` (14 файлов).
- [ ] **Нет Playwright / Cypress.** Ни одного e2e теста на критические флоу.
- [ ] **Contract tests** между `api-client` и `api-server` отсутствуют. Поскольку `api-client` не импортирует `@repo/contracts`, contract-testing было бы логичным дополнением.
- [ ] **Test data factories.** Частично есть (`createTestCoach`, etc.), но не типобезопасные в современном смысле (`factory.build({...})`). Нет overrides-merging, нет sequences, нет association traversal.
- [ ] **Test ergonomics.** `pnpm test` в корне запускает `vitest run` один раз для всего workspace. Сейчас 219 тестов ≈ 11 секунд. Ок пока, но при росте потребуется `--shard` или parallel mode.
- [ ] **Property-based tests** для money math, date math, доступа. fast-check — твой друг. Не установлен.
- [ ] **Mutation testing** (Stryker) для критичного кода — показывает, реально ли тесты что-то ловят, или это coverage для вида. Не установлен.

---

## 10. Фронт и Next.js 16

**Статус:** Не начато

Частично ретрофитится, но чем раньше — тем дешевле. Bundle budgets и RSC-дисциплина — пока бандл маленький.

- [ ] **Bundle budgets как hard gate.** `next build` должен падать в CI, если бандл превысил лимит. Не «посмотрим потом». Никакого `@next/bundle-analyzer`, `next-bundle-stats` в deps.
- [ ] **RSC discipline.** Правило «No unnecessary `use client`» — правильное. Нужен способ автоматически это проверять: ESLint-правило, которое матерится, когда `use client` не нужен.
- [ ] **Code splitting вручную.** Heavy deps (`@tiptap/*`, `framer-motion`, `@dnd-kit/*`) — dynamic imports, не в основном бандле. Сейчас все они в обычных `dependencies` потребителей.
- [ ] **`@repo/ui` грузит `framer-motion`, `@tiptap/*` в main dep-tree** — любой app, который импортирует `@repo/ui`, получает их в main bundle. Должно быть через dynamic imports или split packages.
- [ ] **Core Web Vitals budget.** LCP < 2.5s, CLS < 0.1, INP < 200 ms. Измерять в CI через Lighthouse CI. Не настроен.
- [ ] **Suspense boundaries** как архитектурное решение: где loading state, где error boundary. Не «забыли поставить».
- [ ] **Image / Font strategy.** Next Image везде, `next/font` без исключений, preload для hero images.
- [ ] **State management clarity.** URL state (правило есть) + React Query + form state. Ничего больше. Зафиксировать как принцип в ADR.
- [ ] **`cache: "no-store"` захардкожено в `ApiClient`** — нет opt-in на HTTP caching для GET запросов. Потеря производительности.

---

## 11. Качество кода

**Статус:** Не начато

То, на что смотрят микроскопом. У тебя с этим уже неплохо (см. anti-patterns в `CLAUDE.md`) — это полировка поверх уже хорошего фундамента.

- [ ] **Branded types.** `type UserId = string & { __brand: 'UserId' }` — `CoachId` и `AthleteId` не смешиваются, даже если оба `string`. `AuthenticatedHandler` принимает `userId: string` — любая строка.
- [ ] **Discriminated unions вместо if-цепочек.** `type Status = { kind: 'loading' } | { kind: 'success'; data: T } | { kind: 'error'; error: E }` — exhaustiveness checking бесплатно.
- [ ] **Immutability by default.** `readonly` на props, `ReadonlyArray`, `as const`. Объект, который никто не мутирует, но тип разрешает — бомба с часовым механизмом.
- [x] **`@typescript-eslint/no-non-null-assertion: "error"`** уже в `eslint-config/base.js` → соответствует правилу CLAUDE.md.
- [x] **`max-lines: 300`** уже в `eslint-config/base.js` → соответствует правилу CLAUDE.md. С override для `prisma/seed.ts`.
- [x] **`@typescript-eslint/consistent-type-imports`** c `inline-type-imports` уже настроен.
- [ ] **Cognitive complexity, не cyclomatic.** SonarQube / `eslint-plugin-sonarjs`. Функция с 15 if'ами — красная лампа. **Не установлен.**
- [ ] **Dead code.** `ts-prune` / `knip`. Не установлен. `packages/api-server/src/endpoints/platform/index.ts` НЕ экспортирует `coach-athlete-detail.ts` / `coach-athletes-list.ts`, но они вовлечены в `coach-athletes.ts` как агрегатор — не dead, но непрозрачная структура.
- [ ] **Файлы >300 строк, функции >50 строк** — уже ESLint-правило, но `training-plans.ts` = ровно 300 строк, на пределе.
- [ ] **TODO policy.** `// TODO` без ссылки на issue = нетрекаемый долг = не существует = никогда не будет сделан. ESLint должен ловить.
- [ ] **`tsconfig.base.json` не имеет:** `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`. Включить для более строгой проверки.
- [ ] **`eslint-plugin-only-warn`** — критическое UX-ухудшение в IDE (см. пункт 8). Желательно заменить на нативные `error` severity + fast CI.
- [ ] **`interface ApiClientConfig`** в `packages/api-client/src/client.ts:22` — нарушает правило CLAUDE.md «type, not interface».
- [ ] **`throw new Error(...)` в `create-crud-hooks.ts:97, 123, 148`** — generic Error вместо AppError из `@repo/errors`. Нарушение error hierarchy.
- [ ] **`route-helpers.ts` возвращает `{ success: true }`** — anti-pattern, должен быть `204 No Content` (дублирует пункт 6).

---

## 12. DX и процесс

**Статус:** Не начато

Процессная зрелость. Отличает senior-проект от junior.

- [ ] **Onboarding в один день.** Новый разработчик клонирует → `pnpm install` → `pnpm dev` → работает. Если нет — это баг инфраструктуры. Требует полноценного локального Postgres в Docker compose.
- [ ] **CI < 10 минут.** Дольше — люди перестают дожидаться, мержат «и так сойдёт». Сейчас CI не настроен явно (нет `.github/workflows` в видимых местах — проверить).
- [ ] **Pre-commit быстрый.** Lefthook есть. В этой сессии наблюдалось **зависание pre-commit hook на check-types в parallel mode**, лечащееся только `kill`. Нужно разобрать.
- [ ] **Feature flags как архитектура**, а не как `if`. LaunchDarkly / GrowthBook / OpenFeature. Деплой ≠ релиз. Не установлено.
- [ ] **PR template.** Обязательные секции: what, why, screenshots, how tested, rollback plan. Не существует.
- [x] **Changelog автоматически** из conventional commits — `commitlint` настроен в lefthook. Фактически changelog-генератор не запускается, но фундамент есть.
- [ ] **Deploy config не версионируется** (см. 1.5) — тоже DX-проблема: infrastructure as code отсутствует.
- [ ] **Нет `CONTRIBUTING.md`, `ARCHITECTURE.md`** (старый удалён как устаревший) — новый документ нужен, но уже на основе кода, а не aspirational видения.

---

## Порядок работ

Выполнение строго сверху вниз: каждый пункт после утверждения плана, один bullet = один коммит, прогресс отмечается в этом файле (checkbox `[x]` + поле «Статус»). Research-фаза секции обновляет файл новыми находками.

Code style и MUI-нюансы (то, что в `CLAUDE.md`) — последний слой полировки, не первый. Проблемы, которые реально убивают, живут уровнем выше.
