# Step 6.1 — `lmsSessionApi` + `endpoints/lms/_shared/date.ts` extraction

> You are an **executor** session in the training-domain integration workflow. This prompt is self-contained: execute it via **`/feature`** (full pipeline — new endpoint, new mapper, new guard, new shared util module, refactor of one existing module, ~10 source files + 2 test files; not `/feature small`). Read `implementation/WORKFLOW.md` first for the durable rules. Write `implementation/step-06.1/output.md` when done, per the format at the bottom.

---

## 0. Hard triggers — STOP and surface to the user

This is the **4th attempt** at this domain; the prior three were deleted. If, while reading the codebase, you encounter any trace of a prior implementation — vocabulary like `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — **STOP and surface to the user**. Do not consume it as a reference. The only legitimate model source is `analysis/artifacts/` + the live Prisma schema.

If you hit a **prompt-vs-codebase conflict** (this prompt says X, the codebase clearly does Y) or a **domain-model limitation** (the model in `analysis/` can't express what the step needs): **STOP, state the conflict with a hypothesis ("the codebase does Y; I think the prompt is wrong because…; right?"), and wait.** The planner owns prompt errors and answers fast — Step 6.0 had one such escalation (`CONTEXT-001`), resolved in `6942b6cd`.

**Pre-task verification** — before editing `packages/api-server/src/endpoints/lms/index.ts`, `packages/api-server/src/mappers/lms/index.ts`, or `packages/api-server/src/authz/guards.ts`, run `git show HEAD:<path>` and **confirm the verbatim snippet quoted in § 2 / § 3.7 matches**. If it doesn't, the file has drifted since planning — STOP and surface.

---

## 1. What this step is

First api-server slice with **transitive lazy materialization**: Session create rolls a single atomic transaction through `week.upsert → day.upsert → session.create`, and the Week's `startDate` write hits the same `@db.Date` boundary that Step 5 nailed via `resolveWeekStartDate`. Step 6.1's job is to **extract** that helper into a shared module (`endpoints/lms/_shared/date.ts`) — mandated now by two callsites — and consume it from the new `lmsSessionApi`.

Four deliverables:

1. **`endpoints/lms/_shared/date.ts`** — new shared module. Moves `parseStartDate` and `resolveWeekStartDate` out of `endpoints/lms/week/admin.ts` (delete the local copies there; replace with `import` from `_shared/date`). Behaviour byte-identical; existing `week/admin.test.ts` stays green without touching it.

2. **`lmsSessionApi`** (`endpoints/lms/session/admin.ts`) — 4 methods: `create`, `update`, `delete`, `reorder`. Mirror `lmsPlanEnrollmentApi` (Step 5 prior art) for CRUD shape. `create` issues a single `prisma.$transaction` that upserts Week → upserts Day → creates Session with the next sparse `order`. **Session's `freezeLoadsAtCreation` is NOT touched** — column stays Prisma default `false` (Q10 carry-forward; do not pass it in any `data` payload).

3. **`mapToSession`** (`mappers/lms/session.mapper.ts`) — plain field copy mirroring `mapToWeek` (no enums, no `freezeLoadsAtCreation` in the mapped shape — the Step 6.0 contract has no such field).

4. **`verifySessionOwnership`** (added to `authz/guards.ts`) — JOIN'ed lookup `session → day → week → plan → creator`, with admin/head-coach bypass. Mirror `verifyPlanOwnership`. Used by `update`, `delete`, `reorder` (3 callsites in this step; Step 7 reuses for Block ownership chain).

**No Prisma schema change.** `Session`, `Day`, `Week`, `DayOfWeek` are all already shipped (`schema.prisma:477-485, 598-651`). No `db:reset`, no seed change, no edit to `analysis/artifacts/`.

**No platform code** — routes / hooks / UI are Steps 6.4-6.7. This step's `lmsSessionApi` is callable from tests; it has no HTTP surface yet.

**Hard binding (Q10 carry-forward)** — `Session.freezeLoadsAtCreation` is **not** in the contract (verified in Step 6.0's regression test). Do not pass it in `prisma.session.create({ data: ... })`. Do not include it in `mapToSession`'s output. The default-`false` Prisma column stays default-`false`. A grep of the diff for `freezeLoadsAtCreation` must yield zero matches outside the schema itself.

**Branch**: `feat/training-domain` (continues from Step 6.0 HEAD). Per-layer conventional-commits, all-lowercase subjects, body lines ≤150 chars. Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — if a hook fails, fix the root cause.

---

## 2. Read these first (verbatim — do not skim)

**Domain**:

- `packages/api-server/prisma/schema.prisma` lines 598-612 (Week), 614-631 (Day), 633-651 (Session). Confirm: `Session.freezeLoadsAtCreation Boolean @default(false)` exists but is OUT OF SCOPE.
- `packages/api-server/prisma/schema.prisma` lines 477-485 (`DayOfWeek` enum, 7 values).
- `analysis/artifacts/06-formalization/er-final.md §5 #7` — sparse-integer order semantics (10/20/30, ratified Phase 4 Q6).

