# Refactoring Plan: Eliminate CRUD Boilerplate

> Created: 2026-02-16
> Status: In Progress

## Context

The admin app has ~3,800 lines of duplicated code across 6 CRUD modules (blog, products, contacts, exercises, reviews, users). Every module re-implements identical patterns for hooks, views, route handlers, and delete confirmation. This refactoring extracts shared abstractions to eliminate ~785 lines of net duplication while preserving all existing behavior and export names.

## What We're NOT Touching

- **API Server endpoints** (`packages/api-server/src/endpoints/`) — business logic varies meaningfully per entity
- **Contract schemas** (`packages/contracts/`) — intentionally explicit per entity
- **List section column/filter definitions** — unique per module by design
- **Marketing app** — minor duplication (heroes, CTAs) not worth the abstraction cost now
- **Create/Edit views** — form content varies too much; defer to follow-up

---

## Phase 1: Create Foundation Utilities (no consumers changed)

### 1.1 CRUD Hook Factory

**Create**: `apps/admin/src/lib/hooks/create-crud-hooks.ts`

Factory function `createCrudHooks<TPageData, TEntity, TCreateData, TUpdateData>(config)` that generates:

- `usePageData({ initialData? })` — useQuery with staleTime logic
- `useById(id, initialData?)` — useQuery with enabled guard
- `useCreate()` — useMutation + toast + invalidate + router.push
- `useUpdate()` — useMutation + toast + invalidate page/byId + router.push
- `useDelete()` — useMutation + toast + invalidate (no redirect)

Config shape:

```ts
{
  entityName: string;           // "Exercise" — for toast messages
  keys: { page, byId };        // query key functions
  api: { getPageData, getById, create?, update?, delete? };
  redirectTo: string;           // "/exercises"
  additionalInvalidateKeys?: QueryKey[];  // default: [adminKeys.dashboard()]
}
```

Toggle hooks stay manual per module — too varied for abstraction (blog has 2 toggles, products/reviews have 1 each, exercises/contacts/users have 0).

### 1.2 Route Handler Helpers

**Create**: `apps/api/src/lib/route-helpers.ts`

Helper functions that wrap the repetitive try-catch-validate-return pattern:

- `createGetHandler(apiFn, responseSchema?)` — for list and page-data GET
- `createGetByIdHandler(apiFn, paramsSchema)` — for GET by id
- `createPostHandler(apiFn, requestSchema)` — for POST create
- `createPutHandler(apiFn, paramsSchema, requestSchema)` — for PUT update
- `createDeleteHandler(apiFn, paramsSchema)` — for DELETE
- `createToggleHandler(apiFn, paramsSchema)` — for PATCH toggle

Import `handleApiError` from `@repo/errors`. Use `@app/*` alias (confirmed in apps/api/tsconfig.json).

### 1.3 useDeleteConfirmation Hook

**Create**: `apps/admin/src/lib/hooks/use-delete-confirmation.ts`

Returns `{ deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting }`.
Accepts `deleteMutation: UseMutationResult<void, Error, string>`.

### 1.4 AdminListView Generic Component

**Create**: `apps/admin/src/lib/components/admin-list-view.tsx`

```tsx
<AdminListView<TData> queryResult={UseQueryResult} loadingMessage="Loading...">
  {(data) => <SectionComponent {...data} />}
</AdminListView>
```

Wraps QueryWrapper + Container — replaces 7 identical view components.

### 1.5 Query Keys Factory (minor)

**Create**: `packages/query/src/keys/create-entity-keys.ts`

`createEntityKeys(root, entity)` → `{ page(), byId(id) }`. Optional utility for future entities.

**Verify**: `pnpm check-types` after Phase 1.

---

## Phase 2: Migrate Hooks (highest ROI: ~320 lines saved)

Rewrite each hook file to use factory. **Export names stay identical** — no consumer changes needed.

Migration order (simple → complex):

1. `use-exercises.ts` — standard CRUD, no toggle
2. `use-reviews.ts` — factory for CRUD + manual toggle
3. `use-products.ts` — factory for CRUD + manual toggle
4. `use-blog.ts` — factory for CRUD + 2 manual toggles
5. `use-contacts.ts` — factory for pageData/byId/delete only; manual useUpdateContact (has onSuccess callback param)
6. `use-users.ts` — factory for pageData/byId only; manual useUpdateUserRole (non-standard update)
7. `use-exercise-categories.ts` — stays fully manual (different key shape `all()` not `page()/byId()`, cross-entity invalidation of exercises.page())

### Detailed Migration Examples

**Exercises (standard CRUD)**:

```ts
const exerciseHooks = createCrudHooks<
  AdminExercisesPageData,
  Exercise,
  CreateExerciseData,
  UpdateExerciseData
>({
  entityName: "Exercise",
  keys: adminKeys.exercises,
  api: {
    getPageData: api.exercises.getPageData,
    getById: api.exercises.getById,
    create: api.exercises.create,
    update: api.exercises.update,
    delete: api.exercises.delete,
  },
  redirectTo: "/exercises",
});
export const useExercisesPageData = exerciseHooks.usePageData;
export const useExercise = exerciseHooks.useById;
export const useCreateExercise = exerciseHooks.useCreate;
export const useUpdateExercise = exerciseHooks.useUpdate;
export const useDeleteExercise = exerciseHooks.useDelete;
```

