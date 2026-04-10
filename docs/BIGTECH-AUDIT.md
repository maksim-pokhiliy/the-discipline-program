# Big Tech Audit: рефакторинг и полировка

Что команда staff+ инженеров из FAANG / M7 проверяла бы на этом проекте при ревью на рефакторинг и полировку. Отсортировано по важности: от блокирующего фундамента к процессной зрелости.

**Контекст стека:** Turbo monorepo, Next.js 16, Prisma, MUI, CMS + LMS + billing. Проект до продакшена (база пустая, реальных пользователей нет) → идеальное время закладывать фундамент, а не латать задним числом.

**Критерий сортировки:** impact × блокирование следующих пунктов × стоимость ретрофита.

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

**Статус:** Не начато

System, not code. Это фундамент — всё остальное стоит на нём, поэтому идёт первым. Неправильные решения на этом уровне отравляют все последующие.

- **ADR (Architecture Decision Records).** Почему Turbo, а не Nx? Почему MUI, а не shadcn? Почему NextAuth, а не Clerk? Почему Prisma, а не Drizzle? В FAANG каждое такое решение — это ADR с trade-offs, альтернативами и датой. Без этого через год никто не помнит, почему так.
- **Bounded contexts.** Marketing, Admin CMS, LMS (coach / athlete), Billing — это разные домены. Сейчас они живут в одном `api-server`. Вопрос принципала: «Если завтра биллинг выносим в отдельный сервис — сколько файлов придётся трогать?» Ответ должен быть: «только `billing/`».
- **Dependency direction (ацикличный граф пакетов).** Проверяется через `madge --circular` или `dependency-cruiser`. Если `ui` знает про `contracts`, а `contracts` случайно знает про `ui` через типы — это запах.
- **Dependency inversion на границах.** `api-server` не должен напрямую знать про `stripe` / `resend` / `s3`. Это порты + адаптеры. Prisma уже изолирована — хорошо. То же нужно для почты, платежей, хранилища, очередей.
- **Failure domains / blast radius.** Если упадёт marketing — должен ли лечь admin? Platform? Один Next.js instance на всё — single point of failure. Вопрос про независимость деплоя и изоляцию отказов.

---

## 2. Доменная модель

**Статус:** Не начато

DDD lens. Без правильной модели всё, что на ней построено — кривое. Это второй слой фундамента после архитектурных границ.

- **Aggregates и инварианты.** «Singleton Subscription: 1 User = 1 Subscription» — это инвариант агрегата. Вопрос: где он гарантирован? В schema уникальным индексом? В domain layer? В route handler? Если в трёх местах — три разные истины. Big Tech ожидает: инвариант живёт в одном месте, ближайшем к данным.
- **Ubiquitous language.** Код говорит на языке бизнеса? `TrainingPlan` vs `Workout` vs `Program` — синонимы или разные сущности? Если спросить трёх людей — ответят одинаково? Без единого языка домен расползётся.
- **Value Objects.** `Money` не должен быть `number`. `centsToAmount` есть, но это helper, а не тип. `Money = { amount: number; currency: Currency }` — явный тип, который нельзя сложить с обычным числом. То же для `Email`, `Cuid`, `Slug`, `DurationSeconds`.
- **Anemic vs rich domain.** Сейчас классический anemic: schemas → types → мапперы → handlers. Работает, но логика размазана по endpoint'ам. Признак проблемы: если `api-server/endpoints/` растёт быстрее, чем домен — значит домена нет, есть CRUD.
- **CQRS-lite (команды vs запросы).** Read-models могут иметь другую форму, чем write-models. Сейчас одно и то же. Для дашбордов и аналитики выстрелит в ногу.

---

## 3. Безопасность

**Статус:** Не начато

То, на чём валят code review в больших компаниях. Критично закладывать до того, как появятся реальные пользователи и реальные деньги.

