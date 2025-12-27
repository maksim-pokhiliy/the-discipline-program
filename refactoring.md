## Доменные пакеты и границы

- Оставить `packages/api` как единый слой домена и доступа к данным: Prisma, сервисы (`blog`, `programs`, `reviews`, `dashboard`, `contacts`), HTTP‑клиент и общие типы (`Program`, `Review`, `Admin*PageData` и т.п.).
- Добавить `@repo/shared` для кросс‑доменных констант и типов (layout, навигация, SEO‑конфиг, базовые utility‑типы) вместо их дублирования в `apps/admin` и `apps/marketing`.

## UI и общие компоненты

- Вынести общие UI‑компоненты в `@repo/ui` и в приложениях оставить только импорт:
  - `Logo`, `NavLinkButton` (с состоянием active).
  - Header‑части (drawer, hide‑on‑scroll, navigation) и layout‑обёртки (`ContentSection`, общий `Layout`, `PaymentPageWrapper` — несмотря на то, что платежи игнорируем, сам layout общий).
- Создать generic `DataTable` (колонки, сортировка, actions) и переписать на него `PostsTable`, `ProgramsTable`, `ReviewsTable`, сохранив доменные части (какие колонки, какие действия) в модулях, а механику таблицы — в `@repo/ui`.

## React Query и хуки

- Продолжать использовать `createPageDataCrudHooks` из `@repo/query/src/crud.ts`, но убрать лишнюю ручную обвязку в админских хуках:
  - Оставить в `use-blog.ts`, `use-programs.ts`, `use-reviews.ts` только экспорт `useXPageData / useX / useXStats / useXMutations` и доменно‑специфичные мутации (`togglePublished`, `toggleFeatured`), которые реально не вписываются в generic CRUD.
  - Для простых read‑хуков (`useContacts`, `useDashboardData`, `usePrograms`/`useReviews` в маркетинге, `usePages*`) завести helper `createQueryHook` в `@repo/query`, чтобы минимизировать повторяемый boilerplate `useQuery({ queryKey, queryFn })`.

## CRUD‑routes и toggle‑handlers

- В `packages/api` сделать фабрики для API‑handlers и использовать их в `apps/admin/src/app/api/...`:
  - `createEntityByIdHandlers` с параметрами `getById`, `update`, `remove`, который будет использоваться для `/blog/[id]`, `/programs/[id]`, `/reviews/[id]` (GET/PUT/DELETE).
  - `createOrderUpdateHandler` для reorder endpoints (`/blog/order`, `/programs/order`, `/reviews/order`) с общей валидацией массива `updates` и типизацией[`{ id: string; sortOrder: number }[]`].
- Для toggle‑routes `/blog/[id]/toggle`, `/programs/[id]/toggle`, `/reviews/[id]/toggle` иметь одну фабрику `createToggleHandler` в `@repo/api/routes` и передавать ей:
  - функцию `toggle(entityId, field, value)`, которая уже инкапсулирована в доменном сервисе;
  - список разрешённых полей, которые можно менять этим роутом (например, для блог‑поста `["isPublished", "isFeatured"]`, для программы — `["isActive"]`, для отзыва — `["isActive", "isFeatured"]`).
  - Handler читает из тела/квери имя поля и новое значение и проверяет, входит ли поле в разрешённый список; остальное — общий код (парсинг `id`, обработка ошибок, ответ).

## Дублирующая доменная логика и формы

- Объединить логику дублирования сущностей в generic helper в `@repo/api/utils`: сейчас есть `blog-duplication.ts`, `program-duplication.ts`, `review-duplication.ts`, которые одинаково вычисляют новый `name`/`slug`, `sortOrder` и деактивируют копию.
- Вынести общую форму‑механику в `@repo/ui/hooks/use-form-modal` и использовать её в `use-program-modal.ts` и `use-review-modal.ts`: единое состояние `isEditing / isDuplicating`, `isSubmitting`, `submitError`, общие `handleSubmit/handleClose`; доменная разница — какую схему и какие поля подаёшь внутрь.

## Конфиг, навигация, SEO

- Навигацию и layout‑константы собрать в `@repo/shared/config`:
  - Структура админского меню (`NAVLINKS`), размеры логотипа, общие брейкпоинты, цвета, dom‑anchors для маркетинга.
  - SEO‑конфиг (`seo-config.ts`) и вспомогательные функции (`seo-utils.ts`) держать в пакете и переиспользовать в обеих аппах, вместо отдельных копий в `apps/marketing/src/shared`.

## Prisma и данные

- В `schema.prisma` добавить индексы по реальным паттернам чтения:
  - `BlogPost(isPublished, publishedAt)` для сортировки опубликованных постов.
  - `Program(isActive, sortOrder)` и `Review(isActive, sortOrder)` для маркетинговых списков и админских таблиц.
- Перенести все вычисления агрегатов для dashboard‑статистики из фронта в слой `packages/api/endpoints/admin/dashboard.ts` (если что‑то ещё считается на клиенте) и возвращать уже готовые числа/series.

## Общие провайдеры и обвязка

- Объединить `QueryProvider` из admin и marketing в один компонент `QueryProvider` в `@repo/query` (со стандартным `staleTime`, `gcTime`) и использовать его в обоих приложениях, чтобы настройки кеша и клиента были едиными.
- В `@repo/ui` добавить `ErrorBoundary` и оборачивать им верхнеуровневые layout’ы admin/marketing, чтобы перехватывать runtime‑ошибки с читабельным fallback и логированием.

## Логирование «по‑взрослому»

- Ввести `@repo/logger` с полноценным structured‑logging (например, pino/winston) и адаптерами под Node/Edge, без промежуточной «обёртки над console».
- Заменить во всех API‑роутах и доменных сервисах прямые `console.error/console.log` на `logger.info/logger.error` с контекстом (route, userId, entityId, payload summary), чтобы код выглядел как в продакшене большого продукта.