**Reviews (CRUD + manual toggle)**:

```ts
const reviewHooks = createCrudHooks<AdminReviewsPageData, Review, Partial<Review>, Partial<Review>>({...});
// re-export usePageData, useById, useCreate, useUpdate, useDelete
// + manual useToggleReviewActive (stays as-is)
```

**Blog (CRUD + 2 manual toggles)**:

```ts
const blogHooks = createCrudHooks<AdminBlogPageData, BlogPost, CreateBlogPostData, UpdateBlogPostData>({...});
// re-export usePageData, useById, useCreate, useUpdate, useDelete
// + manual useToggleBlogPost, useToggleBlogFeatured (stay as-is)
```

**Contacts (partial factory — no create, custom update)**:

```ts
const contactHooks = createCrudHooks<AdminContactsPageData, GetContactByIdResponse>({
  api: { getPageData, getById, delete: api.contacts.delete }, // no create, no update
  ...
});
// re-export usePageData, useById, useDelete from factory
// + manual useUpdateContact with optional onSuccess callback (stays as-is)
```

**Users (minimal factory — pageData + byId only)**:

```ts
const userHooks = createCrudHooks<GetUsersPageDataResponse, AdminUser>({
  api: { getPageData, getById }, // no create, update, delete
  ...
});
// re-export usePageData, useById from factory
// + manual useUpdateUserRole (stays as-is)
```

**Verify**: `pnpm check-types` after each module.

---

## Phase 3: Migrate Route Handlers (~470 lines saved)

Rewrite each standard route.ts to use helpers. Each 15-45 line handler becomes 3-6 lines.

**22 files to migrate** (6 modules × ~3-4 route files each):

| Module              | route.ts | [id]/route.ts  | [id]/toggle/route.ts | page-data/route.ts |
| ------------------- | -------- | -------------- | -------------------- | ------------------ |
| exercises           | GET+POST | GET+PUT+DELETE | —                    | GET                |
| reviews             | GET+POST | GET+PUT+DELETE | PATCH                | GET                |
| products            | GET+POST | GET+PUT+DELETE | PATCH                | GET                |
| contacts            | GET      | GET+PUT+DELETE | —                    | GET                |
| users               | GET      | GET+PUT        | —                    | GET                |
| exercise-categories | GET+POST | GET+PUT+DELETE | —                    | —                  |
| blog                | GET+POST | GET+PUT+DELETE | — (manual)           | GET                |

**7 files stay manual** (unique behavior):

- `blog/[id]/toggle/route.ts` — reads `field` query param to dispatch to toggleBlogPostStatus vs toggleBlogPostFeatured
- `products/stats/route.ts` — unique endpoint
- `pages/[slug]/route.ts`, `pages/[slug]/sections/route.ts` — uses slug param, not id
- `dashboard/route.ts` — unique
- `upload/image/route.ts` — multipart form
- `auth/[...nextauth]/route.ts` — NextAuth

### Example Migration

**Before** (`exercises/route.ts` — 29 lines):

```ts
import { NextResponse } from "next/server";
import { adminExercisesApi } from "@repo/api-server";
import { createExerciseRequestSchema, getExercisesResponseSchema } from "@repo/contracts/exercise";
import { handleApiError } from "@repo/errors";

export async function GET() {
  try {
    const data = await adminExercisesApi.getAll();
    const validated = getExercisesResponseSchema.parse(data);
    return NextResponse.json(validated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = createExerciseRequestSchema.parse(body);
    const result = await adminExercisesApi.create(data);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

**After** (6 lines):

```ts
import { adminExercisesApi } from "@repo/api-server";
import { createExerciseRequestSchema, getExercisesResponseSchema } from "@repo/contracts/exercise";
import { createGetHandler, createPostHandler } from "@app/lib/route-helpers";