- **AuthZ > AuthN.** AuthN есть (NextAuth + wrappers). AuthZ — тоньше. Сейчас есть `verifyAthleteBelongsToCoach()`, но это ручная проверка в каждом хэндлере. Big Tech-подход: policy layer (CASL, oso, opa) — декларативные правила доступа, а не `if`'ы по всему коду.
- **Row-level security.** Для multi-tenant (coach видит своих athletes) — либо Postgres RLS, либо централизованный query guard. Никаких `where: { coachId }` по всему коду: один забытый `where` — и утечка.
- **Идемпотентность платёжных мутаций.** Любая платёжная мутация должна принимать `Idempotency-Key`. Не опция — обязательное требование Stripe / PayPal. Без этого дубли списаний — вопрос времени.
- **Аудит.** Любое изменение денежных или доступных ресурсов должно оставлять append-only запись: кто, когда, что, IP, source. Compliance (GDPR, SOC2) без этого не пройдёшь.
- **OWASP базово.** Rate limiting (где? на каком уровне? per user / per IP?), CSRF (NextAuth handles формы, но проверить), input sanitization для RichText (XSS-вектор в CMS), SSRF в загрузчиках изображений, file upload validation.
- **PII классификация.** Какие поля — PII? Где шифруются? Сколько хранятся? У athlete-профиля могут быть медицинские данные (HIPAA-territory) — уровень риска выше обычного SaaS.
- **Secrets hygiene.** `@repo/env` с Zod — хорошо. Добавить: проверку «никогда не логировать env в prod», `.env.example` как канон, вращение секретов, отделение build-time vs runtime env.

---

## 4. Надёжность и операционка

**Статус:** Не начато

Блокирует выход в прод. Без observability ты слепой, без timeouts — упираешься в пул соединений.

- **Observability-first.** Структурированный логгер (pino / winston) + correlation ID через весь запрос. Сейчас этого нет. Без этого в проде ты слепой.
- **Error taxonomy.** `AppError`, `HttpError` есть — хорошо. Добавить стабильные error codes (`AUTH_EXPIRED`, `QUOTA_EXCEEDED`), чтобы клиент мог обрабатывать программно. Строковые сообщения — для людей, коды — для машин.
- **Timeouts и deadlines везде.** Любой внешний вызов без таймаута = потенциальный hang всего пула соединений.
- **Retry + backoff + jitter.** Не «попробовать ещё раз», а exponential backoff с jitter и circuit breaker.
- **Health / readiness endpoints.** Для каждого app. Без них оркестратор не знает, когда перезапускать.
- **Metrics.** Латенси p50 / p95 / p99 на эндпоинт, error rate, saturation. OpenTelemetry — стандарт.
- **Graceful degradation.** Если CMS отдаёт 500 — marketing должен показать stale cache, а не белый экран. Это архитектурное решение, не `if` в компоненте.

---

## 5. База данных и миграции

**Статус:** Не начато

Блокирует появление реальных данных. Чем позже чинишь — тем дороже, потому что параллельно копится прод-нагрузка.

- **Migrations как код первого класса.** `db:push` — это dev-режим. В проде должны быть версионированные миграции, обратимые, online (без table lock), с dry-run на staging.
- **Транзакционные границы.** Где используется `$transaction`, где нет? Любой мульти-write, который должен быть атомарным — в транзакции. Enrollment после purchase — классика.
- **Индексы.** Для каждого поля, по которому идёт `where` / `orderBy` в горячем пути, должен быть индекс. Это ревью с `EXPLAIN ANALYZE`.
- **N+1 queries.** Включить Prisma query logging в dev, посчитать запросы на каждую страницу admin. Сюрпризы гарантированы.
- **Retention policy.** Сколько хранятся workout logs? Soft-deleted записи? Влияет и на storage, и на GDPR.
- **Read replicas readiness.** Код не должен предполагать, что read идёт на primary. Разделение read / write — архитектурный выбор, который делают до того, как понадобится.

