# Step 5 — Plan-detail shell (calendar viewport)

> You are an **executor** session in the training-domain integration workflow. This prompt is self-contained: execute it via **`/feature`** (full pipeline — this is a multi-package, ~30-file, new-contract-entity, shared-package change; not `/feature small`). Read `implementation/WORKFLOW.md` first for the durable rules. Write `implementation/step-05/output.md` when done, per the format at the bottom.

---

## 0. Hard triggers — STOP and surface to the user

This is the **4th attempt** at this domain; the prior three were deleted. If, while reading the codebase, you encounter any trace of a prior implementation — vocabulary like `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — **STOP and surface to the user**. Do not consume it as a reference. The only legitimate model source is `analysis/artifacts/` + the live Prisma schema.

If you hit a **prompt-vs-codebase conflict** (this prompt says X, the codebase clearly does Y) or a **domain-model limitation** (the model in `analysis/` can't express what the step needs): **STOP, state the conflict with a hypothesis ("the codebase does Y; I think the prompt is wrong because…; right?"), and wait.** Do not silently comply with a wrong prompt; do not silently bend the model. The planner owns prompt errors and answers fast.

---

## 1. What this step is

First real training-domain surface in `apps/platform`. The route `apps/platform/src/app/coach/plans/[planId]/page.tsx` and the module `apps/platform/src/modules/plan-detail/` already exist, but `PlanDetailView` is a `"Coming soon"` stub. This step builds it out into a **calendar viewport** over a training plan's weeks.

**The governing model is D6 (ratified — see `implementation/PLANNING_STATE.md` § "Decisions accepted"):**

- A **`Week` is a lazily-materialized calendar slot**, not a coach-managed entity. The coach does **not** "add" or "remove" weeks. There is **no** "add week" / "remove week" / "add first week" UI.
- The plan-detail page is a **calendar viewport**: the coach navigates the calendar axis week-by-week (prev / next / jump-to-date / today). The **week is the viewport unit** — no free calendar scroll.
- A `Week` DB row materializes **lazily** — it comes into existence via `upsert` on `(planId, startDate)` only when the first `Day` is created in it (a Step 6 concern, not this step) or the first per-week note is saved. Navigating past empty weeks creates nothing. An empty slot = simply no `Week` row; that is the **normal** state, not an error.
- Weeks are addressed by **`(planId, startDate)`**, never by `weekId` — the client computes the viewport's Monday `startDate`; the row may not exist yet.
- Plan-detail body layout: **7 full-width day rows** (Mon–Sun), not 7 columns. A Day is a nested document (Session→Block→Schema→SchemaRow in later steps), not a calendar event. Today's date gets a "Thu 14" row-label with the day-of-month number in a bright circle.

**Where it sits:** Steps 1-4 shipped the schema + 34 seeded archetypes + admin Exercise/Label CRUDs. Step 5 is the plan-detail **shell** — navigation skeleton + the `Week` API slice. Day/Session/Block content is Steps 6-10. Do **not** build day/session/block editing here; the 7 day rows render empty placeholders that later steps plug into.

**Branch:** `feat/training-domain` (single long-lived branch). Per-layer conventional-commits, all-lowercase subjects, body lines ≤150 chars. Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — if a hook fails, fix the root cause.

**No Prisma schema change.** The `Week` model already exists (`packages/api-server/prisma/schema.prisma` lines 598-612). No `db:reset`, no seed change (an empty plan with zero `Week` rows is exactly the state the smoke-test needs). Do **not** touch `analysis/artifacts/` — the one needed prose clarification (`05-synthesis/domain-model.md §1.0`) was already applied by the planner this session.

---

## 2. Read these first (verbatim — do not skim)

**Domain model:**

- `analysis/artifacts/05-synthesis/domain-model.md` §1.0 (Week — just clarified to the calendar-slot framing).
- `analysis/artifacts/06-formalization/er-final.md` §5 #10 (Week invariants), §4 (cardinality).
- `packages/api-server/prisma/schema.prisma` lines 598-631 (`Week`, `Day` models).

**Backend vertical-slice template — `plan-enrollment` (a child resource nested under a training plan; mirror its STRUCTURE, not its verb set):**

- Contracts: `packages/contracts/src/entities/lms/plan-enrollment/` — `plan-enrollment.schema.ts` (note `boardedAt: z.coerce.date()` line 12,22 — the `@db.Date` convention), `plan-enrollment-api.schema.ts` (param + response schema composition, lines 9-34), `plan-enrollment.types.ts`, `plan-enrollment-api.types.ts`, `plan-enrollment.constants.ts`, `index.ts`, `plan-enrollment-api.schema.test.ts`.
- Constants shape: `packages/contracts/src/entities/lms/training-plan/training-plan.constants.ts` lines 1-4 (`MAX_*_LENGTH`).
- Registration: `packages/contracts/src/entities/lms/index.ts` (lines 1-2), `packages/contracts/package.json` exports map (lines 8-34 — note the **explicit** `./lms/*` entries at 19-21; there is **no wildcard**).
- api-server handler: `packages/api-server/src/endpoints/lms/plan-enrollment/admin.ts` (the `lmsPlanEnrollmentApi` object, lines 143-283 — `verifyPlanOwnership` first in every method; `handlePrismaError` in catch). Simpler `prisma.create` reference: `packages/api-server/src/endpoints/lms/training-plan/training-plan.ts` `create` lines 133-147.
- Guards: `packages/api-server/src/authz/guards.ts` — `verifyPlanOwnership` (lines 70-97, returns `{ status }`, throws `NotFoundError` / `ForbiddenError`), `verifyPlanEditable` (lines 99-103, throws `ForbiddenError` on `ARCHIVED`).
- Mapper: `packages/api-server/src/mappers/lms/training-plan.mapper.ts` (lines 1-15 — plain field copy; closest template since `Week` has no enum columns), `mappers/lms/index.ts` (lines 1-3).
- api-server registration: `packages/api-server/src/endpoints/lms/index.ts` (lines 1-2), `endpoints/lms/plan-enrollment/index.ts` (line 1). `@repo/api-server/lms` resolves to `endpoints/lms/index.ts` — single entry, no `package.json` change needed.
- api-server integration test: `packages/api-server/src/endpoints/lms/plan-enrollment/admin.test.ts` (full file — `cleanupRaw` / `createTestCoach` / `createTestUser` helpers from `../../../test/helpers`, `beforeAll`/`afterAll` plan setup, ownership-rejection assertions).
- api routes: `apps/platform/src/app/api/platform/training-plans/[planId]/enrollments/route.ts` (GET-with-query + POST, lines 1-46), `.../enrollments/[enrollmentId]/route.ts` (GET-by-param + DELETE, lines 1-36), `training-plans/[planId]/route.ts` (PUT-by-param via `createAuthPutByParamHandler`, lines 31-41).
- Route factories: `packages/api-routes/src/index.ts` lines 30-56 (`createAuthGetByParamHandler`, `createAuthPutByParamHandler`, `withAuthRateLimit`, `RATE_LIMIT_TIER`).
- Auth wrapper: `apps/platform/src/lib/server/auth.ts` (lines 1-7 — `withCoachAuth`).

**Frontend templates:**

- Platform client API: `apps/platform/src/lib/api/endpoints/training-plans.ts` (lines 1-32), `endpoints/index.ts`, `api/index.ts` (lines 1-16), `api/keys.ts` (lines 1-19 — note `users.search` is a hand-written key factory, not `createEntityKeys`).
- Platform hooks: `apps/platform/src/lib/hooks/use-training-plans.ts` (the `useStatusMutation` raw-`useMutation` + `toast` + `notifyError` pattern, lines 65-110; `useTrainingPlan = trainingPlanHooks.useById` line 39), `hooks/index.ts`.
- Module conventions: `apps/platform/src/modules/plans/` (`views/plans-view.tsx` — `QueryWrapper` render-prop; `sections/plans-list-section.tsx` lines 36-58 — the URL-searchParams state pattern), `apps/platform/src/modules/athletes/components/athlete-detail-drawer/` (a detail surface composed of section-components living under `components/`, no `sections/` dir — this is the layout precedent for `plan-detail`).
- Routing: `apps/platform/src/app/coach/plans/[planId]/page.tsx` (already renders `<PlanDetailView planId={planId} />`), `coach/layout.tsx`.
- `@repo/shared` date helpers: `packages/shared/src/helpers/date-calendar.ts` — `getMonday` (8), `addDays` (15), `isSameDay` (18), `getWeekDays` (23), `getISOWeekNumber` (26), `formatDateParam` (36 → `"2026-05-18"`), `parseDateParam` (46 → `Date | null`, strict), `formatDayName` (77 → `"Thu"`), `formatWeekRange` (80 → `"May 18 – May 24, 2026"`). All re-exported from `@repo/shared`.
- `PageHeader`: `packages/ui/src/components/page-header.tsx` (lines 1-29), `packages/ui/src/components/index.ts`.
- `createCrudHooks`: `packages/query/src/hooks/create-crud-hooks.ts` (`useCreate` `onSuccess` → `navigate(config.redirectTo)`, lines 92-116).
- `CreatePlanDialog`: `apps/platform/src/modules/plans/components/create-plan-dialog.tsx` (lines 1-73).

**Codebase rules that bit prior steps — honor them:**

- Existing project patterns are sacred. No "TS best-practice" instincts that diverge from what the files above show. If this prompt and the codebase disagree, the codebase wins — escalate per §0.
- One React component per file (`react/no-multi-comp`).
- No colors as hex literals outside the MUI theme palette.
- No code comments unless they encode a non-obvious _why_ (single line).
- `contracts` must not import from `@prisma/client` (dependency-cruiser `contracts-no-prisma`). `Week` has no enum columns, so this does not bite here — but do not introduce a Prisma import into `contracts`.

---

## 3. Scope

Four phases + one isolated tweak. Every file's handling is described **exactly once** below.

### Phase 0 — `Week` contract + API slice (read + notes-upsert only)

**Contracts** — new dir `packages/contracts/src/entities/lms/week/`:

- `week.constants.ts` — `export const WEEK_CONSTANTS = { MAX_NOTES_LENGTH: 2000 } as const;` (mirrors `TRAINING_PLAN_CONSTANTS`; 2000 matches the plan-description cap).
- `week.schema.ts`:
  - `weekSchema = z.object({ id: cuid, planId: cuid, startDate: z.coerce.date(), notes: z.string().nullable(), createdAt: z.date(), updatedAt: z.date() })`. `startDate` uses `z.coerce.date()` per the `@db.Date` convention (see `plan-enrollment.schema.ts:12`).
  - `updateWeekNotesSchema = z.object({ notes: z.string().max(WEEK_CONSTANTS.MAX_NOTES_LENGTH).nullable() })`. `notes` is `.nullable()` (not optional) — the PUT always carries the field; `null` clears it.
- `week-api.schema.ts`:
  - `weekByPlanAndDateParamsSchema = z.object({ planId: z.string().cuid(), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })` — note `startDate` here is the **route path segment** (a `YYYY-MM-DD` string), distinct from the entity field (a `Date`). The api-server method parses + Monday-snaps it.
  - `getWeekResponseSchema = z.object({ week: weekSchema.nullable() })` — `week: null` means an unmaterialized slot. This is a **200, not a 404**.
  - `updateWeekNotesRequestSchema = updateWeekNotesSchema`.
  - `updateWeekNotesResponseSchema = weekSchema` (the upserted Week — always non-null).
- `week.types.ts` — `Week` (z.infer of `weekSchema`), `UpdateWeekNotesData` (z.infer of `updateWeekNotesSchema`).
- `week-api.types.ts` — `WeekByPlanAndDateParams`, `GetWeekResponse`, `UpdateWeekNotesRequest`, `UpdateWeekNotesResponse`.
- `index.ts` — barrel: constants, schema, types, api-schema, api-types.
- **Register:** `packages/contracts/src/entities/lms/index.ts` → add `export * from "./week";`.
- **Register:** `packages/contracts/package.json` `exports` → add `"./lms/week": "./src/entities/lms/week/index.ts"` (place it alphabetically, after `./lms/training-plan`). This export map has no wildcard; the entry is required or `@repo/contracts/lms/week` will not resolve.
- `week-api.schema.test.ts` — mirror `plan-enrollment-api.schema.test.ts`: assert `weekSchema.startDate` coerces a `"YYYY-MM-DD"` string to `Date` and accepts a `Date`; assert `updateWeekNotesSchema` accepts a string and `null`, and rejects a string over `MAX_NOTES_LENGTH`.

**api-server** — new dir `packages/api-server/src/endpoints/lms/week/`:

- `admin.ts` — `export const lmsWeekApi = { ... }`:
  - A local helper `parseStartDate(param: string): Date` — `parseDateParam` from `@repo/shared`; if it returns `null`, throw `BadRequestError` (`@repo/errors`). Then the caller applies `getMonday` to snap to the week's Monday.
  - `getByPlanAndDate(userId: string, planId: string, startDateParam: string): Promise<Week | null>` — `await verifyPlanOwnership(planId, userId)` (read is allowed on archived plans — do **not** call `verifyPlanEditable` here). Compute `startDate = getMonday(parseStartDate(startDateParam))`. `prisma.week.findUnique({ where: { planId_startDate: { planId, startDate } } })`. Return `week ? mapToWeek(week) : null`. Returning `null` for a missing row is correct — **do not throw `NotFoundError`**; an unmaterialized slot is the normal state.
  - `upsertNotes(userId: string, planId: string, startDateParam: string, data: UpdateWeekNotesData): Promise<Week>` — `const plan = await verifyPlanOwnership(planId, userId)`, then `verifyPlanEditable(plan)` (no notes edits on `ARCHIVED` plans). Compute `startDate` as above. `prisma.week.upsert({ where: { planId_startDate: { planId, startDate } }, create: { planId, startDate, notes: data.notes }, update: { notes: data.notes } })`. Wrap in try/catch → `handlePrismaError(error, { entity: "Week" })`. Return `mapToWeek(...)`.
- `index.ts` — `export * from "./admin";`.
- **Register:** `packages/api-server/src/endpoints/lms/index.ts` → add `export * from "./week";`.
- `admin.test.ts` — integration test mirroring `plan-enrollment/admin.test.ts` structure (`cleanupRaw`, `createTestCoach`, `beforeAll`/`afterAll` with an active + an archived plan owned by the coach). Cover: ownership rejection (`ForbiddenError` for a non-owner non-admin); `getByPlanAndDate` returns `null` (does not throw) for an unmaterialized slot; `upsertNotes` creates the row on first call then updates it on the second (idempotent upsert, same `(planId, startDate)`); `upsertNotes` throws `ForbiddenError` on an `ARCHIVED` plan; passing a non-Monday date (e.g. a Wednesday) keys the row at that week's Monday (`getMonday` snap).

**mapper** — `packages/api-server/src/mappers/lms/week.mapper.ts`:

- `mapToWeek(w: PrismaWeek): Week` — plain field copy (`id, planId, startDate, notes, createdAt, updatedAt`). No enum maps (`Week` has none). Mirror `training-plan.mapper.ts`.
- **Register:** `packages/api-server/src/mappers/lms/index.ts` → add `export * from "./week.mapper";`.

**api routes** — new file `apps/platform/src/app/api/platform/training-plans/[planId]/weeks/[startDate]/route.ts`:

- `GET` — `withCoachAuth(withAuthRateLimit(createAuthGetByParamHandler(handler, weekByPlanAndDateParamsSchema, getWeekResponseSchema), RATE_LIMIT_TIER.API))`. The handler: `async (userId, { planId, startDate }) => ({ week: await lmsWeekApi.getByPlanAndDate(userId, planId, startDate) })` — the route wraps the `Week | null` into `{ week }`, exactly as the enrollments list route wraps an array into `{ enrollments }`.
- `PUT` — `withCoachAuth(withAuthRateLimit(createAuthPutByParamHandler(handler, weekByPlanAndDateParamsSchema, updateWeekNotesRequestSchema, updateWeekNotesResponseSchema), RATE_LIMIT_TIER.API))`. The handler: `(userId, { planId, startDate }, data) => lmsWeekApi.upsertNotes(userId, planId, startDate, data)`.
- **No `POST`, no `DELETE`.** There is no create-week or delete-week endpoint (D6). There is **no** `GET .../weeks` list endpoint — out of scope (the viewport computes `startDate` itself).

### Phase 1 — platform query / hook layer

- `apps/platform/src/lib/api/endpoints/weeks.ts` — `createWeeksAPI(client: ApiClient)` with `getByDate(planId, startDate): Promise<GetWeekResponse>` and `updateNotes(planId, startDate, data): Promise<Week>`, both hitting `/api/platform/training-plans/${planId}/weeks/${startDate}` (GET / PUT). Mirror `endpoints/training-plans.ts`.
- **Register:** `lib/api/endpoints/index.ts` → `export { createWeeksAPI } from "./weeks";`. `lib/api/index.ts` `createApi` → add `weeks: endpoints.createWeeksAPI(client)`.
- `lib/api/keys.ts` — add `weeks: { byDate: (planId: string, startDate: string) => [...ROOT, "training-plans", planId, "weeks", startDate] as const }` (nests the cache key under the plan).
- `apps/platform/src/lib/hooks/use-weeks.ts` (`"use client"`):
  - `useWeek(planId: string, startDate: string)` — `useQuery({ queryKey: platformKeys.weeks.byDate(planId, startDate), queryFn: () => api.weeks.getByDate(planId, startDate), enabled: !!planId && !!startDate })`. Returns `{ data: GetWeekResponse, ... }` i.e. `data.week` is `Week | null`.
  - `useUpdateWeekNotes(planId: string)` — raw `useMutation` mirroring the `useStatusMutation` pattern in `use-training-plans.ts`: `mutationFn: ({ startDate, data }: { startDate: string; data: UpdateWeekNotesData }) => api.weeks.updateNotes(planId, startDate, data)`; `onSuccess: (week)` → `queryClient.setQueryData(platformKeys.weeks.byDate(planId, formatDateParam(week.startDate)), { week })` + `toast.success("Week notes saved")`; `onError` → `notifyError(error, "Failed to save week notes")`.
- **Register:** `lib/hooks/index.ts` → `export * from "./use-weeks";`.

### Phase 2 — `@repo/ui`: `InlineEditText` primitive + `PageHeader` extension

This is a **shared-package** change (`@repo/ui` is consumed by admin / marketing / platform). It **must be strictly additive** — the three existing `PageHeader` call sites (`plans-view.tsx`, `athletes-view.tsx`, `coach/profile/page.tsx`) pass only `title` + optional `actions` and **must be unaffected**. A monorepo search confirmed **no** existing inline-edit / editable-text / save-on-blur primitive — you are building it.

- New `packages/ui/src/components/inline-edit-text.tsx` — exports exactly one component `InlineEditText`:
  - Props: `value: string`, `onCommit: (next: string) => void`, `variant: TypographyVariant`, `ariaLabel: string`, `placeholder?: string`, `multiline?: boolean`, `emptyIsValid?: boolean` (default `false`).
  - Display mode: a clickable `Typography variant={variant}` showing `value` (or `placeholder` when `value` is empty). Click → edit mode.
  - Edit mode: a `TextField` (`variant` matched visually; `autoFocus`; local state seeded from `value`; `multiline` when `multiline`). Commit on **blur** and on **Enter** (Enter only when `!multiline`). **Escape** cancels and reverts.
  - Commit logic: trim the local value. If it equals the original `value` → no `onCommit` call (no no-op writes). If trimmed is empty and `!emptyIsValid` → revert, no commit. Otherwise `onCommit(trimmed)`. Always exit edit mode after.
- `packages/ui/src/components/inline-edit-text.test.tsx` — `@repo/ui` has component-test infrastructure (`packages/ui/vitest.config.ts`, `packages/ui/src/test/render.tsx`, existing tests e.g. `empty-state/empty-state.test.tsx`). Add a test using that setup: click toggles display→edit; commit fires on blur and on Enter (non-multiline); Escape reverts without committing; no `onCommit` when the value is unchanged; empty value reverts (no commit) when `emptyIsValid` is false and commits when it is true.
- `packages/ui/src/components/page-header.tsx` — extend `PageHeaderProps` additively: add optional `description?: string`, `editable?: boolean`, `onTitleCommit?: (next: string) => void`, `onDescriptionCommit?: (next: string) => void`.
  - `editable` falsy (default): render as today; if `description` is provided, render it as a `Typography variant="body2"` line under the title (still additive — existing call sites pass no `description`).
  - `editable` truthy: render the title via `<InlineEditText variant="h3" emptyIsValid={false} value={title} onCommit={onTitleCommit} ariaLabel="Plan name" />` and the description via `<InlineEditText variant="body2" multiline emptyIsValid value={description ?? ""} onCommit={onDescriptionCommit} ariaLabel="Plan description" placeholder="Add a description…" />`.
- **Register:** `packages/ui/src/components/index.ts` → `export * from "./inline-edit-text";`.

### Phase 3 — `plan-detail` module build-out

Replace the stub. Module layout follows the `athlete-detail-drawer` precedent — a detail surface composed of section-components under `components/`, plus `views/` and barrels. **One component per file.**

- `apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx` — `PlanDetailView({ planId }: { planId: string })`:
  - `useTrainingPlan(planId)` for the plan shell; wrap the plan-dependent render in `QueryWrapper` (mirror `plans-view.tsx`).
  - URL state: read `?week=` via `useSearchParams`; the active Monday is `parseDateParam(searchParams.get("week"))` snapped with `getMonday` if valid, else `getMonday(new Date())`. Changing the active week pushes `?week=${formatDateParam(monday)}` via `useRouter`/`usePathname` with `{ scroll: false }` — mirror the URL-state pattern in `plans-list-section.tsx:36-58`.
  - `useWeek(planId, formatDateParam(activeMonday))` for the viewport week (`data.week` is `Week | null`).
  - Renders: a `PageHeader` with `editable`, `title={plan.name}`, `description={plan.description ?? undefined}`, `backHref="/coach/plans"`, `actions={<PlanStatusChip status={plan.status} />}`, `onTitleCommit` / `onDescriptionCommit` wired to `useUpdateTrainingPlan` (see below); then `WeekNavigator`, `WeekNotes`, `WeekGrid`.
  - `onTitleCommit`: call `useUpdateTrainingPlan().mutate({ id: planId, data: { name: next } })`. `onDescriptionCommit`: `mutate({ id: planId, data: { description: next === "" ? null : next } })` — empty description maps to `null` (the contract's `description` is nullable; `InlineEditText` deals only in strings, the view maps empty→null here).
- `apps/platform/src/modules/plan-detail/components/week-navigator.tsx` — `WeekNavigator({ monday, onChange }: { monday: Date; onChange: (next: Date) => void })`:
  - Prev / next `IconButton`s → `onChange(addDays(monday, -7))` / `onChange(addDays(monday, 7))`.
  - Week label: `formatWeekRange(monday)` plus the ISO week number from `getISOWeekNumber(monday)` (e.g. `"May 18 – May 24, 2026 · W21"`).
  - A "Today" button → `onChange(getMonday(new Date()))`.
  - A jump-to-date control: a MUI `TextField type="date"` (the repo has no date-picker library — do not add one); its value is `formatDateParam(monday)`; on change, `parseDateParam` the input and `onChange(getMonday(parsed))` when valid.
- `apps/platform/src/modules/plan-detail/components/week-grid.tsx` — `WeekGrid({ monday }: { monday: Date })`: renders the 7 rows from `getWeekDays(monday)`, each as a `DayRow`. Full-width vertical stack.
- `apps/platform/src/modules/plan-detail/components/day-row.tsx` — `DayRow({ date }: { date: Date })`: a full-width row. Left: the day label — `formatDayName(date)` (`"Thu"`) followed by `date.getDate()` (`14`); when `isSameDay(date, new Date())`, render the day-of-month number inside a small filled circle using `theme.palette.primary` (no hex literals). Body: an empty placeholder (e.g. a muted `"No sessions"` `Typography`) — this is the seam Step 6 plugs day/session content into; do **not** build session editing here.
- `apps/platform/src/modules/plan-detail/components/week-notes.tsx` — `WeekNotes({ planId, monday, notes }: { planId: string; monday: Date; notes: string | null })`: shows the per-week note near the navigator; inline-edit via `<InlineEditText variant="body2" multiline emptyIsValid value={notes ?? ""} ... />`; on commit, `useUpdateWeekNotes(planId).mutate({ startDate: formatDateParam(monday), data: { notes: next === "" ? null : next } })`.
- Barrels: `components/index.ts`, `views/index.ts`, and `index.ts` (`export { PlanDetailView } from "./views";`) — match the existing `plan-detail` barrels and the `plans` module.

### OQ-D — create-plan redirect lands the coach in the new plan

- `apps/platform/src/lib/hooks/use-training-plans.ts` — remove the `redirectTo: "/coach/plans"` line from the `createCrudHooks` config. First grep-confirm `useCreateTrainingPlan` has exactly one consumer (`CreatePlanDialog`); the `createCrudHooks` `useUpdate` is not exported/used (the custom `useUpdateTrainingPlan` is), so removing `redirectTo` affects only `useCreate`. Leave `useNavigate` in the config as-is. (If grep finds an unexpected second consumer of `useCreateTrainingPlan`, STOP and surface per §0.)
- `apps/platform/src/modules/plans/components/create-plan-dialog.tsx` — add `useRouter` from `next/navigation`; change the `create.mutate` call's `onSuccess` to `(plan) => { handleClose(); router.push(\`/coach/plans/${plan.id}\`); }`. Net effect: creating a plan now lands the coach in the new plan's detail page (current calendar week) instead of bouncing to the list. No double-navigation, because the hook no longer redirects.

---

## 4. Out of scope — do NOT build

- Any day / session / block / schema / schema-row editing. The 7 day rows are empty placeholders.
- "Add week" / "remove week" / "delete week" UI or endpoints. Week rows materialize lazily (D6); the only write in this step is the notes upsert.
- A `GET .../weeks` list endpoint, a week-overview strip, month/day views, free calendar scroll.
- Week-row creation as a side effect of `Day` creation — that is Step 6.
- Any Prisma schema change, `db:reset`, seed change, or `analysis/artifacts/` edit.
- Athlete-facing surfaces.

---

## 5. Acceptance criteria

- `pnpm check-types`, `pnpm lint`, `pnpm dep:check` green across every affected workspace.
- `pnpm test` green, including the new `week-api.schema.test.ts` (contracts), `week/admin.test.ts` (api-server), and `inline-edit-text.test.tsx` (`@repo/ui`). No regression in the existing suite.
- No `as any` / `as unknown` / unjustified `!`. No hex color literals outside the theme. No code comments except a single-line non-obvious _why_.
- The three pre-existing `PageHeader` call sites compile and render unchanged.
- Coach logs in (`coach@thedisciplineprogram.com` / `password12345`) → `/coach/plans` → opens a seeded plan → lands on a real plan-detail showing the **current calendar week** as 7 day rows (not `"Coming soon"`).
- Prev / next moves the viewport ±1 week; "Today" returns to the current week; the date input jumps to the picked week's Monday. The active week is reflected in `?week=` and survives a refresh.
- All 7 rows render Mon–Sun; today's row shows the day-of-month in a highlighted circle. Empty weeks render identically whether or not other weeks have content — there is no special "empty plan" state.
- Editing the week note on an otherwise-empty week persists it (materializes the `Week` row via upsert); navigating away and back shows the note. Clearing it writes `null`.
- Editing the plan title or description inline in the header persists via `useUpdateTrainingPlan`; an empty title reverts (does not save); an empty description saves as `null`.
- Creating a plan from `/coach/plans` lands the coach in `/coach/plans/<newId>` on the current week.
- A browser smoke-test scenario is documented in `output.md` (see below). Run `/feature`'s own type-check / lint / test gates; you cannot self-run the browser scenario — leave that for the user.

---

## 6. `output.md` — write `implementation/step-05/output.md`

Sections (Russian prose where natural, English for code/paths): `## Что сделано` · `## Изменённые/созданные файлы` · `## Принятые решения` · `## Возникшие вопросы и как решены` · `## Что отложено` · `` ## Ссылка на `.feature-dev/<ts>/` `` · `## Сценарий смоук-теста` · `## Verification notes` · `## Acceptance criteria self-check`.

**Smoke-test scenario** must contain: preconditions (which seed; that no `db:reset` was needed; coach credentials); numbered user steps; expected result after each step; how to roll back state (e.g. delete the materialized `Week` rows + the test-created plan). "Open the screen and try it" is not a valid scenario. Cover: the calendar viewport (prev/next/today/jump, `?week=` persistence across refresh), the 7-row layout with the today highlight, week-notes materialization, inline title/description edit (including the empty-title revert), and the create-plan→land-in-plan flow.

---

## 7. Commits

Per-layer conventional-commits on `feat/training-domain`, all-lowercase subjects, body lines ≤150 chars. Suggested layering: (1) contracts (`week` slice + exports + test), (2) api-server (`lmsWeekApi` + mapper + registrations + test), (3) platform api routes, (4) platform endpoints/keys/hooks, (5) `@repo/ui` (`InlineEditText` + `PageHeader` extension), (6) `plan-detail` module, (7) create-plan redirect tweak. Never bypass hooks; fix root causes.
