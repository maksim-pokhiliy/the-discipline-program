## 1. Создать `packages/contracts`

- Создать структуру: `src/entities/{program,review,blog,contact}/`
- Перенести Zod schemas из `apps/admin/src/modules/auth/shared/schema.ts`
- Создать schemas для всех API endpoints (program, review, blog, contact)
- Сгенерировать TypeScript types через `z.infer<typeof>`
- Экспортировать константы (enums, defaults)

## 2. Создать `packages/errors`

- Создать базовый класс `AppError` с кодами и статусами
- Создать специфичные классы: `NotFoundError`, `ValidationError`, `UnauthorizedError`
- Создать enum `ERROR_CODES` с константами
- Создать централизованный `errorHandler` для Next.js API routes
- Создать `formatError` для клиентской стороны

## 3. Создать `apps/api`

- Инициализировать Next.js приложение
- Перенести все API routes из `apps/admin/src/app/api/`
- Перенести все API routes из `apps/marketing/src/app/api/`
- Добавить валидацию через `packages/contracts` во все routes
- Добавить error handling через `packages/errors`
- Настроить CORS для admin и marketing apps

## 4. Разделить `packages/api`

- Создать `packages/api-client` (browser + server clients)
- Создать `packages/api-server` (endpoints, services, Prisma)
- Перенести `src/client.ts` → `packages/api-client`
- Перенести `src/endpoints/`, `src/services/`, `prisma/` → `packages/api-server`
- Обновить импорты в `apps/api`
- Удалить старый `packages/api`

## 5. Исправить Prisma schema

- Создать модель `Tag` с many-to-many для `BlogPost`
- Убрать `String[]` из `BlogPost.tags`
- Убрать nullable `Review.programId` (сделать required или отдельную таблицу)
- Добавить индексы на часто используемые поля
- Запустить миграцию

## 6. Создать Repository pattern в `packages/api-server`

- Создать `src/repositories/program.repository.ts`
- Создать `src/repositories/review.repository.ts`
- Создать `src/repositories/blog.repository.ts`
- Создать `src/repositories/contact.repository.ts`
- Заменить прямые вызовы Prisma на repository во всех endpoints
- Удалить прямые импорты `prisma` из endpoints

## 7. Объединить мелкие packages

- Создать `packages/ui-kit` (слияние `mui` + `ui`)
- Создать `packages/data` (слияние `query` + optimistic logic)
- Создать `packages/core` (слияние `auth` + `shared`)
- Обновить импорты во всех apps
- Удалить старые packages (`mui`, `ui`, `query`, `auth`, `shared`)

## 8. Создать базовую фабрику для CRUD mutations

- Создать `packages/data/src/factories/use-basic-crud.ts`
- Реализовать generic функцию для create/update/delete
- Рефакторить `apps/admin/src/lib/hooks/use-programs.ts`
- Рефакторить `apps/admin/src/lib/hooks/use-reviews.ts`
- Рефакторить `apps/admin/src/lib/hooks/use-blog.ts`

## 9. Убрать грязный код из order routes

- Заменить `normalizeOrderPayload` на Zod schema в blog order route
- Заменить `parseUpdates` на Zod schema в programs order route
- Заменить `parseUpdates` на Zod schema в reviews order route
- Удалить все ручные проверки типов

## 10. Унифицировать SEO код

- Перенести всё из `apps/marketing/src/shared/components/seo/` в `packages/core`
- Удалить дублирующийся код из `packages/shared/src/seo/`
- Обновить импорты в `apps/marketing`

## 11. Упростить eslint configs

- Объединить в 2 конфига: `next.js` и `library.js`
- Удалить `react-internal.js`, `react-query.js`, `base.js`
- Обновить импорты во всех `eslint.config.mjs`

## 12. Удалить неиспользуемые файлы

- Удалить `packages/api/src/contracts.ts`
- Удалить `packages/api/src/db.ts`
- Удалить пустые index.ts где возможно

## 13. Фиксить naming inconsistencies

- Переименовать exports чтобы совпадали с именами файлов
- Пример: `use-blog-page-data.ts` → `export const useBlogPageData`
- Проверить все hooks, utils, components

## 14. Убрать папки для одного файла

- `apps/admin/src/modules/blog/sections/blog-stats-section/index.tsx` → `blog-stats-section.tsx`
- То же для всех sections в admin
- То же для всех sections в marketing

## 15. Обновить зависимости в apps

- Удалить `@repo/api` из `apps/admin/package.json`
- Удалить `@repo/api` из `apps/marketing/package.json`
- Добавить `@repo/api-client` в оба apps
- Добавить `@repo/contracts` в оба apps
- Добавить `@repo/errors` в оба apps