---

## 6. API Design

**Статус:** Не начато

Блокирует заморозку контрактов. Чем позже фиксируешь правила — тем больше breaking changes, когда появятся внешние потребители (мобильное приложение, партнёры).

- **Versioning.** Что делать, когда контракт сломается backward-incompatibly? `/api/admin/v2/...`? Заголовок `Api-Version`? Решение должно быть сейчас, не когда пригорит.
- **Error taxonomy в ответах.** Стабильные коды + консистентная форма: `{ code, message, details? }`. У клиента не должно быть if'ов по текстам сообщений.
- **Pagination везде.** Cursor-based, не offset (offset ломается на больших данных). В контрактах — дженерик `ListRequest<T>`.
- **Rate limiting.** Где? На каком уровне? По user или по IP? С burst или smooth? Не «потом добавим» — это атака первого дня.
- **Caching headers.** `Cache-Control`, `ETag`, `Last-Modified`. Next.js частично делает, но для собственных `/api/*` ты сам по себе.

---

## 7. Архитектурные риски на 6 месяцев вперёд

**Статус:** Не начато

Non-obvious стафф. Это то, что больнее всего ретрофитить — не из-за сложности кода, а из-за того, что к моменту, когда «пригорит», зависимостей уже слишком много. Решения принимаются сейчас.

- **Job queue.** Любая работа >100 ms, которую можно отложить, должна быть в очереди (BullMQ, Inngest, Trigger.dev). Синхронное выполнение в request / response упирается в стенку. Это архитектурное решение, не фича.
- **Emails и notifications как first-class citizen.** Не `Resend.send()` в handler. Отдельный notification service с темплейтами, локалью, очередью, failure handling.
- **Платформа vs продукт.** В голове должно быть разделение: «ядро платформы» (auth, billing, storage, notifications) vs «продуктовые фичи». Сейчас перемешано. Через год захочется второй продукт на той же платформе — и не выделится.
- **CMS governance.** Сейчас любой админ может поменять всё в admin CMS. Нужно: draft / publish workflow, версионирование контента, preview-режим, revision history, rollback. Не «feature» — фундамент.
- **Internationalization от нулевой строки.** Даже если сейчас только RU — зашить в архитектуру места, где текст живёт (i18n keys), форматирование дат / валют (`Intl`), направление текста. Retrofitting i18n — 3 месяца ада.

---

## 8. Monorepo дисциплина

**Статус:** Не начато

Усиливает все границы сверху. Без автоматического enforcement любая конвенция разваливается через месяц.

- **Enforced boundaries.** ESLint `import/no-restricted-paths` или `dependency-cruiser` — чтобы `apps/marketing` физически не мог импортировать из `apps/admin`. Конвенция без enforcement = не конвенция.
- **Package API surface.** У каждого пакета явный `index.ts` с публичным API. Всё остальное — private. `exports` в `package.json` есть — проверить, что нет обхода через deep imports.
- **Single version policy.** Все пакеты используют одну версию React, MUI, TS. Ловится через `syncpack`.
- **No «util» packages.** Если `@repo/utils` — помойка несвязанного, разбить по доменам.
- **Turbo cache hit rate.** В CI должен быть 80%+. Ниже — кеши настроены плохо.

---

## 9. Тестирование

**Статус:** Не начато

Обычно худший скор у pet-проектов. Нужно до крупных рефакторингов, иначе любое изменение — риск в слепой зоне.

- **Test pyramid.** Big Tech-минимум:
  - **Unit** — чистые функции домена, без I/O.
  - **Integration** — `api-server` + реальная БД в Docker.
  - **Contract** — `contracts` валидируют совместимость api-server и api-client.
  - **E2E** — Playwright на критические флоу (signup → purchase → access).