export const GET = createGetHandler(adminExercisesApi.getAll, getExercisesResponseSchema);
export const POST = createPostHandler(adminExercisesApi.create, createExerciseRequestSchema);
```

**Verify**: `pnpm check-types` after each module.

---

## Phase 4: Migrate List Views (~95 lines saved)

Replace each per-module list view with AdminListView wrapper.

Files (7 total):

- `modules/blog/views/blog-list-view.tsx` (flat file — note: not in subdirectory)
- `modules/products/views/products-list-view/index.tsx`
- `modules/contacts/views/contacts-list-view/index.tsx`
- `modules/exercises/views/exercises-list-view/index.tsx`
- `modules/reviews/views/reviews-list-view/index.tsx`
- `modules/users/views/users-list-view/index.tsx`
- `modules/pages/views/pages-list-view/index.tsx`

### Example Migration

**Before** (34 lines):

```tsx
export const ExercisesListView = ({ initialData }: ExercisesListViewProps) => {
  const { data, isLoading, error } = useExercisesPageData({ initialData });
  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={data}
      loadingMessage="Loading exercises..."
    >
      {(data) => (
        <Container maxWidth="xl" sx={{ py: 4 }}>
          <ExercisesListSection exercises={data.exercises} categories={data.categories} />
        </Container>
      )}
    </QueryWrapper>
  );
};
```

**After** (18 lines):

```tsx
export const ExercisesListView = ({ initialData }: ExercisesListViewProps) => (
  <AdminListView
    queryResult={useExercisesPageData({ initialData })}
    loadingMessage="Loading exercises..."
  >
    {(data) => <ExercisesListSection exercises={data.exercises} categories={data.categories} />}
  </AdminListView>
);
```

**Verify**: `pnpm check-types` after all views migrated.

---

## Phase 5: Apply useDeleteConfirmation + Fix Query Keys (~50 lines saved)

### 5.1 Apply useDeleteConfirmation in list sections (5 files):

- `blog/sections/blog-list-section/index.tsx`
- `products/sections/products-list-section/index.tsx`
- `contacts/sections/contacts-list-section/index.tsx`
- `exercises/sections/exercises-list-section/index.tsx`
- `reviews/sections/reviews-list-section/index.tsx`

**Before** (15 lines per section):

```ts
const { mutate: deleteX, isPending: isDeleting } = useDeleteX();
const [deleteId, setDeleteId] = useState<string | null>(null);
const handleDeleteConfirm = () => { if (deleteId) { deleteX(deleteId, { onSuccess: () => setDeleteId(null) }); } };
// in JSX:
onClick={() => setDeleteId(item.id)}
<ConfirmationModal open={!!deleteId} onClose={() => setDeleteId(null)} isConfirming={isDeleting} onConfirm={handleDeleteConfirm} />
```

**After** (5 lines per section):

```ts
const deleteMutation = useDeleteX();
const { deleteId, requestDelete, cancelDelete, confirmDelete, isDeleting } = useDeleteConfirmation({ deleteMutation });
// in JSX:
onClick={() => requestDelete(item.id)}
<ConfirmationModal open={!!deleteId} onClose={cancelDelete} isConfirming={isDeleting} onConfirm={confirmDelete} />
```

### 5.2 Fix query key inconsistencies:

**`packages/query/src/keys/admin.ts`**:

```ts
// Before:
pages: {
  all: ["admin", "pages"] as const,  // NOT a function, hardcodes root
  list: () => [...adminKeys.pages.all, "list"] as const,
  bySlug: (slug: string) => [...adminKeys.pages.all, slug] as const,
}

// After:
pages: {
  all: () => [...adminKeys.root, "pages"] as const,
  list: () => [...adminKeys.pages.all(), "list"] as const,
  bySlug: (slug: string) => [...adminKeys.pages.all(), slug] as const,
}
```

**`packages/query/src/keys/marketing.ts`**:

```ts
// Before:
payments: {
  all: (): QueryKey => ["marketing", "payments"],  // hardcodes root
  order: (orderId: string): QueryKey => ["marketing", "payments", "order", orderId],
}

// After:
payments: {
  all: (): QueryKey => [...marketingKeys.root, "payments"],
  order: (orderId: string): QueryKey => [...marketingKeys.root, "payments", "order", orderId],
}
```

Must update all call sites referencing `adminKeys.pages.all` → `adminKeys.pages.all()`.

**Verify**: `pnpm check-types && pnpm lint && pnpm build`

---

## Summary Table

| Area                               | Lines Before | Lines After | Saved    |
| ---------------------------------- | ------------ | ----------- | -------- |
| Hook files (6 CRUD modules)        | ~500         | ~180        | ~320     |
| Route handlers (22 standard files) | ~650         | ~180        | ~470     |
| List views (7 files)               | ~225         | ~130        | ~95      |
| Delete confirmation (5 sections)   | ~75          | ~25         | ~50      |
| New utility files                  | 0            | ~150        | -150     |
| **Net total**                      |              |             | **~785** |

## Risks and Mitigations

1. **Type inference through generics**: Factory relies on TypeScript generics. Mitigation: explicit generic params at each call site.
2. **Export name stability**: Migrated files must export exact same names. Mitigation: re-export from factory output with original names.
3. **Contacts special case**: useUpdateContact has onSuccess callback param not supported by factory. Mitigation: keep as manual hook.
4. **Users special case**: useUpdateUserRole is not standard CRUD. Mitigation: keep as manual hook.
5. **Blog toggle special case**: Two toggles dispatched by query param. Mitigation: route handler stays manual.
6. **ExerciseCategories**: Different key shape (all() not page()/byId()), cross-entity invalidation. Mitigation: stays fully manual.

## Verification

After all phases complete:

```bash
pnpm check-types    # TypeScript validation
pnpm lint           # ESLint
pnpm build          # Full production build
```