**Step 5 templates (mirror structure verbatim)**:

- `packages/api-server/src/endpoints/lms/week/admin.ts` — the **source** of `parseStartDate` + `resolveWeekStartDate` (currently lines 10-26). Step 6.1 deletes these locally and re-imports from `_shared/date.ts`.
- `packages/api-server/src/endpoints/lms/week/admin.test.ts` — TZ test pattern (lines 160-182, the "persists startDate as the intended Monday regardless of server timezone" case). Assertions use `getUTCFullYear()` / `getUTCMonth()` / `getUTCDate()` — **not** `formatDateParam(...)` (that would re-introduce TZ dependency in the assertion itself).
- `packages/api-server/src/endpoints/lms/plan-enrollment/admin.ts` — full CRUD shape template (`verifyPlanOwnership` first; explicit `prisma.$transaction((tx) => ...)` for multi-step writes; `handlePrismaError` in catch; rethrow domain errors before generic Prisma-error handler).
- `packages/api-server/src/endpoints/lms/plan-enrollment/admin.test.ts` — integration test layout (`beforeAll` / `afterAll`, `cleanupRaw` for delete-bypass-soft-delete cleanup).
- `packages/api-server/src/mappers/lms/week.mapper.ts` — no-enum mapper template (plain field copy).
- `packages/api-server/src/authz/guards.ts` lines 70-103 — `verifyPlanOwnership` (returns `{ status }`) and `verifyPlanEditable` (throws on ARCHIVED). `verifySessionOwnership` mirrors lines 70-97's pattern.

