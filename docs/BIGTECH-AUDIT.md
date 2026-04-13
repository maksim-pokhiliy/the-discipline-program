# Big Tech Audit: рефакторинг и полировка

Что команда staff+ инженеров из FAANG / M7 проверяла бы на этом проекте при ревью на рефакторинг и полировку. Отсортировано по важности: от блокирующего фундамента к процессной зрелости.

**Контекст стека:** Turbo monorepo, Next.js 16, Prisma, MUI, CMS + LMS + billing. Проект до продакшена (база пустая, реальных пользователей нет) → идеальное время закладывать фундамент, а не латать задним числом.

**Критерий сортировки:** impact × блокирование следующих пунктов × стоимость ретрофита.

**Документ живой.** В процессе research каждого пункта новые находки добавляются как отдельные bullets. Удалять пункты запрещено, кроме случая «код доказал, что проблема не существует».

---

## Прогресс

- [x] 1. Архитектура и границы
- [x] 2. Доменная модель
- [ ] 3. Безопасность
- [ ] 4. Надёжность и операционка
- [x] 5. База данных и миграции
- [x] 6. API Design
- [x] 7. Архитектурные риски на 6 месяцев вперёд
- [x] 8. Monorepo дисциплина
- [ ] 9. Тестирование
- [ ] 10. Фронт и Next.js 16
- [ ] 11. Качество кода
- [ ] 12. DX и процесс

---

## 1. Архитектура и границы

**Статус: Завершена.** Все подсекции (1.1–1.6) закрыты. 29 коммитов (1.1.A–1.6.D, включая deferred 1.4.B → §2).

System, not code. Это фундамент — всё остальное стоит на нём, поэтому идёт первым. Неправильные решения на этом уровне отравляют все последующие.

### Research summary — что УЖЕ хорошо

- [x] **Циклов между пакетами нет** (подтверждено madge + ручной анализ 13 `package.json`).
- [x] **Все 28 импортов `@prisma/client` — внутри `packages/api-server/`** → инвариант «api-server — единственный Prisma consumer» соблюдается.
- [x] **Apps не импортируют друг друга** (grep verified).
- [x] **Cross-bounded-context leaks отсутствуют de-facto:** marketing endpoints тянут только CMS contracts, admin — CMS + IAM + admin-dashboard, platform — LMS + Coaching + IAM. Нарушений нет, но enforcement отсутствует.
- [x] **Route handlers используют factories корректно** — нет hand-rolled `NextResponse.json` в apps/_/api/_/route.ts.
- [x] **`AuthServiceAdapter` в `packages/auth/src/auth-options.ts`** — рабочий пример port/adapter, можно использовать как reference.
- [x] **`onlyBuiltDependencies` в `pnpm-workspace.yaml`** — security: явный allow-list postinstall scripts.

### Implementation plan (section 1)

Подход C (гибрид): research секции — один раз, реализация — по bullet'у = по коммиту. Прогресс отмечается здесь по мере закрытия.