- **Test data factories.** Никаких JSON-фикстур. `userFactory.build({ role: 'COACH' })` — композируемое, типобезопасное.
- **Test ergonomics.** Один `pnpm test` запускает всё и быстрый. Медленный = разработчики перестают запускать локально = тесты умирают.
- **Property-based tests** для money math, date math, доступа. fast-check — твой друг.
- **Mutation testing** (Stryker) для критичного кода — показывает, реально ли тесты что-то ловят, или это coverage для вида.

---

## 10. Фронт и Next.js 16

**Статус:** Не начато

Частично ретрофитится, но чем раньше — тем дешевле. Bundle budgets и RSC-дисциплина — пока бандл маленький.

- **Bundle budgets как hard gate.** `next build` должен падать в CI, если бандл превысил лимит. Не «посмотрим потом».
- **RSC discipline.** Правило «No unnecessary `use client`» — правильное. Нужен способ автоматически это проверять: ESLint-правило, которое матерится, когда `use client` не нужен.
- **Code splitting вручную.** Heavy deps (rich text editor, chart libs) — dynamic imports, не в основном бандле.
- **Core Web Vitals budget.** LCP < 2.5s, CLS < 0.1, INP < 200 ms. Измерять в CI через Lighthouse CI.
- **Suspense boundaries** как архитектурное решение: где loading state, где error boundary. Не «забыли поставить».
- **Image / Font strategy.** Next Image везде, `next/font` без исключений, preload для hero images.
- **State management clarity.** URL state (правило есть) + React Query + form state. Ничего больше. Зафиксировать как принцип.

---

## 11. Качество кода

**Статус:** Не начато

То, на что смотрят микроскопом. У тебя с этим уже неплохо (см. anti-patterns в `CLAUDE.md`) — это полировка поверх уже хорошего фундамента.

- **Branded types.** `type UserId = string & { __brand: 'UserId' }` — `CoachId` и `AthleteId` не смешиваются, даже если оба `string`.
- **Discriminated unions вместо if-цепочек.** `type Status = { kind: 'loading' } | { kind: 'success'; data: T } | { kind: 'error'; error: E }` — exhaustiveness checking бесплатно.
- **Immutability by default.** `readonly` на props, `ReadonlyArray`, `as const`. Объект, который никто не мутирует, но тип разрешает — бомба с часовым механизмом.
- **Cognitive complexity, не cyclomatic.** SonarQube / `eslint-plugin-sonarjs`. Функция с 15 if'ами — красная лампа.
- **Dead code.** `ts-prune` / `knip`. Удалять безжалостно. Мёртвый код — когнитивная нагрузка без пользы.
- **Файлы >300 строк, функции >50 строк** — не закон, но триггер ревью.
- **TODO policy.** `// TODO` без ссылки на issue = нетрекаемый долг = не существует = никогда не будет сделан. ESLint должен ловить.

---

## 12. DX и процесс

**Статус:** Не начато

Процессная зрелость. Отличает senior-проект от junior.

- **Onboarding в один день.** Новый разработчик клонирует → `pnpm install` → `pnpm dev` → работает. Если нет — это баг инфраструктуры.
- **CI < 10 минут.** Дольше — люди перестают дожидаться, мержат «и так сойдёт».
- **Pre-commit быстрый.** Lefthook есть. Проверить: сколько секунд? Если >10 s — люди начнут `--no-verify`.
- **Feature flags как архитектура**, а не как `if`. LaunchDarkly / GrowthBook / OpenFeature. Деплой ≠ релиз.
- **PR template.** Обязательные секции: what, why, screenshots, how tested, rollback plan.
- **Changelog автоматически** из conventional commits (уже есть).

---

## Порядок работ

Выполнение строго сверху вниз: каждый пункт после утверждения плана, один пункт = один коммит, прогресс отмечается в этом файле (чекбокс + поле «Статус»).

Code style и MUI-нюансы (то, что в `CLAUDE.md`) — последний слой полировки, не первый. Проблемы, которые реально убивают, живут уровнем выше.