**Test helpers (use these — don't roll your own)**:

- `packages/api-server/src/test/helpers.ts` — exports `createTestCoach()` (returns `{ user, profile }`), `createTestPlan(creatorUserId, overrides?)`, raw `rawPrisma` (and `cleanupRaw` alias).
- `packages/api-server/src/utils/find-or-throw.ts` — `findOrThrow(promise, label)` — wraps a `findUnique` / `findFirst` with a `NotFoundError` throw on null.
- `packages/api-server/src/utils/prisma-error-handler.ts` — `handlePrismaError(error, { entity })` — translates `P2002` / `P2003` / `P2025` to domain errors.
- `packages/api-server/src/db/tx.ts` — `TxClient` type for transaction callbacks.

**Contracts (consumed, not modified)**:

- `packages/contracts/src/entities/lms/session/` — Step 6.0 slice. Types: `Session`, `CreateSessionData`, `UpdateSessionData`, `ReorderSessionsData`. Schemas: `sessionByDayParamsSchema`, `sessionByIdParamsSchema`, request/response schemas.
- `packages/contracts/src/entities/lms/_shared/day-of-week.ts` — `dayOfWeekSchema` + `DayOfWeek` type. Import as `from "@repo/contracts/lms/_shared"`.

**Codebase rules (sacred — non-negotiable)**:

- One slice / one schema-set / one component per file. No multi-component files.
- No code comments unless encoding a non-obvious _why_ (single line). The existing api-server has none in this domain.
- No `as any` / `as unknown` / unjustified `!` assertions.
- `--no-verify` / `--no-edit` / `--no-gpg-sign` are forbidden. If commitlint fails (`subject-case`, `body-max-line-length`), reformat — don't bypass.
- Sparse `order` is 10/20/30 (ratified Phase 4 Q6); insert helpers use `(maxOrder ?? 0) + 10`; renumber on reorder to `(i + 1) * 10`.

---

## 3. Scope

### 3.1 Phase 0 — extract `_shared/date.ts`

**New file**: `packages/api-server/src/endpoints/lms/_shared/date.ts`:

```ts
import { BadRequestError } from "@repo/errors";
import { getMonday, parseDateParam } from "@repo/shared";

export const parseStartDate = (param: string): Date => {
  const parsed = parseDateParam(param);

  if (parsed === null) {
    throw new BadRequestError("startDate must be a valid YYYY-MM-DD date", {
      field: "startDate",
    });
  }

  return parsed;
};

export const resolveWeekStartDate = (startDateParam: string): Date => {
  const monday = getMonday(parseStartDate(startDateParam));

  return new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
};
```

(Byte-for-byte the same logic as the current `endpoints/lms/week/admin.ts:10-26` — just relocated.)

**New file**: `packages/api-server/src/endpoints/lms/_shared/date.test.ts` (unit-only, no DB):

- `parseStartDate("2026-05-18")` → returns `Date`; `getFullYear()` etc. local-midnight (not UTC).
- `parseStartDate("2026-13-40")` → throws `BadRequestError` (regex passes but calendar-invalid).
- `parseStartDate("not-a-date")` → throws `BadRequestError` (regex-fail).
- `resolveWeekStartDate("2026-05-18")` (Monday) → `Date` with `getUTCDate()` === 18, `getUTCMonth()` === 4, `getUTCFullYear()` === 2026.
- `resolveWeekStartDate("2026-05-20")` (Wednesday) → snaps to Monday `2026-05-18` UTC-midnight (assert via UTC-components).
- `resolveWeekStartDate("2026-05-24")` (Sunday) → snaps to Monday `2026-05-18` UTC-midnight.

**New file**: `packages/api-server/src/endpoints/lms/_shared/index.ts`:

```ts
export * from "./date";
```

**Refactor** `packages/api-server/src/endpoints/lms/week/admin.ts`:

- Delete local `parseStartDate` and `resolveWeekStartDate` (lines 10-26).
- Replace with `import { resolveWeekStartDate } from "../_shared";` (the inner `parseStartDate` is consumed inside `resolveWeekStartDate` and not used elsewhere in `week/admin.ts` — re-export it from `_shared` for consistency but `week/admin.ts` only needs `resolveWeekStartDate`).
- The 2 internal call sites in `week/admin.ts` (`getByPlanAndDate`, `upsertNotes`) keep calling `resolveWeekStartDate(startDateParam)` — same name, same shape, just a different module.
- **`packages/api-server/src/endpoints/lms/week/admin.test.ts` is NOT touched.** Verify after refactor by running it — must stay green.

### 3.2 Phase 1 — `mappers/lms/session.mapper.ts`

```ts
import { type Session as PrismaSession } from "@prisma/client";

import { type Session } from "@repo/contracts/lms/session";

export const mapToSession = (s: PrismaSession): Session => ({
  id: s.id,
  dayId: s.dayId,
  order: s.order,
  labelId: s.labelId,
  notes: s.notes,
  createdAt: s.createdAt,
  updatedAt: s.updatedAt,
});
```

(Plain field copy. **No `freezeLoadsAtCreation`** in the mapped shape — the contract doesn't carry it.)

### 3.3 Phase 2 — `verifySessionOwnership` in `authz/guards.ts`

Mirror `verifyPlanOwnership`'s shape (lines 70-97). Single `prisma.session.findUnique` with a deep nested include is brittle; instead select what's needed:

```ts
export const verifySessionOwnership = async (
  sessionId: string,
  userId: string,
): Promise<{ status: TrainingPlanStatus; dayId: string; weekId: string; planId: string }> => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: {
      dayId: true,
      day: {
        select: {
          weekId: true,
          week: {
            select: {
              planId: true,
              plan: { select: { creatorId: true, deletedAt: true, status: true } },
            },
          },
        },
      },
    },
  });

  if (!session || session.day.week.plan.deletedAt !== null) {
    throw new NotFoundError("Session not found", { sessionId });
  }

  const plan = session.day.week.plan;

  if (plan.creatorId === userId) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      dayId: session.dayId,
      weekId: session.day.weekId,
      planId: session.day.week.planId,
    };
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

  if (user && isAdminOrHeadCoach(ROLE_MAP[user.role])) {
    return {
      status: TRAINING_PLAN_STATUS_MAP[plan.status],
      dayId: session.dayId,
      weekId: session.day.weekId,
      planId: session.day.week.planId,
    };
  }

  throw new ForbiddenError("Session does not belong to this coach");
};
```

(Reuses the existing `isAdminOrHeadCoach`, `ROLE_MAP`, `TRAINING_PLAN_STATUS_MAP`, `findOrThrow` — all already imported in `guards.ts`. **Additive only** — do not modify the existing exports.)

### 3.4 Phase 3 — `endpoints/lms/session/admin.ts`

`lmsSessionApi` with 4 methods:

```ts
import { type Prisma } from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import {
  type CreateSessionData,
  type ReorderSessionsData,
  type Session,
  type UpdateSessionData,
} from "@repo/contracts/lms/session";
import { BadRequestError } from "@repo/errors";

import {
  verifyPlanEditable,
  verifyPlanOwnership,
  verifySessionOwnership,
} from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToSession } from "../../../mappers/lms";
import { handlePrismaError } from "../../../utils";
import { resolveWeekStartDate } from "../_shared";

const DAY_OF_WEEK_TO_PRISMA: Record<DayOfWeek, Prisma.DayOfWeek> = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
};
```

(`DayOfWeek` is byte-identical to Prisma's, but the explicit map keeps the contract-to-prisma boundary explicit — same convention as `ENROLLMENT_STATUS_TO_PRISMA_MAP`. Note `Prisma.DayOfWeek` may be the actual import name; verify against the generated client. If the boundary turns out to be a true identity in this codebase, a `satisfies Record<DayOfWeek, Prisma.DayOfWeek>` annotation on `DAY_OF_WEEK_TO_PRISMA` is the right shape rather than dropping the map.)

#### `create`

```ts
create: async (
  userId: string,
  planId: string,
  startDateParam: string,
  dayOfWeek: DayOfWeek,
  data: CreateSessionData,
): Promise<Session> => {
  const plan = await verifyPlanOwnership(planId, userId);

  verifyPlanEditable(plan);

  const startDate = resolveWeekStartDate(startDateParam);
  const prismaDayOfWeek = DAY_OF_WEEK_TO_PRISMA[dayOfWeek];

  try {
    const session = await prisma.$transaction(async (tx) => {
      const week = await tx.week.upsert({
        where: { planId_startDate: { planId, startDate } },
        create: { planId, startDate },
        update: {},
      });

      const day = await tx.day.upsert({
        where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: prismaDayOfWeek } },
        create: { weekId: week.id, dayOfWeek: prismaDayOfWeek },
        update: {},
      });

      const max = await tx.session.aggregate({
        where: { dayId: day.id },
        _max: { order: true },
      });

      const nextOrder = (max._max.order ?? 0) + 10;

      return tx.session.create({
        data: {
          dayId: day.id,
          order: nextOrder,
          labelId: data.labelId ?? null,
          notes: data.notes ?? null,
        },
      });
    });

    return mapToSession(session);
  } catch (error) {
    return handlePrismaError(error, { entity: "Session" });
  }
},
```

Notes:

- `tx.week.upsert` with `update: {}` is the canonical Prisma idiom for "ensure-exists" — no fields change on hit, the row is just connected.
- `tx.day.upsert` similarly.
- `tx.session.aggregate({ _max: { order } })` returns `{ _max: { order: number | null } }`; `?? 0` covers the empty-day case → `nextOrder = 10`.
- **No `freezeLoadsAtCreation`** in `tx.session.create.data`. Schema default `false` applies.

#### `update`

```ts
update: async (
  userId: string,
  sessionId: string,
  data: UpdateSessionData,
): Promise<Session> => {
  const owner = await verifySessionOwnership(sessionId, userId);

  verifyPlanEditable(owner);

  try {
    const session = await prisma.session.update({
      where: { id: sessionId },
      data: {
        ...(data.labelId !== undefined && { labelId: data.labelId }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    return mapToSession(session);
  } catch (error) {
    return handlePrismaError(error, { entity: "Session" });
  }
},
```

Conditional-spread (`exactOptionalPropertyTypes: true` rejects explicit `undefined`; codebase idiom — see `PlanDetailView` from Step 5). `null` passes through (clears the FK / clears the note).

#### `delete`

```ts
delete: async (userId: string, sessionId: string): Promise<void> => {
  const owner = await verifySessionOwnership(sessionId, userId);

  verifyPlanEditable(owner);

  try {
    await prisma.session.delete({ where: { id: sessionId } });
  } catch (error) {
    return handlePrismaError(error, { entity: "Session" });
  }
},
```

Cascade to `Block` and `PerformedSession` is declared in `schema.prisma:663-664` (`session: Session @relation(..., onDelete: Cascade)` on Block; `PerformedSession` likewise).

#### `reorder`

```ts
reorder: async (
  userId: string,
  planId: string,
  startDateParam: string,
  dayOfWeek: DayOfWeek,
  data: ReorderSessionsData,
): Promise<Session[]> => {
  const plan = await verifyPlanOwnership(planId, userId);

  verifyPlanEditable(plan);

  const startDate = resolveWeekStartDate(startDateParam);
  const prismaDayOfWeek = DAY_OF_WEEK_TO_PRISMA[dayOfWeek];

  const day = await prisma.day.findUnique({
    where: {
      weekId_dayOfWeek: {
        weekId: (
          await prisma.week.findUnique({
            where: { planId_startDate: { planId, startDate } },
            select: { id: true },
          })
        )?.id ?? "",
        dayOfWeek: prismaDayOfWeek,
      },
    },
    select: { id: true },
  });

  if (!day) {
    throw new BadRequestError("Cannot reorder sessions in an unmaterialized day slot", {
      planId,
      startDate: startDateParam,
      dayOfWeek,
    });
  }

  const sessions = await prisma.session.findMany({
    where: { id: { in: data.orderedIds } },
    select: { id: true, dayId: true },
  });

  if (sessions.length !== data.orderedIds.length) {
    throw new BadRequestError("Some orderedIds reference non-existent sessions", {
      missing: data.orderedIds.filter((id) => !sessions.some((s) => s.id === id)),
    });
  }

  const foreignDayIds = sessions.filter((s) => s.dayId !== day.id);

  if (foreignDayIds.length > 0) {
    throw new BadRequestError("Some orderedIds do not belong to the target day", {
      foreignIds: foreignDayIds.map((s) => s.id),
    });
  }

  try {
    const updated = await prisma.$transaction(
      data.orderedIds.map((id, i) =>
        prisma.session.update({ where: { id }, data: { order: (i + 1) * 10 } }),
      ),
    );

    return updated.map(mapToSession);
  } catch (error) {
    return handlePrismaError(error, { entity: "Session" });
  }
},
```

Notes:

- Anti-smuggle validation: every `orderedIds[i]` must belong to the target `(planId, startDate, dayOfWeek)` day. Reject `BadRequestError` otherwise.
- Reorder operates on an **existing** day — an empty/unmaterialized day has no sessions to reorder, so unmaterialized = `BadRequestError`. Don't materialize-on-reorder; semantics-fit.
- Sparse-int recompute: `(i + 1) * 10` → 10, 20, 30, … Same convention everywhere.

### 3.5 Phase 4 — barrels + registrations

**`packages/api-server/src/endpoints/lms/session/index.ts`** (new):

```ts
export * from "./admin";
```

**`packages/api-server/src/endpoints/lms/index.ts`** — additive. **Pre-task verify** the current state matches:

```ts
export * from "./plan-enrollment";
export * from "./training-plan";
export * from "./week";
```

Final state (additive — preserve all existing entries; alphabetical with underscore-first):

```ts
export * from "./_shared";
export * from "./plan-enrollment";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

(`_shared/index.ts` re-exports `parseStartDate` and `resolveWeekStartDate`. Adding it to the barrel keeps the API consistent with `lms/week`'s API — published symbols are accessible via `@repo/api-server/lms`.)

**`packages/api-server/src/mappers/lms/index.ts`** — additive. Current state:

```ts
export * from "./enum-maps";
export * from "./plan-enrollment.mapper";
export * from "./training-plan.mapper";
export * from "./week.mapper";
```

Final state (insert `session.mapper` alphabetically before `training-plan`; verify ordering matches the convention):

```ts
export * from "./enum-maps";
export * from "./plan-enrollment.mapper";
export * from "./session.mapper";
export * from "./training-plan.mapper";
export * from "./week.mapper";
```

### 3.6 Phase 5 — integration test `endpoints/lms/session/admin.test.ts`

Layout mirrors `lms/plan-enrollment/admin.test.ts`. `beforeAll`/`afterAll` create a test coach + a second `otherCoach` + an active plan + an archived plan. `afterAll` cleans up via `cleanupRaw` (`session.deleteMany` first to satisfy FK, then `day.deleteMany`, then `week.deleteMany`, then `trainingPlan.delete`, then `coachProfile.delete`, then `user.delete`). Use `createTestCoach` and `createTestPlan` from `test/helpers.ts`.

Required cases (each = one `it()`, integration vs live Neon dev DB):

1. **`create` rejects when caller does not own the plan** — `otherCoach.user.id` → `ForbiddenError`. No `Week`/`Day`/`Session` row created (verify with `cleanupRaw.session.count`).
2. **`create` rejects on an archived plan** — `coach.user.id` on `archivedPlanId` → `ForbiddenError` (from `verifyPlanEditable`). No row created.
3. **`create` materializes Week + Day + Session in an empty week** — coach + active plan + Monday param + `dayOfWeek: "TUESDAY"`. Assert: returned `Session` has `order === 10`, `labelId === null`, `notes === null`. Assert: `cleanupRaw.week.findUnique({ where: { planId_startDate } })` exists. Assert: `cleanupRaw.day.findUnique({ where: { weekId_dayOfWeek } })` exists with correct `dayOfWeek`.
4. **`create` reuses an existing Week when materializing a Day in a new weekday** — pre-existing Week (from `cleanupRaw.week.create`), pre-existing Day on Tuesday (with one Session at `order=10`). Create another Session for **Thursday** of the same week. Assert: only 1 Week row exists for the plan; Tuesday's Day row unchanged; new Thursday Day row created; new Session has `order === 10` (fresh Day).
5. **`create` next-sparse-order on a populated Day** — pre-existing Day with 2 sessions at order 10 and 20. Create another in the same Day. Assert: new session has `order === 30`.
6. **`update` updates `labelId` and `notes` and rejects non-owner** — owner can change `labelId` to a real `Label` row (use `cleanupRaw.label.create` in `beforeAll`); `otherCoach` → `ForbiddenError`.
7. **`delete` removes the Session and cascades to Block** — pre-existing Session with 1 Block. Delete; assert Session gone, Block gone.
8. **`reorder` happy path** — Day with 3 sessions [a@10, b@20, c@30]. Reorder `[c.id, a.id, b.id]`. Assert returned shape order: `c@10, a@20, b@30`. Assert DB reflects same.
9. **`reorder` rejects ids from the wrong Day** — Day-A with [a@10], Day-B with [b@10]. Call `reorder(planId, startDate, Day-A's dayOfWeek, { orderedIds: [a.id, b.id] })`. Expect `BadRequestError` (`b.id` belongs to Day-B). Assert: a@10 and b@10 unchanged.
10. **`reorder` rejects on an unmaterialized Day slot** — fresh week (no Days yet). Expect `BadRequestError`. No materialization side-effect.
11. **TZ invariance — Wednesday create on `TZ=Asia/Kolkata` persists `Week.startDate` as UTC-midnight Monday** — pass `WEDNESDAY_PARAM = "2026-05-20"`. Assert returned Session's transitively-loaded `Week.startDate.getUTCDate() === 18`, `getUTCMonth() === 4` (May), `getUTCFullYear() === 2026`. Reload via `cleanupRaw.week.findUnique` and assert same UTC components. **Run the file under `TZ=Asia/Kolkata`** to prove it (the test must fail without `resolveWeekStartDate`'s UTC anchor — verify by temporarily reverting the helper and observing the failure during development, then restoring).

Each test that creates Sessions cleans up via `cleanupRaw` in `try/finally`.

### 3.7 Phase 6 — verify Step 5 tests stay green after the refactor

After Phase 0 (the `_shared/date.ts` extraction), run `pnpm --filter @repo/api-server test src/endpoints/lms/week/` and confirm `week/admin.test.ts` still passes byte-identically. **Do not modify `week/admin.test.ts`.** If it breaks, the refactor is wrong — STOP and surface.

---

## 4. Out of scope — do NOT build

- **Day-metadata API** (label / notes upsert side-channel) — Step 6.2.
- **`getWeekResponseSchema` extension** to embed `days[]` / `sessions[]` — Step 6.2.
- **Platform routes** (HTTP layer over `lmsSessionApi`) — Step 6.4.
- **Platform hooks** (`useSession*`) — Step 6.5.
- **UI** (DayRow header / SessionCard / Add session CTA / dnd-kit reorder) — Steps 6.6 / 6.7.
- **`Session.freezeLoadsAtCreation`** — never expose in Step 6.x. Do not pass it in `data` payloads. Do not include it in `mapToSession`'s output. Stays at Prisma default `false`. **Grep regression: zero `freezeLoadsAtCreation` matches in any file changed by Step 6.1 (outside `schema.prisma`, which is unchanged).**
- **`Session.name`** — Prisma schema has no such field. Do not add. Do not pass.
- **Block / Schema / SchemaRow** level — Step 7+.
- **Cross-day session move** — explicitly out; `reorder` is within-day only.
- **Any Prisma schema change**, `db:reset`, seed change, or `analysis/artifacts/` edit.

---

## 5. Acceptance criteria

- `pnpm --filter @repo/api-server check-types` green.
- `pnpm --filter @repo/api-server lint` green (`--max-warnings 0`).
- `pnpm --filter @repo/api-server test` green — including:
  - The **existing** `endpoints/lms/week/admin.test.ts` (proves the refactor preserves behaviour).
  - The **new** `endpoints/lms/_shared/date.test.ts` (unit-only, ~6 cases).
  - The **new** `endpoints/lms/session/admin.test.ts` (integration, 11 cases per § 3.6).
- `TZ=Asia/Kolkata pnpm --filter @repo/api-server test src/endpoints/lms/session/admin.test.ts` green (TZ invariance test passes; documents the proof in `output.md` Verification notes).
- `pnpm dep:check` clean — no new cross-package boundary violations.
- Root `pnpm check-types` and `pnpm lint` green across 16 workspaces.
- **Grep regression**: `grep -rn "freezeLoadsAtCreation" packages/api-server/src` → only matches inside `schema.prisma` (untouched by this step) and the existing `prisma/client/...` generated types. Zero matches in any file edited or created by Step 6.1.
- **Grep regression**: `grep -rn "Session.name\|session\.name" packages/api-server/src` → zero matches in new code (excluding standard library or unrelated property accesses; verify in `output.md`).
- No `as any` / `as unknown` / unjustified `!`. No code comments.
- Existing `lms/week/admin.ts` after refactor — single-line `import { resolveWeekStartDate } from "../_shared";` in place of the deleted local helpers; rest of the file byte-identical.
- Smoke-test: **N/A** — api-server-only step, no user-visible surface. State this in `output.md` Verification notes.

---

## 6. `output.md` — write `implementation/step-06.1/output.md`

Sections (Russian prose where natural, English for code/paths):

`## Что сделано` · `## Изменённые/созданные файлы` · `## Принятые решения` · `## Возникшие вопросы и как решены` · `## Что отложено` · `` ## Ссылка на `.feature-dev/<ts>/` `` · `## Verification notes` · `## Acceptance criteria self-check`.

**Omit `## Сценарий смоук-теста`** — explicitly N/A for api-server-only steps. State this in `## Verification notes`.

In `## Verification notes`, include:

- The `TZ=Asia/Kolkata` run output (one-line summary + exit code).
- The two grep-regression command outputs (`freezeLoadsAtCreation` and `Session.name`).
- The byte-diff stats of `lms/week/admin.ts` (delete count + import-add count; should be ~17 deletions + 1 import line + 1 blank line removed = roughly `-18 / +1`).

---

## 7. Commits

Per-layer conventional-commits on `feat/training-domain`, all-lowercase subjects, body lines ≤150 chars. Three commits, **in this order** (refactor must precede new feature so the week handler doesn't briefly diverge):

```
refactor(api-server): extract resolveWeekStartDate to endpoints/lms/_shared/date.ts
feat(api-server): add lms session admin api with lazy day-week materialization
test(api-server): cover session admin scenarios incl. tz invariance
```

If Stage 6 QA surfaces a critical that requires a code change, add a 4th `fix(...)` commit. Never bypass hooks; fix root causes — commitlint `subject-case` (no capitals) and `body-max-line-length` (≤150) are common pitfalls.