| №     | Commit hash | Status       | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ----- | ----------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1.A | `53b5ebe`   | ✅ Done      | ADR framework: `docs/adr/README.md`, `_template.md`, meta-ADR 0001.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.1.B | `ace64ca`   | ✅ Done      | Backfill 13 ADRs (0002–0014) for existing implicit decisions.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 1.2.A | `f107e0a`   | ✅ Done      | Create `docs/BOUNDED-CONTEXTS.md` documenting CMS, LMS, Coaching, IAM, Billing contexts.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 1.2.B | `11fd9cc`   | ✅ Done      | Reorganize `packages/contracts/src/entities/` into context subdirectories (cms/lms/coaching/iam/billing) + subpath exports.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.2.C | `d4cfb03`   | ✅ Done      | Reorganize `packages/api-server/src/endpoints/` by bounded context + consolidate CMS duplication (admin/marketing share code).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.2.D | `7f233fa`   | ✅ Done      | Remove barrel export in `api-server/src/index.ts`; enforce subpath imports (`@repo/api-server/cms`, `@repo/api-server/lms`, etc.).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.2.E | `74da02e`   | ✅ Done      | Reorganize `packages/api-server/src/mappers/` by bounded context (`mappers/{cms,lms,coaching,iam}/`). New finding from 1.2.C research.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.2.F | `59c4497`   | ✅ Done      | Rename api-server public API symbols to context/role convention (`adminBlogApi → cmsBlogAdminApi`, etc.). 24 symbols, 56 consumer files. Sequenced after 1.2.D.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.2.G | `d04f246`   | ✅ Done      | Extract blog reads from `cms/pages/public.ts` into new `cms/blog/public.ts` exposing `cmsBlogPublicApi` (`listPublished()` + `getArticle(slug)`). Pages endpoint delegates, marketing article route switches to `cmsBlogPublicApi`. New finding from 1.2.C research.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.2.H | `177edcf`   | ✅ Done      | Mirror 1.2.G on marketing client: `apps/marketing/src/lib/api/endpoints/blog.ts` with `getArticle()`, remove `getBlogArticle` from `pages.ts`, update consumers (`use-blog.ts`, `app/blog/[slug]/page.tsx`). Surfaced during 1.2.G.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.2.I | `6b9628b`   | ✅ Done      | Close LMS→Coaching leak: split `planEnrollmentSchema` into pure LMS + enriched `coaching/plan-roster`. `lmsPlanEnrollmentApi` keeps mutations, new `coachingPlanRosterApi` owns reads. Mapper-level leak closes with the same fix.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 1.2.J | `a05b36f`   | ✅ Done      | Close IAM→Coaching leak: split `iam/user/user.schema.ts` into pure `userSchema` + new `coaching/admin-user-view/`. `iamUserAdminApi` keeps mutations + list, new `coachingAdminUserViewApi` owns the enriched read. Mapper-level leak closes with the same fix.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.2.K | `0e8f2c5`   | ✅ Done      | Test cleanup: move `describe("mapToAthleteProfile")` and `describe("mapToCoachProfile")` blocks out of `mappers/iam/user.mapper.test.ts` into per-mapper test files in `mappers/coaching/`. 1.2.E leftover surfaced during 1.2.J test split.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 1.3.A | `c7631a7`   | ✅ Done      | Add `dependency-cruiser` with 17 boundary rules encoding BOUNDED-CONTEXTS.md §8 (contracts leafs, IAM/LMS/CMS direction rules, Prisma isolation, app-scope rules, admin→coaching file-precise carve-out). Wired into lefthook pre-push. First run green: 0 violations on 785 modules / 1409 dependencies.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.3.B | `1303ec4`   | ✅ Done      | Add `.github/workflows/ci.yml` with 5 parallel lanes (check-types, lint, dep-check, test, build). Test lane uses postgres:16-alpine service container + `prisma db push` for fresh schema. Build lane uses dummy env + `SKIP_ENV_VALIDATION=1`. Concurrency cancels in-flight runs for the same ref.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.3.C | `5c76b46`   | ✅ Done      | Generate and commit dep-graph artifact at `docs/DEPENDENCY-GRAPH.md`. Mermaid flowchart collapsed to package/app level (~16 nodes). Regenerated via `pnpm dep:graph` → `scripts/dep-graph.mjs` helper → wraps `depcruise --output-type mermaid --collapse` output in a markdown template.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.4.A | `6f9ca98`   | ✅ Done      | Storage port + vercel-blob adapter in `api-server/src/infrastructure/storage/`. Factory `createIamUploadAdminApi(storage)` wires `defaultStorage` in the `iam/` barrel; tests use a fake `StoragePort` — first factory+fake-DI pattern in api-server tests. Wakes up dead `@repo/env/blob` for boot-time token validation.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 1.4.B | `5eb2cee`   | ✅ Done (§2) | **Closed by 2.3.A.** Money value object landed in `@repo/contracts/common/money` with `moneySchema`, `Money` type, `CENTS_PER_UNIT`, `centsToAmount`, `amountToCents`, `formatPrice`. Moved from `@repo/shared`.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 1.4.C | `1779400`   | ✅ Done      | Scaffold 4 new ports (email / cache / queue / payment) in `api-server/src/infrastructure/` alongside storage (1.4.A). Each port dir: `port.ts` (committed interface, zero vendor SDK imports), `index.ts` (type re-exports only — no adapter yet), `README.md` (purpose, shape, vendor candidates, open questions, adapter placement, non-goals). Top-level `infrastructure/README.md` documents the convention. No adapters, no consumers, no tests — pure scaffolding. `infrastructure/` stays out of scope for all context-scoped dep-cruiser rules by construction. Module count 789 → 797.                                                                                                                                                                                               |
| 1.4.D | `f4e4655`   | ✅ Done      | Move upload endpoint + `iam/upload/` contracts out of IAM into a new Storage supporting context. Contracts: `contracts/iam/upload/` → `contracts/storage/upload/`, subpath export `@repo/contracts/storage/upload`. api-server: `endpoints/iam/upload.{ts,test.ts}` → `endpoints/storage/`, new barrel with `createStorageUploadAdminApi(defaultStorage)`, subpath export `@repo/api-server/storage`. Symbols: `iamUploadAdminApi` → `storageUploadAdminApi` (+ factory + type). 5 admin consumers updated. Two new dep-cruiser rules (`contracts-storage-is-leaf` + `api-server-storage-is-leaf`). BOUNDED-CONTEXTS.md: §1 IAM renamed "Identity and Access" (no Media), new §6 "Storage — supporting context" written in full, §7–§12 renumbered. ADR 0013 updated. Module count 797 → 798. |
| 1.5.A | `e9566aa`   | ✅ Done      | Add `vercel.json` per app with security headers (CSP, HSTS, X-Frame-Options, etc.). Also fix `remotePatterns` in all `next.config.ts`: platform missing blob pattern entirely, marketing has fragile Instagram CDN hostname (`scontent-iev1-1.cdninstagram.com`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| 1.5.B | `75c2448`   | ✅ Done      | Add `/api/health`, `/api/ready`, `/api/version` endpoints to every app + handler factories in `@repo/api-routes`. Readiness probe via `checkDatabase` (`SELECT 1`) from new `@repo/api-server/ops` subpath. Version endpoint exposes `VERCEL_GIT_COMMIT_SHA`. `turbo.json` `globalEnv` extended. Dep-cruiser: `ops/` naturally exempt (not a domain context). Module count 798 → 806, deps 1415 → 1429.                                                                                                                                                                                                                                                                                                                                                                                       |
| 1.5.C | `2c596b9`   | ✅ Done      | Add `docs/DEPLOY.md` describing failure domains, rollback procedure, env layout. Covers: deployment topology (3 independent Vercel projects, shared Neon DB + Blob), failure domain matrix, health/ready/version endpoints, env var inventory with per-app usage, CI pipeline summary, rollback procedure (Vercel instant rollback + DB caveats), security headers summary.                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.5.D | `19ce4ef`   | ✅ Done      | Create `.env.example` at repo root documenting every required env var. Grouped by concern (database, auth, public URLs, blob, build/CI). Comments reference `docs/DEPLOY.md` and list which apps need each var. Commented-out build-only vars (`SKIP_ENV_VALIDATION`, `VERCEL_GIT_COMMIT_SHA`).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 1.5.E | `b696c47`   | ✅ Done      | Add `apps/admin/src/proxy.ts` with server-side ADMIN role check. Server-side proxy checks JWT `role === ADMIN` before any page HTML is sent. Non-admin authenticated users redirected to login. API routes excluded from matcher (own auth via `withAdminAuth` + health endpoints must stay public).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| 1.5.F | `8d732dd`   | ✅ Done      | Add role-based route protection to `apps/platform/src/proxy.ts`. Enforces USER→`/athlete/*`, COACH→`/coach/*` via `startsWith` check. ADMIN and unknown roles redirected to login (no valid role home). API routes excluded from matcher. `getRoleHome` refactored from ternary to `Record<string, string>` lookup with null-safe return.                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.6.A | `23f805d`   | ✅ Done      | Fix `@repo/auth` dual-instance risk: remove `next-auth` from `dependencies`, keep only in `peerDependencies`. Consumer apps (admin, platform) already have `next-auth` in their own dependencies. Lockfile updated.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.6.B | `b38d6e1`   | ✅ Done      | Replace `@repo/ui` wildcard `exports` with controlled public API via `index.ts`. Removed `"./*": "./src/*.tsx"` wildcard — zero consumers used it (all import from root `@repo/ui`). Public API now exclusively through `src/index.ts` barrel.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 1.6.C | `8622e39`   | ✅ Done      | Declare `@repo/contracts` dependency in `@repo/api-client`. Client code doesn't import contracts yet (raw generic `request<T>`), but the dependency declaration makes the graph honest. Actual response validation is a §6 concern.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.6.D | `689593e`   | ✅ Done      | Minor package.json hygiene: `@repo/api-client` peer `next: "*"` → `catalog:` (pinned to 16.1.1), `@repo/query` removed `sonner` from `devDependencies` (already in `peerDependencies`), `@repo/env` version `0.0.0` → `0.1.0` (aligned with other packages).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

**Execution order** (derived from dependencies): 1.1 → 1.3.A (early so subsequent refactors trip dep-cruiser fast) → 1.2 → 1.4 → 1.5 → 1.6 → 1.3.B/C (CI gate last, when structure is stable).

**To resume work in a new session:** read this table, find the first row with status `⏳ Next` or `Pending`, implement it following the bullet descriptions in the relevant 1.x subsection below.

### 1.1. ADR-инфраструктура

- [x] **~~Нет папки `docs/adr/` и ADR-процесса.~~** Создана в commit 1.1.A. `docs/adr/README.md` описывает Michael Nygard формат, lifecycle, numbering. `docs/adr/0001-use-adr-for-architecture-decisions.md` — meta-ADR про процесс, содержит Context-секцию со списком исторических implicit-решений для backfill.
- [x] **~~Backfill ADR для уже принятых implicit решений.~~** Сделано в commit 1.1.B. ADR 0002-0014 покрывают: Turbo (0002), Prisma ORM (0003), NextAuth credentials (0004), contracts-first с Zod (0005), MUI design system (0006), Prisma isolation to api-server (0007), singleton subscription invariant (0008), soft-delete Prisma extension (0009), BFF via HTTP loopback (0010), two NextAuth instances (0011), JWT session strategy (0012), Vercel Blob storage (0013), Stripe as implicit payment provider (0014).
- [x] **~~Нет template для новых ADR.~~** Создан в 1.1.A: `docs/adr/_template.md`.

### 1.2. Bounded contexts

- [x] **~~`packages/api-server/src/endpoints/` сгруппирован по consumer (`admin/`, `marketing/`, `platform/`), а не по domain.~~** Закрыто в commit 1.2.C. Endpoint-слой реорганизован в 5 контекст-папок (`cms/`, `lms/`, `coaching/`, `iam/`, `billing/`). Дублирование CMS между `admin/` и `marketing/` устранено: теперь `cms/<entity>/admin.ts` + `cms/<entity>/public.ts` / `inbound.ts` живут рядом. Cross-cutting authz-guards вынесены в новый top-level `packages/api-server/src/authz/` (не внутри endpoints/), context-specific утилиты (`dashboard-computations`, `enrollment-query` → coaching; `page-sections`, `toggle-exclusive-featured` → cms) вынесены из `utils/` в свои контексты. `services/` каталог удалён — `auth.ts` переехал в `iam/auth-service.ts`.
- [x] **~~В `admin/endpoints/` смешаны CMS-ресурсы (blog, contacts, pages, products, reviews) и admin analytics (dashboard, users, upload).~~** Закрыто в commit 1.2.C вместе с основной реорганизацией. Admin analytics (`dashboard.ts`) → `cms/dashboard/admin.ts` (4 из 5 data sources — CMS, поэтому живёт в CMS). Admin users → `iam/users-admin.ts`. Admin upload → `iam/upload.ts`. CMS-ресурсы разбиты по entity-папкам в `cms/`.
- [x] **~~В `contracts/src/entities/` 21 сущность плоским списком.~~** Закрыто в commit 1.2.B. `packages/contracts/src/entities/` реорганизован в 5 контекст-папок (`cms/`, `lms/`, `coaching/`, `iam/`, `billing/`). `contracts/package.json` теперь имеет 21 contextful subpath export (`./cms/blog`, `./lms/training-plan`, и т.д.) + `.` + `./common`. Все ~246 import-сайтов в `apps/` и `packages/` обновлены. Billing-папка создана пустой с README-placeholder.
- [ ] **Billing domain существует только в БД.** `schema.prisma` содержит `Product`, `Price`, `Subscription`, `Transaction`, но `packages/contracts/src/entities/` не имеет ни `subscription`, ни `transaction`, ни `price`. В `api-server/endpoints/` нет ни одного billing endpoint. В route handlers нет `/api/.../billing/*` и `/api/webhooks/stripe`. **Идеальное окно заложить billing bounded context правильно, пока кода нет.**
- [x] **~~`api-server` не имеет subpath exports.~~** Закрыто в commit 1.2.D. `packages/api-server/package.json` теперь экспортирует 4 context subpath'а: `./cms`, `./lms`, `./coaching`, `./iam` (каждый указывает на соответствующий `src/endpoints/<context>/index.ts`). Поля `main` / `types` удалены, root `.` export тоже — единственный способ импортировать api-server теперь через context subpath. `src/index.ts` и `src/endpoints/index.ts` удалены как dead barrels. Все 56 consumer-файлов в `apps/admin`, `apps/marketing`, `apps/platform` мигрированы (cms: 22, lms: 20, coaching: 8, iam: 6). `billing` и `authz` субпаты намеренно не добавлены: billing не имеет endpoint'ов, authz не имеет внешних consumer'ов (internal api-server использует relative paths). Даёт dependency-cruiser (1.3.A) syntactic handle для enforcement boundary-правил.
- [ ] **Первая dependency rule, которую надо заэнфорсить:** `apps/marketing` не должен видеть `@repo/api-server` ничего, кроме CMS-контекста. Сейчас import-граф ничего не запрещает.
- [x] **~~Нет документа, который декларирует bounded contexts~~** Создан в commit 1.2.A: `docs/BOUNDED-CONTEXTS.md`. Документирует CMS / LMS / Coaching / IAM / Billing с aggregates, value objects, invariants, dependencies, target-state файловой структуры, shared `Product` split rule, cross-context invariants таблицу, dependency-direction граф и де-факто non-leak verification.
- [ ] **CoachActionItem генерирует события `MISSED_WORKOUTS / NEW_NO_START / HEALTH_REPORT`** (см. `schema.prisma:308-323`), но нет background scheduler'а. Либо эти события создаются лениво при запросе dashboard'а, либо вообще не создаются. Сoaching context не отделён от LMS и не имеет явного event-boundary.
- [x] **~~LMS→Coaching leak: `lms/plan-enrollment/plan-enrollment.schema.ts` импортирует `HealthStatus` из `coaching/athlete-profile`.~~** Закрыто в commit `6b9628b` (1.2.I). Выбран CQRS-lite split — LMS владеет pure `planEnrollmentSchema` (id, trainingPlanId, userId, startDate, endDate, status, createdAt — без user-объекта, без health); Coaching получил новую сущность `coaching/plan-roster/` с `planRosterEntrySchema` = `planEnrollmentSchema.extend({ user: planRosterUserSchema })`, где `planRosterUserSchema` содержит id/name/email/image + `healthStatus` (`healthStatusSchema` импортируется локально из `coaching/athlete-profile`, coaching→coaching). Direction respects `BOUNDED-CONTEXTS.md §8`: Coaching→LMS разрешено и уже было в `coach-athletes-api.schema.ts`. **Endpoint split:** `lmsPlanEnrollmentApi` оставлен только на mutations (`create`/`update`/`delete`, возвращают pure `PlanEnrollment`), reads (`getAll`/`getById`) вынесены в новый `coachingPlanRosterApi.list()` / `.getById()`, возвращающий enriched `PlanRosterEntry[]`/`PlanRosterEntry`. Оба endpoint'а используют существующие `resolveCoachId` + `verifyPlanOwnership` guards из `authz/`. **Mapper-level leak закрыт той же фиксацией:** `mappers/lms/plan-enrollment.mapper.ts` теперь чистый (удалены `HealthStatus` + `HEALTH_STATUS_MAP` импорты), новый `mappers/coaching/plan-roster.mapper.ts` содержит `mapToPlanRosterEntry`, который reuse'ит `mapToPlanEnrollment` из LMS mapper'а (coaching→lms — разрешённое направление, уже установленный в 1.2.E паттерн для cross-context aggregation). **Route handlers:** `apps/platform/.../enrollments/route.ts` — GET делегирует в `coachingPlanRosterApi.list`, POST остаётся на `lmsPlanEnrollmentApi.create` (response schema теперь pure); `enrollments/[enrollmentId]/route.ts` — GET в coaching, PUT/DELETE в lms. **UI-консьюмеры:** `apps/platform/src/lib/api/endpoints/plan-enrollments.ts`, `lib/hooks/use-plan-enrollments.ts` (`useOptimisticMutation<PlanRosterEntry[], ...>`), `plan-detail/components/enrollment-card.tsx` и `enroll-athlete-dialog.tsx` переведены на `PlanRosterEntry` из coaching. `PlanEnrollmentStatus` enum остался чистым LMS concept, все консьюмеры продолжают импортить его из lms. `useBulkEnrollAthletes` использует `PlanEnrollment` как тип fulfilled create-response — pure shape, корректно остаётся в LMS. `packages/contracts/package.json` добавил subpath export `./coaching/plan-roster`.
- [x] **~~IAM→Coaching leak: `iam/user/user.schema.ts` импортирует `athleteProfileSchema` + `coachProfileSchema` из `coaching/`.~~** Закрыто в commit `a05b36f` (1.2.J). Применён CQRS-lite split (зеркало 1.2.I). IAM теперь владеет pure `userSchema` (id, email, name, role, image, timezone, emailVerified, createdAt, updatedAt — без profile-relations); `adminUserListItemSchema`, `userSearchResultSchema`, `updateUserRoleSchema` остаются в `iam/user/` (они и так были pure). Coaching получил новую сущность `coaching/admin-user-view/` с `adminUserViewSchema = userSchema.extend({ athleteProfile: athleteProfileSchema.nullable(), coachProfile: coachProfileSchema.nullable() })`. Direction Coaching→IAM разрешено (`BOUNDED-CONTEXTS.md §8`: Coaching → IAM, LMS). **Endpoint split:** `iamUserAdminApi` оставлен только на mutations + list (`getAll`/`getPageData`/`updateRole` с return type pure `User` через `mapToUser`). Read view вынесен в новый `coachingAdminUserViewApi.getById()` → enriched `AdminUserView`. **Mapper-level leak закрыт той же фиксацией:** `mappers/iam/user.mapper.ts` теперь чистый — только `mapToUser` (новая) + `mapToAdminUserListItem`, никаких импортов из coaching. Новый `mappers/coaching/admin-user-view.mapper.ts` содержит `mapToAdminUserView`, который reuse'ит `mapToUser` из IAM mapper'а (coaching→iam, разрешённое направление). Импорты `mapToAthleteProfile`/`mapToCoachProfile` теперь локальные внутри coaching mappers. **Route handler:** `apps/admin/src/app/api/admin/users/[id]/route.ts` — GET переключён на `coachingAdminUserViewApi.getById` (с новыми `getAdminUserViewParamsSchema` + `getAdminUserViewResponseSchema` из coaching), PUT остаётся на `iamUserAdminApi.updateRole`. **UI-консьюмеры:** `apps/admin/src/lib/api/endpoints/users.ts` — `getById` теперь возвращает `Promise<AdminUserView>`, `updateRole` возвращает `Promise<void>` (response не используется UI). `apps/admin/src/lib/hooks/use-users.ts` — отказались от `createCrudHooks` (он требует одинаковый `TEntity` для read и update, что не подходит при разных shape), хуки переписаны вручную через `useQuery` + `useMutation`. `profile-card.tsx`, `user-detail-section/index.tsx`, `user-detail-view/index.tsx` переключены на `AdminUserView` тип. `packages/contracts/package.json` добавил subpath export `./coaching/admin-user-view`. **Test-level cleanup:** `mappers/iam/user.mapper.test.ts` потерял `describe("mapToAdminUser", ...)` блок (тесты переехали в новый `mappers/coaching/admin-user-view.mapper.test.ts` под именем `mapToAdminUserView`); добавлен `describe("mapToUser", ...)` для новой pure-mapping функции. Тесты для `mapToAthleteProfile`/`mapToCoachProfile` остаются в `mappers/iam/user.mapper.test.ts` как известный 1.2.E leftover (отдельный буллет 1.2.K зафайлен на их перенос). Общее количество тестов: 222 → 227 (+5 за `mapToUser`).
- [x] **~~`mappers/iam/user.mapper.test.ts` содержит тесты для `mapToAthleteProfile` и `mapToCoachProfile`, которые живут в coaching mappers.~~** Закрыто в commit `0e8f2c5` (1.2.K). Создан `mappers/coaching/athlete-profile.mapper.test.ts` с `describe("mapToAthleteProfile", ...)` и локальным `makeAthleteProfile` helper (9 тестов). Создан `mappers/coaching/coach-profile.mapper.test.ts` с `describe("mapToCoachProfile", ...)` и локальным `makeCoachProfile` helper (3 теста). `mappers/iam/user.mapper.test.ts` стрипнут до чистых iam-only блоков: удалены `mapToAthleteProfile`/`mapToCoachProfile` импорты, `Gender`/`HealthStatus` contract-импорты, `PrismaGender`/`PrismaHealthStatus`/`Decimal` импорты, helpers `makeAthleteProfile`/`makeCoachProfile`, describes для этих двух функций. Тесты `mapToUser` и `mapToAdminUserListItem` слегка упрощены: exclusion assertions больше не полагаются на инъекцию profile-объектов (возьмут `null` из `makeUser` defaults), поскольку `PrismaUser` type не имеет profile-relations структурно — assertion `not.toHaveProperty("athleteProfile")` остаётся валидным. Test count стабильно 227 — это чистый move без изменения coverage.
- [x] **~~`packages/api-server/src/mappers/` — 18 mapper-файлов плоским списком.~~** Закрыто в commit 1.2.E. `packages/api-server/src/mappers/` реорганизован в 4 контекстные поддиректории (`cms/`, `lms/`, `coaching/`, `iam/`). `enum-maps.ts` (186 строк, cross-cutting bundle) и `enum-maps.test.ts` (303 строки, 14 describe) расщеплены по контекстам — каждая поддиректория получила свой `enum-maps.ts` + `enum-maps.test.ts` с per-map assertion'ами и локальным symmetry-чеком. Корневой `mappers/index.ts` удалён, добавлены 4 per-context `index.ts` барреля, которые реэкспортируют и mapper-функции, и enum-maps. ~20 consumer-файлов (endpoints + authz + test helpers) обновлены на новые `../mappers/<context>` пути. 4 coaching endpoint'а (coach-dashboard, coach-action-item, coach-athletes/list+detail) получили dual-context импорты (coaching + lms), так как агрегируют cross-context данные. Mapper-level проявления существующих schema-leak'ов (98, 99) задокументированы в этих буллетах и явно оставлены как cross-context импорты — закроются вместе с schema-leak'ами. В процессе выделены `coaching/athlete-profile.mapper.ts` и `coaching/coach-profile.mapper.ts` из `iam/user.mapper.ts` (они относятся к coaching domain'у). Общее количество тестов: 219 → 222 (+3 за per-context symmetry).
- [x] **~~api-server public API symbols не соответствуют новой раскладке контекстов.~~** Закрыто в commit 1.2.F. Все 26 экспортируемых symbol'ов api-server переименованы из старой consumer-group конвенции (`admin*`/`marketing*`/`platform*`) в domain-first `<context><Entity><Role?>Api`: `adminBlogApi` → `cmsBlogAdminApi`, `marketingProductsApi` → `cmsProductPublicApi`, `platformTrainingPlansApi` → `lmsTrainingPlanApi`, `platformCoachDashboardApi` → `coachingCoachDashboardApi`, `authService` → `iamAuthService`, и т.д. Тронуто 93 файла: 56 consumer-файлов (те же, что в 1.2.D), 26 api-server endpoint-файлов, 5 test-файлов, 6 doc-файлов (BOUNDED-CONTEXTS, BIGTECH-AUDIT §1.4 + §3, ADR 0004/0005/0010/0011). Singular/plural следует имени entity-folder (cms/pages/ — plural, coaching/coach-athletes/ — plural, остальное singular). `coach-` префикс в coaching-символах сохранён — он различает coach-side entities от athlete-side внутри одного контекста. Даёт dep-cruiser (1.3.A) однозначные context-prefixed символы для policy rules.
- [x] **~~`cms/pages/public.ts` читает `prisma.marketingBlogPost` напрямую вместо делегирования блог-API.~~** Закрыто в commit `d04f246` (1.2.G). Создан `packages/api-server/src/endpoints/cms/blog/public.ts` с `cmsBlogPublicApi`, экспортирующим `listPublished()` (возвращает `PublicBlogPost[]` — опубликованные посты, отсортированные по `publishedAt desc`, с `isPublishedPost` фильтром) и `getArticle(slug)` (возвращает `BlogPostPageData` с постом, related posts и labels/related section title, вычитанными из `marketingPageSection`). `cmsPagesPublicApi.getBlogPage` теперь делегирует вычитку постов в `cmsBlogPublicApi.listPublished()`, секции читает сам. `cmsPagesPublicApi.getBlogArticle` удалён; marketing route handler `apps/marketing/src/app/api/public/blog/[articleSlug]/route.ts` переключён на `cmsBlogPublicApi.getArticle`. `endpoints/cms/index.ts` барель дополнен `export * from "./blog/public"`. Теперь CMS blog имеет admin+public endpoint-файлы рядом, что выравнивает его с остальными CMS-сущностями (product, review, contact, pages). **Новая находка из 1.2.G (см. 1.2.H):** marketing client-side API остался в inconsistent shape — `api.pages.getBlogArticle(slug)` хитит `/api/public/blog/${slug}` и возвращает `BlogPostPageData`, хотя это уже blog domain, а не pages. Серверная сторона выровнена, клиентская ждёт отдельного буллета.
- [x] **~~Marketing client API зеркало 1.2.G не выровнено.~~** Закрыто в commit `177edcf` (1.2.H). Создан `apps/marketing/src/lib/api/endpoints/blog.ts` с `createBlogAPI` factory и единственным методом `getArticle(slug): Promise<BlogPostPageData>`, хитящим `/api/public/blog/${slug}`. `getBlogArticle` и `BlogPostPageData`-импорт удалены из `apps/marketing/src/lib/api/endpoints/pages.ts`. `endpoints/index.ts` добавил `export { createBlogAPI } from "./blog"`, файл пересортирован по алфавиту. `apps/marketing/src/lib/api/factory.ts` регистрирует `blog: endpoints.createBlogAPI(client)` в root api composer (порядок ключей — алфавитный: blog/contact/pages). Консьюмеры: `apps/marketing/src/lib/hooks/use-blog.ts` переключён с `api.pages.getBlogArticle` на `api.blog.getArticle`; `apps/marketing/src/app/blog/[slug]/page.tsx` — с `serverApi.pages.getBlogArticle` на `serverApi.blog.getArticle`. `api.pages.getBlog()` (блог-лист, `BlogPageData`) остался в pages — это page-level endpoint, не article. Теперь marketing client API выровнен с серверной доменной раскладкой: admin+public blog endpoint'ы на сервере, `blog.getArticle` на клиенте.

### 1.3. Dependency direction и граф пакетов

- [x] **Циклы между пакетами отсутствуют.** Проверено двумя способами: (1) ручной анализ 13 `package.json` — DAG, циклов нет; (2) `madge` на уровне файлов внутри пакетов — 730 файлов обработано, 0 циклов.
- [x] **~~Нет `madge`, нет `dependency-cruiser` в `devDependencies` корневого `package.json`.~~** Закрыто в commit `c7631a7` (1.3.A). Добавлен `dependency-cruiser@^16.10.0` в root `devDependencies`. Новый скрипт `pnpm dep:check` = `depcruise --config .dependency-cruiser.cjs --no-progress --output-type err packages apps`. Lefthook получил pre-push секцию с этим же скриптом (не pre-commit — прогон занимает ~4с на 785 модулей, и pre-commit уже имеет 4 параллельных хука).
- [x] **~~Нет CI-gate на циклы.~~** Закрыто в два шага: local gate через lefthook pre-push в commit `c7631a7` (1.3.A); prod-side enforcement через GitHub Actions в commit `1303ec4` (1.3.B) — `.github/workflows/ci.yml` с 5 параллельными джобами (check-types, lint, dep-check, test, build). Test lane использует postgres:16-alpine service container + `prisma db push --skip-generate --accept-data-loss` для чистой схемы каждый прогон (не шарит state с local Neon dev instance, устраняет flaky-тесты из-за cold start'ов). Build lane использует dummy env vars + `SKIP_ENV_VALIDATION=1` поскольку Next.js pages в репо все `export const dynamic = "force-dynamic"` — build не требует реальной DB. Concurrency-группа отменяет in-flight run'ы для того же ref при новом пуше. pnpm 10.32.1 + Node 20 (матчит `engines.node` и `packageManager` в root package.json). Trigger: PR против любой ветки + push в main.
- [x] **~~`.dependency-cruiser.cjs` с boundary rules.~~** Закрыто в commit `c7631a7` (1.3.A). Создан `/.dependency-cruiser.cjs` с 17 forbidden-правилами, severity `error`, энкодящими BOUNDED-CONTEXTS.md §8 на уровне файловых импортов: (1) `no-circular`; (2) `contracts-no-prisma`; (3) `contracts-iam-is-leaf`; (4) `contracts-lms-no-coaching`; (5) `contracts-cms-no-lms-coaching-billing`; (6) `contracts-billing-no-cms-coaching`; (7) `api-server-iam-is-leaf` (scope: `(endpoints|mappers)/iam/` — `authz/` намеренно вне scope, так как это cross-cutting policy); (8) `api-server-lms-no-coaching` (закрывает утечку 1.2.I на уровне CI); (9) `api-server-cms-no-lms-coaching`; (10) `prisma-only-in-api-server`; (11) `ui-no-backend` (`@repo/ui` не трогает api-server или prisma); (12) `api-routes-no-api-server` (generic wrapper layer); (13) `shared-packages-no-prisma` (shared/mui/query/auth/errors/env/api-client чисты от prisma); (14) `marketing-only-cms-backend`; (15) `admin-no-lms`; (16) `admin-coaching-only-via-user-detail-route` — file-precise carve-out через `from.pathNot: ^apps/admin/src/app/api/admin/users/\[id\]/route\.ts$`, админ может импортить `@repo/api-server/coaching` только из этого одного файла (админ-user-view route из 1.2.J); (17) `platform-no-cms-billing`. Options: `enhancedResolveOptions.exportsFields: ["exports"]` для корректного резолва субпаттерных экспортов (`@repo/api-server/cms` → `packages/api-server/src/endpoints/cms/index.ts`), `exclude` + `doNotFollow` с `storybook-static|node_modules|dist|.next|.turbo` (storybook build output содержит naturally circular bundled JS — это не source-code циклы). Без tsConfig — у репо нет root `tsconfig.json`, а boundary rules работают на raw file paths, alias resolution для `@app/*` не нужна. Первый прогон — **0 violations на 785 модулях / 1409 dependencies** (section 1.2 работа действительно holds на file-import уровне). Positive-path проверка: админ → coaching из `dashboard/route.ts` → ошибка `admin-coaching-only-via-user-detail-route` ✓; platform → cms из `use-plan-enrollments.ts` → ошибка `platform-no-cms-billing` ✓. Lefthook pre-push prometer: 4.2 секунды end-to-end.
- [x] **~~Граф не задокументирован.~~** Закрыто в commit `5c76b46` (1.3.C). Создан `docs/DEPENDENCY-GRAPH.md` — mermaid flowchart, сколлапсированный до уровня `packages/<name>` и `apps/<name>` (регекс `^(packages|apps)/[^/]+`), ~16 нод вместо 785 модульной стены. GitHub-native рендеринг mermaid блоков, никаких graphviz-зависимостей, diff-friendly. Регенерируется через `pnpm dep:graph` → `scripts/dep-graph.mjs` helper, который вызывает `depcruise --output-type mermaid --collapse ...` и оборачивает вывод в markdown-template со ссылками на `BOUNDED-CONTEXTS.md §8` и `BIGTECH-AUDIT.md §1.3`. Артефакт коммитится — stable diffs показывают в PR если меняется структура зависимостей. Первая генерация: 16 нод, ~60 рёбер, никаких циклов или неожиданных edges. Для полного file-level view в `docs/DEPENDENCY-GRAPH.md` упомянута fallback-команда через graphviz dot — но она опциональна и не интегрирована.

### 1.4. Dependency inversion (ports & adapters)

- [x] **~~`@vercel/blob` напрямую импортируется в `packages/api-server/src/endpoints/iam/upload.ts`.~~** Закрыто в commit `6f9ca98` (1.4.A). Введён `StoragePort` в новом cross-cutting модуле `packages/api-server/src/infrastructure/storage/` — `port.ts` определяет интерфейс (`put(key, file, options?) → { url }` + `delete(url)`), `vercel-blob-adapter.ts` — единственный файл во всём api-server, который импортирует `@vercel/blob`, `index.ts` экспортирует `defaultStorage = createVercelBlobAdapter()` как module-level singleton. `endpoints/iam/upload.ts` переписан как pure factory `createIamUploadAdminApi(storage: StoragePort)`; дефолтный инстанс `iamUploadAdminApi` создаётся в барреле `endpoints/iam/index.ts` с инъекцией `defaultStorage` — consumer `apps/admin/src/app/api/admin/upload/image/route.ts` не меняется вообще. **Wake-up мёртвого кода:** `createVercelBlobAdapter()` делает `void blobEnv.BLOB_READ_WRITE_TOKEN` на construction, что триггерит `@t3-oss/env-nextjs` валидацию — до этого коммита `@repo/env/blob` был exported-but-never-imported. Теперь отсутствие токена валится при boot, а не при первой попытке upload. **Первые тесты на upload** (`endpoints/iam/upload.test.ts`, 9 test cases): happy path, filename sanitization, per-context storage prefix (parameterized для avatar/blog/marketing), invalid file type, oversize file, delete happy path, delete empty URL. **Первое использование `vi.fn()` в api-server suite** — до этого коммита все тесты хитали реальный Postgres; factory+fake-DI pattern устанавливает конвенцию для будущих портов (email, payments, queue, cache в 1.4.C). `dep:check` ничего не ломает — `infrastructure/` вне scope всех context-scoped rules (которые анкорят `from.path` на `(endpoints|mappers)/<ctx>/`). Baseline 227 → ~234 tests. **Supporting context move (upload → storage/)** отложен в новый bullet 1.4.D, потому что это другой концептуальный change (split contracts + subpath exports + rename + consumer updates) и не должен бандлиться с dependency inversion.
- [ ] **`centsToAmount` живёт в `@repo/shared`** — **deferred to §2 Money value object.** `centsToAmount` / `amountToCents` / `CENTS_PER_UNIT` (сейчас в `packages/shared/src/helpers/money.ts`) — это симптом отсутствующего `Money` value object, а не самостоятельная проблема размещения helper'ов. Standalone-move в `@repo/contracts/common/money` разместил бы behavior в API-boundary слое (ADR 0005 определяет contracts как schemas + types, не behavior) и всё равно перенёс бы их второй раз, когда §2 создаст VO. Double work, zero M7 review credit. Правильный фикс — создать `Money` value object в §2 и разместить конвертеры рядом с ним как конструкторы/аксессоры. **Не запускать как standalone bullet** — §2 Money VO bullet владеет этим scope целиком. Попытка выполнить 1.4.B как standalone-move landed в `4e5fbe8` и была reverted в следующей сессии после того, как обоснование размещения ("pragmatic interim home until §2 lands") само превратилось в STOP-сигнал по `feedback_no_compromises_audit_standard.md`.
- [x] **~~Нет портов под будущие интеграции~~** — email / payments / queue / cache. Закрыто в commit `1779400` (1.4.C). 4 новых порта отскаффолжены в `packages/api-server/src/infrastructure/` по шаблону 1.4.A (storage): `port.ts` (committed interface, zero vendor SDK imports) + `index.ts` (type re-exports only — без default singleton, адаптера пока нет) + `README.md` (purpose, shape, vendor candidates, open questions, adapter placement plan, non-goals). Каждый порт коммиттится только к тому shape'у, который безопасно стабилен через всех serious вендоров: `EmailPort.send(input)` (Resend/Postmark/SES/Mailgun/Sendgrid — largest common denominator); `CachePort.get<T>/set<T>/delete` с optional `ttlSeconds` (Upstash/Vercel KV/Redis/in-memory — универсальный K/V shape); `QueuePort.enqueue<T>(name, payload, delayMs?)` — **только producer side**, consumer registration (worker lifecycle, retry policy, idempotency, cancellation) явно deferred до выбора вендора, потому что Inngest / QStash / BullMQ / SQS / Cloudflare Queues расходятся в модели consumer'а достаточно, чтобы committing now был vendor speculation; `PaymentPort.createCheckout(...) + verifyWebhook(...)` — **только те две операции**, которые Stripe / Lemon Squeezy / Paddle / Polar поддерживают идентично (hosted checkout URL + HMAC webhook verification). Subscriptions, invoices, refunds, disputes, customer portals — deferred в отдельные узкие порты (`SubscriptionPort` и т.д.), когда появится первый consumer. Также создан top-level `infrastructure/README.md` — документирует convention (структура port dir, dep rules, правила добавления новых портов), active ports table, non-goals слоя. Никаких адаптеров, никаких тестов, никаких consumer wiring — pure scaffolding. Dep-cruiser без изменений: `infrastructure/` вне scope всех context-scoped rules (они анкорят `from.path` на `(endpoints|mappers)/<ctx>/`). Module count 789 → 797 (+8 = 4 ports × {port.ts, index.ts}; README.md не модули). Deps count unchanged at 1415 — ничего пока не импортит новые порты. Commit message обязывает будущие adapter-коммиты следовать паттерну `endpoints/iam/upload.ts` факторного DI (createXxxAdminApi(deps) + defaultXxx в barrel) из 1.4.A.
- [x] **~~Move upload endpoint + contracts out of IAM into new Storage supporting context.~~** Закрыто в commit `f4e4655` (1.4.D). Upload физически переехал из `endpoints/iam/upload.ts` + `contracts/iam/upload/` в дедицированный Storage supporting context. **Contracts:** `contracts/iam/upload/` → `contracts/storage/upload/` (5 файлов, git распознал как 100% renames), subpath export `@repo/contracts/storage/upload` (старый `@repo/contracts/iam/upload` удалён), `contracts/src/index.ts` root barrel переструктурирован — упоминание upload вынесено из IAM секции в новую "Storage (supporting)" секцию. **api-server:** `endpoints/iam/upload.{ts,test.ts}` → `endpoints/storage/upload.{ts,test.ts}` (git: 87% / 89% rename после symbol renames), новый `endpoints/storage/index.ts` barrel — строит `storageUploadAdminApi = createStorageUploadAdminApi(defaultStorage)` по тому же factory-DI паттерну, что и 1.4.A storage port. **Symbol renames:** `IamUploadAdminApi` → `StorageUploadAdminApi`, `createIamUploadAdminApi` → `createStorageUploadAdminApi`, `iamUploadAdminApi` → `storageUploadAdminApi`. **Subpath export:** новая запись `"./storage": "./src/endpoints/storage/index.ts"` в `packages/api-server/package.json`. `endpoints/iam/index.ts` очищен от upload re-exports — iam теперь экспортирует только auth-service + users-admin + users-search (pure identity). **Consumers (5 admin файлов):** `app/api/admin/upload/image/route.ts` (import path + symbol rename), `lib/api/endpoints/upload.ts` (contract import), `lib/hooks/use-upload.ts` (contract import), `modules/blog/components/blog-post-form.tsx` (contract import), `modules/reviews/components/review-form.tsx` (contract import). Никаких platform / marketing consumers — upload сейчас только admin. **Dep-cruiser:** 2 новых forbidden rules. **`contracts-storage-is-leaf`** — `contracts/src/entities/storage/` не может импортить из `(cms|lms|coaching|iam|billing)/`. **`api-server-storage-is-leaf`** — `endpoints/mappers of storage` не могут импортить из `(cms|lms|coaching|iam|billing)/`. Направление всегда domain → Storage, никогда наоборот. Правила применяют M7 invariant: Storage — supporting context, leaf в зависимостях со своей стороны, но любой domain контекст может в него reach'аться. Первый прогон: 0 violations на 798 модулях. **Docs:** `BOUNDED-CONTEXTS.md` §1 IAM переименован из "Identity, Access, and Media" в "Identity and Access" (media выехало), upload bolt-on параграф удалён, все упоминания upload в полях Contracts/API/Target state очищены. Новый §6 "Storage — supporting context" написан полностью — responsibility, почему он существует отдельно, что owns, dependencies (none inbound from domain contexts), invariants (vendor isolation, upload config contract-level, closed `UploadContext` union), where it lives, target state. §7–§12 ренумерованы (старые §6 Shared entities → §7, §7 Cross-context invariants → §8, §8 Dep rules → §9, §9 De-facto non-leak → §10, §10 Open questions → §11, §11 How to use → §12). 3 cross-ref'а к старому §6 Shared entities обновлены → §7. Cross-refs §8 → §9 и §7 → §8 обновлены. §9 Dep rules — добавлена строка `Storage → (leaf supporting context)` в direction graph + явный forbidden `Storage → any domain`. **ADR 0013** (Vercel Blob) обновлён: все пути переписаны на `endpoints/storage/upload.ts` + `infrastructure/storage/` + `contracts/storage/upload/`, symbol имена переименованы. Status ADR остался "Accepted (interim)" потому что "interim" там ссылается на выбор вендора (Vercel Blob vs S3/R2/GCS), не на архитектурное размещение. **Infrastructure README файлы** (от 1.4.C) обновлены: исторические ссылки на `endpoints/iam/upload.ts` / `createIamUploadAdminApi` / `endpoints/iam/index.ts` переписаны на `endpoints/storage/upload.ts` / `createStorageUploadAdminApi` / `endpoints/storage/index.ts`. `dep:graph` регенерирован — но `docs/DEPENDENCY-GRAPH.md` байт-идентичен предыдущему: package-level collapse (`^(packages|apps)/[^/]+`) не отражает внутреннее реорганизацию внутри `packages/api-server` и `packages/contracts`. Module count 797 → 798 (+1 от нового `endpoints/storage/index.ts` barrel; все остальные изменения — renames с unchanged module count). Deps count unchanged at 1415. Tests unchanged at 236 — `upload.test.ts` pure rename + symbol-level rename, runtime behavior byte-identical. Gates all green first run: check-types 15/15, lint 15/15, test 236/236, dep:check 798 modules 0 violations. Paдел §1.4 теперь полностью закрыт (A + C + D reality, B deferred to §2).
- [ ] **Хороший пример уже есть:** `packages/auth/src/auth-options.ts:20 AuthServiceAdapter` — это настоящий port (`validateUser`, `getUserById` инжектятся извне, пакет не знает про Prisma). Использовать как reference при проектировании остальных портов.

### 1.5. Failure domains и deploy

- [x] **~~Deploy config не версионируется.~~** `vercel.json` добавлен в каждый app (admin/marketing/platform) с security headers. Частичное закрытие — `vercel.json` версионирует headers; полная deploy config документация в 1.5.C.
- [x] **~~`/api/auth/[...nextauth]/route.ts` физически дублируется.~~** Закрыто ADR 0011 — документирует дублирование как intentional tech debt с обоснованием (separate deploy topology, different auth wrappers, blast radius isolation).
- [x] **~~Нет `/api/health`, `/api/ready`, `/api/version` endpoints ни в одном app.~~** Добавлены во все 3 app'а. Handler factories в `@repo/api-routes` (`createHealthHandler`, `createReadyHandler`, `createVersionHandler`). Readiness probe через `checkDatabase` из `@repo/api-server/ops` (`SELECT 1`). Version отдаёт `VERCEL_GIT_COMMIT_SHA` (auto-injected by Vercel). `turbo.json` `globalEnv` расширен на `VERCEL_GIT_COMMIT_SHA`.
- [ ] **Нет `/api/webhooks/*` вообще.** Когда появится Stripe/Resend — некуда принимать callbacks, инфраструктуры для подписи webhook'а и идемпотентности тоже нет (хотя `Transaction.providerTxId @unique` уже заложен как инвариант).
- [x] **~~Нет документации, как три app'а (admin/marketing/platform) запущены в prod.~~** Закрыто `docs/DEPLOY.md`: deployment topology, failure domain matrix, health endpoints, env inventory, rollback procedure, security headers.
- [x] **~~Security headers отсутствуют.~~** Добавлены в `vercel.json` каждого app: HSTS, X-Content-Type-Options, X-Frame-Options (DENY), Referrer-Policy, X-XSS-Protection (0, superseded by CSP), Permissions-Policy, CSP (baseline с `'unsafe-inline'` для Next.js hydration scripts; strict nonce-based CSP — отдельная задача §10).
- [x] **~~`apps/marketing/next.config.ts` разрешает fragile external domains.~~** Удалён мёртвый `scontent-iev1-1.cdninstagram.com` (не используется ни в коде, ни в seed data). `images.unsplash.com` оставлен — seed data ссылается на Unsplash для dev-режима.
- [x] **~~`apps/platform/next.config.ts` пустой.~~** Добавлен `remotePatterns` для `*.public.blob.vercel-storage.com` — паритет с admin/marketing.
- [x] **~~`apps/admin` не имеет middleware/proxy для protection.~~** Добавлен `apps/admin/src/proxy.ts` с server-side ADMIN role check. Proxy проверяет JWT `role === ADMIN` до отдачи HTML. Non-admin authenticated users редиректятся на login. API routes исключены из matcher (собственная auth + health endpoints).
- [x] **~~`apps/platform/src/proxy.ts` не проверяет роль.~~** Добавлен role-based enforcement: USER → `/athlete/*`, COACH → `/coach/*`. Попытка зайти в чужую секцию — redirect на свой home. ADMIN/unknown role → redirect на login. API routes исключены из matcher.
- [ ] **`apps/marketing/src/modules/home/index.tsx` (и все остальные marketing modules) — client components**, но `useState/useEffect` в marketing используется **только в 2 файлах** (`use-product-modal.ts`, `header/drawer.tsx`). Значит все marketing pages — **false client components**, их можно (и нужно) перевести в server components + ISR.

### 1.6. Monorepo hygiene (локальные проблемы package.json, относящиеся к архитектуре)

_(Эти пункты частично пересекаются с секцией 8 «Monorepo дисциплина», но они влияют на корректность bounded-context enforcement, поэтому их закрытие — часть работы пункта 1.)_

- [x] **~~`@repo/auth`: `next-auth` одновременно в `dependencies` и `peerDependencies`.~~** Убран из `dependencies`, оставлен только в `peerDependencies`. Consumer apps (admin, platform) уже имеют `next-auth` в собственных `dependencies`.
- [x] **~~`@repo/ui`: `exports: { "./*": "./src/*.tsx" }` — wildcard экспорт.~~** Убран wildcard, оставлен только `"."` → `./src/index.ts`. Ноль consumer'ов использовали subpath — все импортируют через root barrel.
- [x] **~~`@repo/api-client` не имеет `@repo/contracts` в `dependencies`.~~** Добавлен `@repo/contracts` в `dependencies`. Клиентский код пока не использует contracts напрямую (`request<T>` с raw generic), но зависимость объявлена — граф честный. Runtime response validation — scope §6.
- [x] **~~`@repo/api-client`: `peerDependencies.next: "*"` без версии.~~** Заменён на `catalog:` (resolves to `16.1.1`).
- [x] **~~`@repo/query`: `sonner` одновременно в `devDependencies` и `peerDependencies`.~~** Убран из `devDependencies`, оставлен в `peerDependencies`.
- [x] **~~`@repo/env` версия `0.0.0` против `0.1.0` у остальных пакетов.~~** Поднята до `0.1.0`.

---

## 2. Доменная модель

**Статус: Завершена.** Implementation plan: 2.1.A–2.6.D done (1 deferred). 3 ADRs (0015–0017), 1 anti-pattern, 1 glossary, 1 invariants doc, Money VO, 3 code fixes.

### Implementation plan (section 2)

| №     | Commit hash | Status   | Description                                                                                                                                                                                                                                                                                                        |
| ----- | ----------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2.1.A | `885a09e`   | ✅ Done  | Add domain invariants section to `BOUNDED-CONTEXTS.md` documenting all `@@unique` / business rules with their enforcement location. 14 DB-enforced invariants + 4 application-level invariants.                                                                                                                    |
| 2.2.A | `4462849`   | ✅ Done  | Ubiquitous language: add glossary section (§12) to `BOUNDED-CONTEXTS.md`. 17 domain terms with context ownership, definitions, and "not to be confused with" column. Explicitly bans "Program" as a code term.                                                                                                     |
| 2.3.A | `5eb2cee`   | ✅ Done  | Money value object: `moneySchema` + `Money` type in `@repo/contracts/common/money`. `common.ts` → `common/` directory with `params.ts` + `money.ts`. Closes deferred 1.4.B.                                                                                                                                        |
| 2.3.B | `2aebba7`   | ✅ Done  | Fix: move utility functions (`centsToAmount`, `amountToCents`, `formatPrice`, `CENTS_PER_UNIT`) back to `@repo/shared` — behavior doesn't belong in contracts (ADR 0005). Inlined locale was a hack signaling wrong placement. Added anti-pattern to CLAUDE.md. Scanned contracts for similar issues — none found. |
| 2.4.A | —           | Deferred | Domain primitives: no concrete consumers exist. No server-side pagination, no API-level sort/filter. Primitives will be created alongside first real consumer. Speculative infrastructure violates 1.4.C rule.                                                                                                     |
| 2.5.A | `edb1f47`   | ✅ Done  | Extract magic number: `0.7` → `ADHERENCE_ON_TRACK_THRESHOLD` in `coach-dashboard.constants.ts`, imported in `dashboard-computations.ts`. Joins existing `ADHERENCE_IMPROVING_THRESHOLD`, `MISSED_DAYS_WARNING`, etc.                                                                                               |
| 2.5.B | `fd3e9c2`   | ✅ Done  | Remove UI URLs from domain logic: removed `href` from `dashboardActionItemSchema` + `progressAthleteSchema` contracts and both api-server endpoints. UI consumers (`action-items-section`, `progress-buckets-section`) now construct URL from `athleteId`/`userId`.                                                |
| 2.5.C | `cdfa020`   | ✅ Done  | Remove UI transformation from domain layer: `programOptionSchema` fields renamed `value/label` → `slug/title` (domain-native). Server returns raw product data, UI maps to MenuItem props.                                                                                                                         |
| 2.6.A | `87f5596`   | ✅ Done  | ADR 0015: archived inconsistency is intentional. Plan has lifecycle (enum), workout has visibility toggle (boolean). Different domain semantics, different mechanisms.                                                                                                                                             |
| 2.6.B | `87f5596`   | ✅ Done  | ADR 0016: workout content as plain text is intentional interim. Structured workouts (blocks/sets/exercises) deferred to Phase 3+. Migration path documented.                                                                                                                                                       |
| 2.6.C | `87f5596`   | ✅ Done  | ADR 0017: anemic domain model acceptable pre-product. Documents 4 extraction triggers for future service layer.                                                                                                                                                                                                    |
| 2.6.D | `87f5596`   | ✅ Done  | HTTP loopback already documented in ADR 0010. No new ADR needed — existing one covers trade-offs, alternatives, and review status.                                                                                                                                                                                 |

DDD lens. Без правильной модели всё, что на ней построено — кривое. Это второй слой фундамента после архитектурных границ.

- [ ] **Aggregates и инварианты.** «Singleton Subscription: 1 User = 1 Subscription» — это инвариант агрегата. Вопрос: где он гарантирован? В schema уникальным индексом? В domain layer? В route handler? Если в трёх местах — три разные истины. Big Tech ожидает: инвариант живёт в одном месте, ближайшем к данным.
- [x] **Singleton Subscription ЕСТЬ на уровне БД:** `Subscription.userId String @unique` (`schema.prisma:180`). Это правильное место. Теперь нужно задокументировать этот инвариант и убедиться, что он отражён в domain layer.
- [x] **«Money is Integer» ЕСТЬ на уровне БД:** `Transaction.amountCents Int` + `Currency Currency` enum (`schema.prisma:205-206`). Тоже `Price.amountCents Int`. Правильное место.
- [x] **Инвариант «один WorkoutLog на пару user+workout»:** `@@unique([userId, workoutId])` (`schema.prisma:288`). Правильно на БД.
- [x] **Инвариант «один PlanEnrollment на пару plan+user»:** `@@unique([trainingPlanId, userId])` (`schema.prisma:390`). Правильно на БД.
- [x] **~~Эти инварианты нигде не документированы как список.~~** Добавлены две таблицы в `BOUNDED-CONTEXTS.md` §8: 14 DB-enforced invariants (все `@@unique`/`@unique` constraints) + 4 application-level invariants с описанием risk.
- [x] **~~Ubiquitous language.~~** Добавлен glossary в `BOUNDED-CONTEXTS.md` §12: 17 терминов с контекстом, определением, и "не путать с". `Program` явно забанен как code term — использовать Product (billing) или TrainingPlan (LMS).
- [x] **~~Дублирование понятия «archived».~~** ADR 0015: intentional. Plan имеет lifecycle (enum state machine), workout — visibility toggle (boolean). Разная доменная семантика → разные механизмы.
- [x] **~~Value Objects: Money.~~** Создан `@repo/contracts/common/money` с `moneySchema`, `Money` type, `CENTS_PER_UNIT`, `centsToAmount`, `amountToCents`, `formatPrice`. Перенесено из `@repo/shared`. 6 consumer'ов обновлены. Закрывает deferred 1.4.B. Остальные VO (Email, Cuid, Slug, DurationSeconds) — по мере необходимости, не speculative.
- [ ] **`BenchmarkDefinition.unit String`** (`schema.prisma:401`) — свободная строка вместо enum. "kg" / "lb" / "seconds" / "%" / "count" — что угодно. Слабая типизация в самом domain-core.
- [ ] **`BenchmarkDefinition.category String?`** (`schema.prisma:402`) — тоже string, не enum.
- [ ] **`CoachActionItem.metadata Json?`** (`schema.prisma:335`) — untyped JSON без схемы. В domain layer metadata должна иметь discriminated union по ActionItemType.
- [ ] **`MarketingPageSection.data Json` + `section String`** (`schema.prisma:444-445`) — весь контент CMS-секций лежит как untyped JSON, тип секции как строка. Нет domain types вообще.
- [ ] **Общих domain-примитивов практически нет.** `packages/contracts/src/common.ts` содержит только 2 schema: `idParamSchema`, `planIdParamSchema`. Нет `Money`, `Email`, `Cuid`, `Slug`, `Pagination`, `SortOrder`, `DateRange`, `TimeZone`, `ListRequest<T>`. Каждая из 21 entities изобретает Zod schemas с нуля.
- [ ] **`AthleteProfile.weightKg Decimal`, `heightCm Int`** — несогласованные типы measurements. Decimal в Prisma может возвращаться как string в некоторых версиях.
- [ ] **`Gender enum: MALE, FEMALE`** (только 2 значения). Для современного coaching platform в 2026 часто добавляют `OTHER / PREFER_NOT_TO_SAY / NON_BINARY`. Это domain decision, не техническая мелочь.
- [x] **~~Anemic vs rich domain.~~** ADR 0017: acceptable pre-product. 4 extraction trigger'а задокументированы (shared logic, file size, cross-aggregate txn, non-HTTP consumer).
- [ ] **`packages/api-server/src/endpoints/platform/training-plans.ts` — ровно 300 строк, на пределе ESLint `max-lines`**. На след. добавлении придётся или splitt'ить (хорошо), или отключать правило (плохо).
- [ ] **CQRS-lite (команды vs запросы).** Read-models могут иметь другую форму, чем write-models. Сейчас одно и то же. `trainingPlanListItemSchema` добавляет `enrolledAthletesCount`, `workoutsToday`, `workoutsThisWeek` поверх `trainingPlanSchema` — это уже зачаток read-model, но сделанный ad-hoc.
- [x] **~~`Workout.content` plain text.~~** ADR 0016: intentional interim. Structured workouts (WorkoutBlock/Set/Exercise) — Phase 3+. Migration path clean (new models + legacy fallback).
- [x] **~~HTTP loopback для RSC.~~** Уже задокументирован в ADR 0010. Trade-offs, альтернативы и review status покрыты.
- [ ] **Inconsistent транзакции.** Только 5 из ~18 endpoint-файлов используют `prisma.$transaction` (`admin/blog`, `admin/products`, `platform/training-plans`, `platform/workouts`, `platform/coach-action-items`). Остальные multi-write (coach-notes, plan-enrollments, user-benchmarks) делают sequential mutations без atomicity. `toggleExclusiveFeatured` в `utils/` **не использует транзакцию** (`find → unfeatureOthers → update`) — race condition на featured state.
- [ ] **Marketing endpoints используют `extractSectionData` с throw `NotFoundError` при отсутствии секции** (`marketing/pages.ts:29`). Если admin забыл создать section в CMS — public page crash'ит 404. Должен быть fallback.
- [x] **~~Domain logic возвращает UI URLs.~~** `href` убран из `dashboardActionItemSchema` и `progressAthleteSchema`. Сервер возвращает `athleteId`/`userId`, UI строит URL.
- [x] **~~Magic numbers в `dashboard-computations.ts`.~~** `0.7` вынесен как `ADHERENCE_ON_TRACK_THRESHOLD` в `coach-dashboard.constants.ts` рядом с `ADHERENCE_IMPROVING_THRESHOLD`.
- [x] **~~`marketing/pages.ts:getContactPage` UI transformation.~~** `programOptionSchema` переименован `value/label` → `slug/title`. Сервер отдаёт domain-native поля, UI маппит в MenuItem props.

---

## 3. Безопасность

**Статус:** Research done, implementation pending

### Implementation plan (section 3)

| №     | Commit hash | Status  | Description                                                                                                                                                                                                                                              |
| ----- | ----------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1.A | `6c385f3`   | ✅ Done | Timing attack fix: dummy bcrypt compare on nonexistent user in `auth-service.ts`. Add `DUMMY_BCRYPT_HASH` constant, call `bcrypt.compare` against it when user not found to equalize latency.                                                            |
| 3.1.B | `c89de4b`   | ✅ Done | Email normalization: `.toLowerCase().trim()` in `validateUser` before DB lookup. No registration flow exists beyond seed (all lowercase already).                                                                                                        |
| 3.1.C | `2b63d13`   | ✅ Done | Password policy: `MIN_PASSWORD_LENGTH` → 12, add `MAX_PASSWORD_LENGTH = 128` in `AUTH_CONSTANTS`. Updated `loginFormSchema` with `.max()`, `auth-service.ts` rejects oversized passwords before bcrypt. Seed password updated to 13 chars.               |
| 3.1.D | `c9fd75a`   | ✅ Done | Bcrypt cost unification: add `BCRYPT_COST_FACTOR = 12` to `AUTH_CONSTANTS`. Used in `auth-service.ts` and `seed.ts`. Dummy hash regenerated with cost 12 for timing parity.                                                                              |
| 3.2.A | `d14630d`   | ✅ Done | Env secret validation: `NEXTAUTH_SECRET` → `.min(32)`, `BLOB_READ_WRITE_TOKEN` → `.min(32)`. `DATABASE_URL` → `.refine(url => url.startsWith("postgres"))`.                                                                                              |
| 3.2.B | `ff82128`   | ✅ Done | Seed prod guard: `NODE_ENV === "production"` throws at top of `main()`. Plaintext credentials removed from console output.                                                                                                                               |
| 3.3.A | `77c6d48`   | ✅ Done | Image URL validation: `imageUrlSchema = z.string().url().nullable()` in `contracts/common/image.ts`. Replaced 8 nullable + 1 non-nullable `image` fields across 6 schema files. `z.url()` top-level not available in Zod 3.25 — used `z.string().url()`. |
| 3.3.B | `4a66a93`   | ✅ Done | Timezone validation: `timezoneSchema` with `Intl.supportedValuesOf("timeZone")` refine in `contracts/common/timezone.ts`. Replaced bare `z.string()` in user schema.                                                                                     |
| 3.3.C | `da7cd7b`   | ✅ Done | Upload filename collision: `Date.now()` → `crypto.randomUUID()` in `storage/upload.ts`. Updated 5 test assertions from `\d+` to uuid pattern.                                                                                                            |
| 3.4.A | `7499824`   | ✅ Done | StructuredData XSS fix: `.replaceAll("</", "<\\/")` on `JSON.stringify` output before `dangerouslySetInnerHTML`. Prevents `</script>` injection in ld+json blocks.                                                                                       |
| 3.4.B | `19c04fb`   | ✅ Done | Error log redaction: `redactSensitiveFields()` strips password/token/secret/authorization/cookie/creditcard/ssn from error details before `console.error`. Structured output instead of raw error dump.                                                  |
| 3.5.A | `6ed68ce`   | ✅ Done | ADR 0018: security deferred decisions. Documents 6 design decisions (credentials-only auth, session/revocation, rate limiting, CSP nonce, authz policy layer, PII classification) with concrete triggers for each.                                       |

**Deferred bullets** (no implementation now, documented as known debt):

- AuthZ policy layer (CASL/oso) — design decision, no concrete pain point yet with current guard pattern
- Row-level security strategy — design decision
- `verifyAthleteBelongsToCoach` ACTIVE-only — business decision (escalate when coaching review feature is built)
- Session duration / revocation — design decision (captured in 3.5.A ADR)
- PII classification / encryption-at-rest — compliance scope TBD
- Rate limiting — infra decision (captured in 3.5.A ADR)
- CSP nonce — infra decision (captured in 3.5.A ADR)
- `withAdminAuth` resource-level check — single admin, no ROI
- `resolveCoachId` caching — perf optimization, not security-critical
- MIME magic byte verification — low risk behind CDN + type whitelist
- Contact form captcha — no traffic yet
- Billing-section bullets (idempotency, audit log) — billing not implemented

То, на чём валят code review в больших компаниях. Критично закладывать до того, как появятся реальные пользователи и реальные деньги.

### AuthZ

- [ ] **AuthZ > AuthN.** AuthN есть (NextAuth + wrappers). AuthZ — тоньше. Сейчас есть `verifyAthleteBelongsToCoach()`, но это ручная проверка в каждом хэндлере. Big Tech-подход: policy layer (CASL, oso, opa) — декларативные правила доступа, а не `if`'ы по всему коду.
- [ ] **`withPlatformAuth` не проверяет роль вообще** (`packages/api-routes/src/auth-wrappers.ts:28-37`) — только наличие session. Proxy.ts защищает UI-маршруты (§1.5.E/F), но API endpoints остаются открытыми для любого authenticated user. Забыл вызвать guard в endpoint'е = утечка данных.
- [ ] **`withAdminAuth` проверяет только `role === ADMIN`** — нет проверки «этот admin авторизован для ЭТОГО resource». Один ADMIN может всё. Низкий приоритет при single-admin setup, но архитектурный долг.
- [ ] **AuthZ guards в `packages/api-server/src/authz/guards.ts` делают по 1-2 DB query КАЖДЫЙ перед основной операцией.** Для `updateWorkout(userId, workoutId, data)`: `resolveCoachId` (1 query) + `verifyWorkoutOwnership` (1 query, включая plan join) + сама мутация (1 query) = 3 sequential queries на одно действие. Policy layer с single projection решил бы это одним query.
- [ ] **`resolveCoachId(userId)` не кэшируется** между вызовами одного request'а. Если endpoint делает 3 auth-protected действия — 3 одинаковых DB lookup'а.
- [ ] **Row-level security inconsistency.** Для multi-tenant (coach видит своих athletes) — `getCalendarWeek` использует inline `plan: { coachId }`, другие методы — отдельный `verifyPlanOwnership`. Нет единой стратегии: либо Postgres RLS, либо централизованный query guard.
- [ ] **`verifyAthleteBelongsToCoach` требует `status === ACTIVE`** (`authz/guards.ts:63`). PAUSED / COMPLETED enrollment не даёт coach'у доступ к логам athlete'а — может быть legitimately нужно для coaching review.

### Credentials & session

- [ ] **`iamAuthService.validateUser` — timing attack на user enumeration** (`packages/api-server/src/endpoints/iam/auth-service.ts:30-32`). Если user не существует, `bcrypt.compare` НЕ вызывается → ранний return ~1ms vs ~100-300ms с bcrypt. Атакующий может через timing определить, какие email зарегистрированы.
- [ ] **Email без нормализации** в `validateUser` — `where: { email }` as-is. User зарегистрированный как `FOO@example.com` не сможет войти через `foo@example.com` (Postgres case-sensitive).
- [ ] **`MIN_PASSWORD_LENGTH = 6`** (`packages/contracts/src/entities/iam/auth/auth.constants.ts:2`) — слабо. NIST 800-63B рекомендует ≥ 8, OWASP ≥ 12.
- [ ] **Нет `MAX_PASSWORD_LENGTH`** — DoS на bcrypt через gigabyte password. bcrypt truncates at 72 bytes, но парсинг + хеширование огромной строки = resource exhaustion.
- [ ] **`bcrypt` cost inconsistency** — `auth-service.ts:8` использует cost 10, `seed.ts:1214` использует cost 12. Должно быть единое значение из `AUTH_CONSTANTS`.
- [ ] **`SESSION_MAX_AGE = 30 * 24 * 60 * 60`** — 30 дней JWT без revocation. Утёкший токен валиден месяц. Нет механизма blacklist/revocation — logout удаляет cookie, но сам JWT остаётся валидным.
- [ ] **Только CredentialsProvider** — нет OAuth, нет MFA/2FA, нет magic link. Design decision, но стоит зафиксировать ADR.

### Environment & secrets

- [ ] **`NEXTAUTH_SECRET: z.string().min(1)`** (`packages/env/src/auth.ts:6`) — минимум **1 символ**. Должно быть `.min(32)` для HS256 JWT (256-bit minimum).
- [ ] **`BLOB_READ_WRITE_TOKEN: z.string().min(1)`** (`packages/env/src/blob.ts:6`) — аналогично, слабая валидация API-токена.
- [ ] **`DATABASE_URL: z.string().url()`** (`packages/env/src/base.ts:6`) — любой URL проходит, не обязательно postgres. `.startsWith("postgres")` было бы точнее.
- [ ] **Seed `password123` без prod guard** (`prisma/seed.ts`). `clearAll()` удаляет ВСЕ данные без проверки `NODE_ENV`. Нет `if (NODE_ENV === "production") throw`. Credentials выводятся в console plaintext (строки 1229-1231).

### Input validation

- [ ] **`image: z.string()` без `.url()` validation** — 9 мест в контрактах (`user.schema.ts`, `plan-roster.schema.ts`, `coach-athletes.schema.ts`, `coach-dashboard-api.schema.ts`, `pages.schema.ts`). `"javascript:alert(1)"` проходит Zod и рендерится как `<img src>` или `<a href>` = stored XSS.
- [ ] **`timezone: z.string()`** в `user.schema.ts` — не IANA timezone validation. Любая строка проходит, может сломать scheduling logic.
- [ ] **Upload MIME type — client-trusting** (`packages/api-server/src/endpoints/storage/upload.ts:15`). Проверяет `file.type` из клиентского запроса, нет server-side magic byte verification. Можно отправить EXE с `Content-Type: image/jpeg`.
- [ ] **Upload filename collision** (`storage/upload.ts:31`). `Date.now()` — при двух загрузках в одном ms возможна коллизия. Нужен UUID или crypto.randomBytes.

### Infrastructure

- [ ] **Нет rate limiting нигде.** Ни `rateLimit`, ни `@upstash/ratelimit` в коде. Ни на auth endpoints, ни на public contact form.
- [ ] **Contact form POST без защиты** (`/api/public/contact`) — единственный публичный POST endpoint, полностью открыт для спама. Минимум rate limit, идеально captcha.
- [ ] **CSP `script-src 'unsafe-inline'`** (`apps/*/vercel.json`) — позволяет inline scripts, значительно ослабляет Content-Security-Policy. Нужен nonce-based CSP или hash.

### Logging & errors

- [ ] **`handleApiError` логирует `console.error("API Error:", error)`** (`packages/api-routes/src/error-handler.ts:11`) — unstructured log без redaction. Если error.details содержит password / token / email — попадёт в log as-is.
- [ ] **Error response включает `details` в dev mode** — если AppError случайно содержит sensitive данные, они уйдут в dev response.

### Data protection

- [ ] **PII классификация не задокументирована.** `AthleteProfile` содержит `healthStatus`, `healthNote`, `weightKg`, `heightCm` — потенциально медицинские данные (HIPAA-territory). Нет encryption-at-rest, нет retention policy, нет access audit log.
- [ ] **StructuredData XSS** (`apps/marketing/src/lib/components/seo/structured-data.tsx:14-16`). `JSON.stringify(structuredData)` в `dangerouslySetInnerHTML` для `<script type="application/ld+json">`. Если `structuredData` содержит user input с `</script>`, это XSS. `JSON.stringify` не экранирует `</script>`.

### Billing (deferred)

- [ ] **Идемпотентность платёжных мутаций.** Любая платёжная мутация должна принимать `Idempotency-Key`. Не опция — обязательное требование Stripe / PayPal.
- [x] **`Transaction.idempotencyKey String? @unique` уже в БД** (`schema.prisma:209`) — **но Optional**. Схема позволяет создавать транзакции без ключа.
- [x] **`Transaction.providerTxId String @unique`** (`schema.prisma:208`) — идемпотентность со стороны провайдера уже enforced на БД.
- [ ] **Аудит лог.** Любое изменение денежных или доступных ресурсов должно оставлять append-only запись: кто, когда, что, IP, source. Compliance (GDPR, SOC2) без этого не пройдёшь.

### Closed by prior sections

- [x] **`SessionGuard` не проверяет role** — закрыто в §1.5.E (admin `proxy.ts` с `role === ADMIN` check) + §1.5.F (platform `proxy.ts` с role-based route protection). `SessionGuard` остаётся client-side fallback, но proxy обеспечивает server-side enforcement.
- [x] **`apps/admin` нет middleware/proxy** — закрыто в §1.5.E. Admin теперь имеет `proxy.ts` с проверкой `UserRole.ADMIN`.
- [x] **Нет `.env.example`** — закрыто в §1.5.D.
- [x] **OWASP базово (частично)** — RichText XSS закрыт: `RichTextViewer` использует `DOMPurify.sanitize()` (`packages/ui/src/components/rich-text-viewer.tsx:74`). Security headers добавлены в §1.5.A (`vercel.json` с HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, CSP). Rate limiting и CSRF остаются открытыми (см. выше).

---

## 4. Надёжность и операционка

**Статус:** В работе (10/18 done, 4 removed, 7 remaining, 1 deferred)

Блокирует выход в прод. Без observability ты слепой, без timeouts — упираешься в пул соединений.

- [x] **Observability-first.** Структурированный логгер (pino / winston) + correlation ID через весь запрос. Сейчас этого нет. Единственный logging в `@repo/api-routes/error-handler.ts:11` — `console.error("API Error:", error)` без структуры и метаданных.
- [x] **Prisma client логирует только `error / warn` даже в dev** (`db/client.ts:56`) — нет `query` log. N+1 сыск затруднён.
- [x] **Нет correlation ID injection в route handler factories** (`packages/api-routes/src/route-helpers.ts`). Ни одного `crypto.randomUUID()`, ни `headers().get('x-request-id')`. Любой лог не коррелируется с запросом.
- [x] **Error taxonomy частично существует.** `@repo/errors` экспортирует `AppError / HttpError / UnauthorizedError / ForbiddenError / NotFoundError / ConflictError / ValidationError / InternalServerError / BadRequestError`. `ERROR_CODES.INTERNAL_SERVER_ERROR` и подобные константы тоже есть. Нужно: задокументировать полный список, сделать stable machine-readable codes в response, добавить domain-specific коды (`AUTH_EXPIRED`, `QUOTA_EXCEEDED`, `SUBSCRIPTION_PAST_DUE`).
- [x] **Error response format неидиоматичен:** `{ error: message, code, statusCode, timestamp, details?, stack? }` (`error-handler.ts:16-24`). `statusCode` дублирует HTTP status. Ideal — RFC 7807 Problem Details или `{ error: { code, message, details } }`.
- [x] ~~**`ApiClient` теряет server error code.**~~ Removed: no domain-specific codes exist. Server and client use identical generic codes. Revisit when domain codes are added.
- [x] ~~**`ApiClient.HTTP_STATUS_ERROR_MAP` неполный.**~~ Merged into retry bullet (4.2.C) — status map is only useful with retry logic acting on it.
- [x] **Timeouts и deadlines везде.** `ApiClient.request` делает `fetch` без AbortController → может висеть бесконечно. Любой upstream call без таймаута = потенциальный hang всего пула соединений.
- [x] **Retry + backoff + jitter.** `ApiClient` не ретраит. Одна сетевая ошибка = fail.
- [x] **~~Health / readiness endpoints.~~** Закрыто в §1.5.B. `/api/health`, `/api/ready`, `/api/version` добавлены во все 3 app'а.
- [ ] **Metrics.** Латенси p50 / p95 / p99 на эндпоинт, error rate, saturation. OpenTelemetry — стандарт. Ни одного OpenTelemetry импорта в проекте.
- [x] **Graceful degradation.** Если CMS отдаёт 500 — marketing должен показать stale cache, а не белый экран. Это архитектурное решение, не `if` в компоненте. `ApiClient` использует `cache: "no-store"` захардкоженно — нет возможности показать stale.
- [x] **Нет Next.js error files ни в одном app.** Ноль `error.tsx` (segment-level error boundary), ноль `global-error.tsx` (root layout crash → белый экран без recovery UI), ноль `not-found.tsx` (404 = дефолтный Next.js, не брендированный). Единственный `loading.tsx` — только в marketing root. Любая ошибка на любом уровне → полный crash без fallback.
- [x] **`handlePrismaError` обрабатывает только 2 Prisma error codes** (P2002, P2025) из 20+. `P2003` (foreign key), `P2034` (transaction deadlock), `P2011` (null constraint) и прочие → re-throw → generic 500.
- [x] **`request.json()` ошибки парсинга → 500 вместо 400.** Все фабрики в `route-helpers.ts` и `auth-factories.ts` делают `await request.json()` без try/catch. Невалидный JSON → generic Error → `handleApiError` → 500 Internal Server Error. Клиент получает "server error" за свой невалидный запрос.
- [x] ~~**ZodError details не проходят redaction.**~~ Removed: details are dev-only, and `redactSensitiveFields` operates on keys — wouldn't catch path values like `"password"` anyway.
- [x] ~~**`ApiClient.onUnauthorized` control flow bug.**~~ Removed: `redirect()` from Next.js returns `never` (always throws NEXT_REDIRECT). Code after the call is unreachable. Type is correct.
- [x] **Proxy auth failures silent.** `admin/proxy.ts` и `platform/proxy.ts`: `getToken()` может упасть, но ошибка нигде не логируется. Мисконфигурация auth в проде → молча редиректит всех на логин без следа в логах.
- [x] **`redactSensitiveFields` не защищён от circular references.** `error-handler.ts:26-38`: рекурсивный обход объекта без cycle detection. `error.details` с циклической ссылкой → stack overflow в самом error handler.
- [x] **Prisma: нет connection/query timeout.** `db/client.ts` создаёт PrismaClient без таймаутов. Медленный запрос висит бесконечно, занимая слот из пула соединений. В комбинации с отсутствием таймаутов на `ApiClient.fetch` — двойная проблема.
- [x] **Readiness endpoint проверяет только DB.** `/api/ready` делает `SELECT 1`, но не проверяет Blob storage. Admin без Blob = нерабочий upload. Readiness probe не видит эту деградацию.

### Implementation plan (section 4)

| №     | Commit hash | Status  | Description                                                                                                                                                                                                                         |
| ----- | ----------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1.A | `c2f0857`   | ✅ Done | Error response format: remove `statusCode` duplication, adopt `{ error: { code, message, details? } }` shape. Update `error-handler.ts` response serialization + `ApiClient` parsing.                                               |
| 4.1.B | `57c7159`   | ✅ Done | `request.json()` parsing errors → 400 Bad Request. Wrap JSON parsing in try/catch in `route-helpers.ts` and `auth-factories.ts`, throw `BadRequestError` on `SyntaxError`.                                                          |
| 4.1.C | `64306be`   | ✅ Done | `redactSensitiveFields` circular reference protection. Add `WeakSet` visited tracking to prevent stack overflow on cyclic `error.details`.                                                                                          |
| 4.1.D | —           | Removed | ~~ZodError details redaction.~~ Not needed: details are dev-only (`isDev` check), and `redactSensitiveFields` operates on keys, not values — wouldn't redact `path: "password"` anyway.                                             |
| 4.1.E | `d8f2887`   | ✅ Done | `handlePrismaError` expand coverage. Add P2003 (FK constraint), P2011 (null constraint), P2034 (transaction deadlock/write conflict), P2028 (transaction API error). Map to appropriate domain errors.                              |
| 4.1.F | —           | Removed | ~~`ApiClient` preserve server error code.~~ Not needed: no domain-specific error codes exist. Server and client use identical generic codes (`NOT_FOUND`, `ALREADY_EXISTS`, etc.). Revisit when domain codes are added.             |
| 4.1.G | —           | Removed | ~~`ApiClient.HTTP_STATUS_ERROR_MAP`.~~ Merged into 4.2.C — status map is only useful with retry logic acting on it.                                                                                                                 |
| 4.1.H | —           | Removed | ~~`ApiClient.onUnauthorized` control flow fix.~~ Not a bug: `onUnauthorized` calls `redirect()` which returns `never`. Code after the call is unreachable. Type is correct.                                                         |
| 4.2.A | `5da27ab`   | ✅ Done | `ApiClient` timeout via `AbortController`. Add configurable `timeoutMs` (default 30s) to request options. Abort fetch on timeout, throw `TimeoutError`.                                                                             |
| 4.2.B | `b2ed4bd`   | ✅ Done | Prisma connection/query timeout. Add `statement_timeout` and `connect_timeout` params to `DATABASE_URL` handling, or configure via Prisma client options.                                                                           |
| 4.2.C | `36a7e7e`   | ✅ Done | `ApiClient` retry with exponential backoff + jitter. Add 429/502/503/504 to `HTTP_STATUS_ERROR_MAP` with `ServiceUnavailableError`/`TooManyRequestsError` error classes. Retry on transient failures, max 3 attempts, configurable. |
| 4.2.D | `8357053`   | ✅ Done | `ApiClient` cache option configurable. Remove hardcoded `cache: "no-store"`, accept `cache`/`next` options per request. Default `no-store` for mutations, configurable for GETs.                                                    |
| 4.3.A | `a9bd115`   | ✅ Done | Structured logger: install `pino`, create shared logger module in `@repo/api-routes`. Replace `console.error` in `error-handler.ts` with structured JSON log.                                                                       |
| 4.3.B | `992da37`   | ✅ Done | Correlation ID: generate `x-request-id` (or read from incoming header) in `withErrorHandling`, inject into logger context, return in error response headers.                                                                        |
| 4.3.C | `833ff0d`   | ✅ Done | Prisma dev query logging: add `"query"` to log levels in development mode in `db/client.ts`. Log query text + duration via structured logger.                                                                                       |
| 4.3.D | `f4eb8b2`   | ✅ Done | Proxy auth error logging: wrap `getToken()` in try/catch in `admin/proxy.ts` and `platform/proxy.ts`. Log failures with structured logger instead of silent redirect.                                                               |
| 4.4.A | `53f0229`   | ✅ Done | Next.js error files: create `error.tsx`, `global-error.tsx`, `not-found.tsx` for all 3 apps (admin, marketing, platform). Branded UI with recovery actions.                                                                         |
| 4.5.A | `4847237`   | ✅ Done | Readiness endpoint: add Blob storage connectivity check in admin's `/api/ready`. Return 503 if Blob is unreachable.                                                                                                                 |

**Deferred bullets** (no implementation now, documented as known debt):

- OpenTelemetry / metrics foundation — requires telemetry backend infrastructure (Jaeger, Honeycomb, Datadog). ADR needed before implementation. Tracked as operational debt; trigger: first production deployment with real traffic.

---

## 5. База данных и миграции

**Статус:** Закрыта

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
- [ ] **Директория `packages/api-server/prisma/migrations/` отсутствует.** Проект использует `db:push` исключительно — нет версионированных миграций вообще. Любое изменение схемы → drop+recreate, нельзя воспроизвести prod state на staging.
- [ ] **`seed.ts` 1242 строк** — большой, сложно поддерживать, легко внести inconsistent state. Нет разбиения на modular seeders по контекстам.
- [ ] **`seed.ts` использует `new PrismaClient()`**, обходя `db/client.ts` extension — данные seed'а не проходят через soft-delete handling.
- [ ] **`training-plans.ts:getAll` делает `findMany({ where: { coachId } })` без pagination и без limit** — 1000 планов = 1000 результатов.
- [ ] **`enrollment-query.ts` делает nested `workoutLogs` без limit** — athlete с тысячами логов вернёт их все.
- [ ] **`enrollment-query.ts.workouts.select` не фильтрует archived** — `computeTodayStatus` и `computeProgressBuckets` учитывают archived workouts в статистике. Potential bug.
- [ ] **Test helpers используют `new PrismaClient()`** (`test/helpers.ts:7`) — обходят extension. Значит тесты и прод различаются по поведению.
- [ ] **Unbounded `findMany` в 5+ admin endpoints помимо training-plans.** `users-admin.ts`, `review/admin.ts`, `contact/admin.ts`, `blog/admin.ts`, `product/admin.ts` — все без `take`/pagination. При росте данных → деградация.
- [ ] **Public pages грузят ALL products + ALL reviews** (`cms/pages/public.ts`) — unbounded `findMany` на двух таблицах параллельно. При масштабировании каталога → медленная витрина.
- [ ] **`workout.ts` aggregate() на soft-deletable модели** — `tx.workout.aggregate({ where: { planId, scheduledDate }, _max: { sortOrder: true } })` не фильтрует `deletedAt`. Может вернуть sortOrder от soft-deleted workout'а.

### Implementation plan (section 5)

| ID    | Commit hash | Status  | Description                                                                                                                                                                                                |
| ----- | ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1.A | `9fbb73c`   | ✅ Done | ADR 0019: database strategy deferred decisions (db:push→migrate trigger, Subscription.id external key, soft-delete write ops unfiltered, test helpers bypass, CHECK constraints, unbounded queries → §10). |
| 5.2.A | `23d2d17`   | ✅ Done | Soft-delete extension: add `count`, `aggregate`, `groupBy`, `findFirstOrThrow`, `findUniqueOrThrow` handlers with `deletedAt` filtering. Fixes dashboard count leak + workout aggregate leak.              |
| 5.2.B | `04fc267`   | ✅ Done | Remove duplicate `@@index([role])` on User (covered by composite `@@index([role, deletedAt])`).                                                                                                            |
| 5.3.A | `e28af63`   | ✅ Done | Seed verification: raw `PrismaClient` in seed is correct (clearAll needs hard-delete). Added root `pnpm db:seed` script. Verified `db:push && db:seed` runs cleanly.                                       |

**Deferred bullets** (documented in ADR 0019, explicit triggers):

- `prisma migrate` adoption — trigger: first production deployment with real data
- CHECK constraints (rating range) — trigger: same as above
- Unbounded admin queries — tracked as §10 (Frontend) pagination items
- Soft-delete scope expansion (AthleteProfile, CoachNote, Price, MarketingPage) — design decisions, not bugs. Current scope is intentional.
- Retention policy — business decision, needs product input
- Read replicas — future architecture, no current need

---

## 6. API Design

**Статус:** В работе

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
- [ ] **`z.date()` vs `z.coerce.date()` inconsistent** — 51 usage `z.date()` в 20 файлах, 9 usage `z.coerce.date()` в 5 файлах. `z.date()` в response schemas OK (Date object), но в request schemas (JSON body parsing) — всегда fail. Нужен audit какие API schemas содержат input dates.
- [ ] **Zod schemas используют magic numbers вместо констант** (нарушение CLAUDE.md правила):
  - `product.schema.ts:16,34`: `title.max(200)` (вместо `PRODUCT_CONSTANTS.MAX_TITLE_LENGTH`)
  - `product.schema.ts:17,36`: `description.min(1)` без max
  - `blog.schema.ts:7,11`: `title.max(200)`, `slug.max(200)`
  - `blog.schema.ts:13`: `excerpt.max(500)`
  - `coach-profile.schema.ts:12`: `bio.max(2000)`
- [ ] **Zod schemas пропускают critical validation:**
  - `product.schema.ts:19`: `trainingPlanId: z.string().nullable()` — без `.cuid()`
  - `user.schema.ts`: `image: z.string().nullable()` без `.url()` → XSS via `javascript:...`
  - `user.schema.ts`: `name: z.string().nullable()` без max length, без sanitization
  - `user.schema.ts`: `timezone: z.string()` — любая строка, не IANA
  - `product.schema.ts`: `features: z.array(z.string())` — без max items
  - `product.schema.ts`: `prices: z.array(...)` — без min/max
  - `publicBlogPostSchema.title: z.string()` — без min/max (inconsistent с admin view)
  - `blog.schema.ts`: `tags: z.array(z.string())` — без limits
- [ ] **Hardcoded English error messages в Zod schemas** (`auth`, `pages`, `blog`) — нарушают i18n, не переводятся.
- [ ] **Route handler factories возвращают `{ success: true }` вместо `204 No Content`** (`route-helpers.ts:103-106,145`, `auth-factories.ts:125,138`). Anti-pattern.
- [ ] **`createGetHandler` не принимает query params** — отдельный `createAuthGetWithQueryHandler` есть, но `createGetWithQueryHandler` (без auth) отсутствует. Public list endpoints с filters невозможно построить через factory.
- [ ] **`createAuthGetWithQueryHandler` использует `Object.fromEntries(searchParams.entries())`** (`auth-factories.ts:26`) — array params (`?ids=1&ids=2`) теряются (последнее значение).
- [ ] **`createFormDataPostHandler` без requestSchema** — form data не валидируется.
- [ ] **Нет body size limit** на handler level.
- [ ] **`z.number()` без `.finite()` на процентных полях** — `coach-dashboard-api.schema.ts:59` (`avgEngagementRate`), `coach-athletes-api.schema.ts:52` (`adherenceRate4w`). Позволяют `Infinity`/`NaN` пройти через Zod validation.
- [ ] **`amountCents` без `.max()`** — `product.schema.ts:7`: `z.number().int().min(0)` без upper bound. Стоит добавить разумный потолок для money values.
- [ ] **HTTP 201 inconsistency** — auth POST factories (`auth-factories.ts:61,78`) возвращают 201, public `createPostHandler` (`route-helpers.ts:68`) возвращает 200. Одна и та же операция создания — разный status code.

### Implementation plan (section 6)

| ID    | Commit hash | Status  | Description                                                                                              |
| ----- | ----------- | ------- | -------------------------------------------------------------------------------------------------------- |
| 6.1.A | `fcd61e0`   | ✅ Done | ADR 0020: API design decisions (versioning strategy, body size rationale, deferred items with triggers). |
| 6.2.A | `04a0c3d`   | ✅ Done | Make `responseSchema` required in all route handler factories. Fix all call sites (16 files).            |
| 6.2.B | `1f0ea9c`   | ✅ Done | Delete/void handlers → 204 No Content. `createPostHandler` → 201 Created.                                |
| 6.2.C | `768030e`   | ✅ Done | Public marketing endpoints: add `Cache-Control` headers for cacheable responses.                         |
| 6.3.A | `4650592`   | ✅ Done | Zod magic numbers → entity constants across all schema files.                                            |
| 6.3.B | `4c71242`   | ✅ Done | Zod validation hardening: `.cuid()`, `.url()`, `.finite()`, `amountCents.max()`, missing bounds.         |

**Deferred bullets** (documented in ADR 0020):

- API versioning implementation — trigger: first external consumer (mobile app, partner API)
- Rate limiting — already tracked in ADR 0018 with trigger
- Application-level body size limit — Vercel 4.5MB platform limit sufficient, app-level adds value after rate limiting
- Pagination — tracked as §10 (Frontend) joint concern
- i18n error messages — tracked as §7 (Architectural risks)

---

## 7. Архитектурные риски на 6 месяцев вперёд

**Статус:** ✅ Завершено

Non-obvious стафф. Это то, что больнее всего ретрофитить — не из-за сложности кода, а из-за того, что к моменту, когда «пригорит», зависимостей уже слишком много. Решения принимаются сейчас.

- [x] **Job queue.** Любая работа >100 ms, которую можно отложить, должна быть в очереди (BullMQ, Inngest, Trigger.dev). Синхронное выполнение в request / response упирается в стенку. `CoachActionItem` генерирует события с `AUTO_*` резолюцией → требует scheduled jobs. **Documented in ADR 0021 (Tier 1).**
- [x] **Emails и notifications как first-class citizen.** Email port есть, 0 vendor implementations. `MarketingContactSubmission` без подтверждений отправителю. **Documented in ADR 0021 (Tier 1).**
- [x] **Платформа vs продукт.** Разделение уже заложено bounded contexts из §1: Platform = IAM + Storage + Billing, Products = CMS + LMS + Coaching. Enforcement через dependency-cruiser. **Documented in ADR 0021 (Tier 3) — monitor for trigger.**
- [x] **CMS governance.** `MarketingBlogPost` имеет `isPublished` toggle, но нет draft/publish workflow, версионности, preview mode. **Documented in ADR 0021 (Tier 2).**
- [x] **Internationalization от нулевой строки.** Hardcoded English: toast messages в `create-crud-hooks.ts`, `PROCESS_STATUS_LABELS`, `DEFAULT_LOCALE`, platform hooks. **Documented in ADR 0021 (Tier 2). Phase 1 fix in bullet 7.2.B.**
- [x] **Billing domain существует в БД, но не в API.** Stripe schema implicit, `Transaction.idempotencyKey` nullable. **Documented in ADR 0021 (Tier 1).**
- [x] **`formatPrice` precision loss.** `minimumFractionDigits: 0` → $9.99 → "$10". **Fixed in bullet 7.2.A.**
- [x] **CMS не управляет SEO.** `PAGE_SEO` hardcoded, CMS `seoTitle`/`seoDesc` не используются. **Documented in ADR 0021 (Tier 2).**
- ~~**`dayjs` inconsistency.**~~ **Пшик.** dayjs отсутствует в репо. `date-helpers.ts` использует native `Intl.DateTimeFormat` — правильный modern approach, не хак. Нет vendor lock-in, нет нужды в абстракции.

### Implementation plan (section 7)

| Bullet | Commit hash | Status  | Description                                                                                           |
| ------ | ----------- | ------- | ----------------------------------------------------------------------------------------------------- |
| 7.1.A  | `9217cb3`   | ✅ Done | ADR 0021: architectural risks — six-month horizon. Remove dayjs bullet as пшик.                       |
| 7.2.A  | `ec83537`   | ✅ Done | Fix `formatPrice` precision: remove `FractionDigits: 0`, show $9.99 correctly.                        |
| 7.2.B  | `e52a07a`   | ✅ Done | `formatPrice`/`formatDate` accept locale param, `DEFAULT_LOCALE` as fallback. Minimal i18n readiness. |

---

## 8. Monorepo дисциплина

**Статус:** ✅ Завершено

Усиливает все границы сверху. Без автоматического enforcement любая конвенция разваливается через месяц.

- [x] **Enforced boundaries.** dependency-cruiser с 23 правилами — **закрыто в §1 (1.3.A)**. ESLint `no-restricted-paths` redundant.
- [x] **Package API surface.** `exports` field есть во всех пакетах. Deep imports невозможны.
- ~~**`@repo/ui` wildcard exports `"./*"`**~~ — **Пшик.** Проверка: `exports: { ".": "./src/index.ts" }`, wildcard отсутствует.
- [x] **`api-server` subpath exports** — **закрыто в §1 (1.2.D)**. 6 subpath exports: cms, lms, coaching, iam, storage, ops.
- [x] **Single version policy.** Catalog в `pnpm-workspace.yaml` — consistent. Exact для infra (next, prisma, next-auth), caret для libs. **Не проблема** — caret для библиотек (react, MUI) = standard practice.
- [x] **`syncpack`** — deferred. Catalog + workspace protocol достаточно для текущего размера. Trigger: >20 пакетов или первый version drift инцидент.
- [x] **Две иконные либы.** `lucide-react` только в marketing (дизайн-решение — landing page иконки != MUI). `@mui/icons-material` в admin/platform. **Не инконсистентно** — разные design systems для разных аудиторий. Deferred.
- [x] **`@repo/shared` utility junk drawer.** 14 файлов. Splitting на микро-пакеты (@repo/money, @repo/dates) — overkill. Каждый файл ≤66 строк, без circular deps, barrel чистый. Trigger: second consumer package pattern diverges.
- [x] **Turbo cache.** `build` и `check-types` cached, `lint` — `cache: false`. **Найден inconsistency**: lint uncached, check-types cached. **Fixed in 8.2.B.**
- [x] **`turbo.json test`** — vitest через root `pnpm test`, не через turbo. Intentional: vitest.workspace.ts координирует 2 пакета (api-server, contracts), turbo orchestration добавит overhead без выгоды.
- [x] **`pre-commit type-check` висит** — наблюдалось на Windows с Neon cold-start. CI использует local postgres, проблема не воспроизводится. Deferred до следующего воспроизведения.
- [x] **`eslint-plugin-only-warn`** — intentional design. `--max-warnings 0` = CI blocking. IDE yellow = cosmetic. Removing plugin = no gain, just different color. Deferred.
- [x] **Storybook не тестирует `@repo/ui`.** Storybook = MUI theme catalog (intentional). `@repo/ui` компоненты тестируются через app-level usage, не stories. Trigger: onboarding нового разработчика, который не знает design system.
- ~~**`AppRouterCacheProvider v15-appRouter`**~~ — **Пшик.** MUI v7 (`@mui/material-nextjs@7.3.6`) не выпустила v16 path. `v15-appRouter` — единственный доступный. Next.js 16 backward-compatible.
- [x] **`@repo/contracts` dependency in `@repo/api-client`** — **закрыто в §1 (1.6.C)**. Declared as direct dep.
- [x] **`@repo/auth` dual-instance** — **закрыто в §1 (1.6.A)**. `next-auth` as peerDependency.
- [ ] **NEW: `lefthook.yml` test не фильтрован.** `pnpm test` гоняет все 240 тестов на каждый коммит. `lint` и `check-types` уже используют `--filter="...[HEAD]"`. 12+ секунд впустую при UI-only changes.
- [ ] **NEW: `@repo/env` missing `"type": "module"`.** Все 11 packages имеют `"type": "module"`, env — нет. Работает через tsconfig, но нарушает consistency.
- [ ] **NEW: `turbo.json` lint `cache: false` inconsistency.** `check-types` cacheable, `lint` — нет. Обе — validation tasks без outputs. lint должен кэшироваться так же.

### Implementation plan (section 8)

| Bullet | Commit hash | Status  | Description                                                                                 |
| ------ | ----------- | ------- | ------------------------------------------------------------------------------------------- |
| 8.1.A  | `0977673`   | ✅ Done | ADR 0022: monorepo discipline decisions. Пшики, deferred items, intentional choices.        |
| 8.2.A  | `9f02f4a`   | ✅ Done | lefthook test filter + @repo/env type:module + turbo lint caching. Monorepo config hygiene. |

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
- [ ] **Contract tests отсутствуют.** `packages/api-client` не импортирует `@repo/contracts` (см. п. 1.6), значит runtime-проверка совместимости client ↔ server через общий контракт невозможна.
- [ ] **`test/helpers.cleanup` silent failure** (`helpers.ts:59`) — `.catch(() => {})` проглатывает ошибки cleanup'а. Незавершённый cleanup → flaky следующий test run.
- [ ] **`test/helpers` обходит `db/client.ts` extension** — поведение тестов и прода различается. Soft-delete не проверяется.
- [ ] **Нет snapshot / visual regression тестов** для UI components.

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
- [ ] **`apps/marketing` — ВСЕ pages имеют `export const dynamic = "force-dynamic"`** (`home`, `about`, `blog`, `blog/[slug]`, `contact`, `faq`, `storefront`, `sitemap.ts`). Marketing полностью SSR на каждый запрос, нет CDN caching, нет ISR, нет static generation. Архитектурная ошибка для публичного маркетинг-сайта.
- [ ] **ВСЕ marketing modules — client components** (`home/index.tsx`, `about/index.tsx`, etc.). В сочетании с `force-dynamic`: server рендерит placeholder HTML, client hydrate'ит контент через React Query. SEO crawler видит пустой HTML.
- [ ] **`useState/useEffect` в marketing используется только в 2 файлах** → все остальные client components — **false client** (не имеют client state). Могут (и должны) стать server components.
- [ ] **`apps/admin/src/app/(auth)/layout.tsx` с `"use client"` без причины** — только markup с `sx`, нет hooks/handlers. Unnecessary client boundary.
- [ ] **`121 file с `"use client"` в apps** — аудит на unnecessary client boundaries.
- [ ] **Нет security headers в `next.config.ts`** ни в одном app (уже в 1.5, но повторяю тут для completeness пункта 10: они настраиваются в next config).
- [ ] **Нет bundle analyzer** (`@next/bundle-analyzer` не установлен). Нельзя измерить bundle size / what's in it.
- [ ] **Heavy deps в main bundle:** `framer-motion`, `@tiptap/*`, `@dnd-kit/*` в обычных `dependencies` потребителей. `isomorphic-dompurify` в `@repo/ui` — загружается в каждый app через shared ui.
- [ ] **`lucide-react` vs `@mui/icons-material`** — две иконные либы в разных apps. Marketing использует lucide, admin/platform — MUI icons. Bundle bloat.

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
- [ ] **`packages/errors/src/error-codes.ts` содержит только 6 кодов** (INTERNAL_SERVER_ERROR, UNAUTHORIZED, FORBIDDEN, VALIDATION_ERROR, INVALID_INPUT, NOT_FOUND, ALREADY_EXISTS). Нет domain-specific codes (SUBSCRIPTION_PAST_DUE, QUOTA_EXCEEDED, PAYMENT_FAILED, RATE_LIMITED, IDEMPOTENCY_KEY_REUSED). Клиент не различает «user not found» и «workout not found» — оба NOT_FOUND.
- [ ] **`interface AppErrorOptions`** (`packages/errors/src/app-error.ts:3`) — нарушает правило «type, not interface».
- [ ] **CLAUDE.md описывает иерархию `AppError → HttpError → Specific`**, но в коде только двухуровневая `AppError → Specific`. Документация и реальность не совпадают.
- [ ] **`interface ApiClientConfig`** (`packages/api-client/src/client.ts:22`) — нарушает правило «type, not interface».
- [ ] **`throw new Error(...)` в `create-crud-hooks.ts:97,123,148`** — generic Error вместо AppError из `@repo/errors`.
- [ ] **`(rawPrisma as unknown as Record<...>)` каст** в `test/helpers.ts:49` — нарушает правило «No as casts» (допустимо для test utils, но всё равно повод вынести в правильный test harness API).
- [ ] **`dashboard-computations.test-helpers.ts:62`** — `as unknown as EnrollmentWithData` каст.
- [ ] **`tsconfig.base.json` не имеет:** `exactOptionalPropertyTypes`, `noFallthroughCasesInSwitch`, `noImplicitReturns`, `noPropertyAccessFromIndexSignature`.
- [ ] **`userId: string` в `AuthenticatedHandler`** (`api-routes/src/types.ts:6`) — не branded type.
- [ ] **`RouteContext.params: Promise<Record<string, string>>`** — params как generic record, не типобезопасно per-route.

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
- [ ] **CI в `.github/workflows/` содержит ТОЛЬКО 2 файла:** `claude.yml` и `claude-code-review.yml` — оба для Claude Code integration. **НЕТ build / test / type-check / lint в CI.** Pre-commit hooks — единственный gate. PR может быть смержен с broken TS/tests если кто-то обошёл pre-commit. **Это блокирующий gap, а не косметика.**
- [ ] **Нет CODEOWNERS** — нет policy автоматического reviewer assignment.
- [ ] **Нет `.github/pull_request_template.md`** — PR без template.
- [ ] **Нет `.github/dependabot.yml` или Renovate** — нет автоматических dependency updates.
- [ ] **Нет release pipeline** (changesets, semantic-release, etc.).
- [ ] **Нет SAST/DAST/SCA** (CodeQL, Snyk, dependency scan).
- [ ] **Pre-commit hook зависает на `type-check` в parallel mode** — наблюдалось в этой сессии, лечилось только `kill -TERM`. Надо разобрать причину (возможно конкуренция ресурсов между parallel шагами или specific file, который tsc зацикливает).
- [ ] **Root `db:*` scripts неконсистентны.** `db:generate` и `db:push` идут через `turbo run`, а `db:seed` — через `pnpm --filter @repo/api-server`. Все три target'ят один package. Унифицировать: все через `pnpm --filter` (turbo overhead не нужен для single-package tasks).

---

## Порядок работ

Выполнение строго сверху вниз: каждый пункт после утверждения плана, один bullet = один коммит, прогресс отмечается в этом файле (checkbox `[x]` + поле «Статус»). Research-фаза секции обновляет файл новыми находками.

Code style и MUI-нюансы (то, что в `CLAUDE.md`) — последний слой полировки, не первый. Проблемы, которые реально убивают, живут уровнем выше.
