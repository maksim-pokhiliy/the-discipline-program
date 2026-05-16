# Step 6.2 — `lmsDayMetadataApi` + `getWeekResponseSchema` 7-day shape with embedded `Label`

> You are an **executor** session in the training-domain integration workflow. This prompt is self-contained: execute it via **`/feature`** (full pipeline — new contract slice, new api-server endpoint, mapper, extension of an existing endpoint and mapper, cross-package breaking change, consumer-side adapt, ~15 source files + 3 test files). Read `implementation/WORKFLOW.md` first for the durable rules. Write `implementation/step-06.2/output.md` when done, per the format at the bottom.

---

## 0. Hard triggers — STOP and surface to the user

This is the **4th attempt** at the training domain; the prior three were deleted. If, while reading the codebase, you encounter any trace of a prior implementation — vocabulary like `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — **STOP and surface to the user**. Do not consume it as a reference. The only legitimate model source is `analysis/artifacts/` + the live Prisma schema.

If you hit a **prompt-vs-codebase conflict** (this prompt says X, the codebase clearly does Y) or a **stale verbatim quote** (the prompt's "current state" of a barrel / `package.json` / dep-cruiser rule / hook file doesn't match `git show HEAD:<path>`): **STOP, state the conflict with a hypothesis, and wait.** Step 6.0 had one such escalation (`CONTEXT-001`, barrel drift); Step 6.1.5 had two (Q1 husky-blocked-commit-strategy, Q2 missed `@repo/api-server/cms` admin-import substitution). Don't apply silently.

**Pre-task verification** — before locking § 3 plan, run `git show HEAD:<path>` and **confirm the verbatim "current state" snippet below matches**:

- `packages/contracts/src/entities/lms/index.ts`, `packages/contracts/package.json` exports
- `packages/api-server/src/endpoints/lms/index.ts`, `packages/api-server/src/mappers/lms/index.ts`
- `packages/api-server/src/endpoints/lms/{week,session}/admin.ts` (Step 6.1 outputs — we extend `week`, extend `session.create+update`)
- `packages/api-server/src/endpoints/lms/_shared/date.ts` (reused)
- `packages/api-server/src/authz/guards.ts` (`verifyPlanOwnership` reused; **no** new guard needed)
- `apps/platform/src/lib/api/endpoints/weeks.ts`, `apps/platform/src/lib/hooks/use-weeks.ts`, `apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx` (consumer-side adapt)
- `.husky/pre-commit`, `.husky/pre-push`, `turbo.json` — see § 7 commit-strategy verification (this is mandatory per `[[husky-cross-package-squash]]` memory rule)

If any drifts → STOP and surface.

---

## 1. What this step is

After Step 6.1.5, embed `label: Label | null` in LMS responses is legal under `contracts-lms-no-coaching-cms-billing`. Step 6.2 implements the **D7-ratified shape** of the week-detail surface: `GET /lms/week/...` returns `{ week: Week | null, days: DayWithSessions[7] }` — server always materializes all 7 weekday slots, materialized-or-not is invisible to the client (empty slot = `{ dayOfWeek, label: null, notes: null, sessions: [] }`); client never branches on materialization state. Plus the **day-metadata side-channel** — `lmsDayMetadataApi.{setLabel, setNotes}` — that lazy-materializes the `Day` row on first non-null write per the D7 pattern (mirror of `Week` lazy materialization per D6, mirror of `Session.create` transitive materialization Step 6.1).

This is a **single squashed commit** per `[[husky-cross-package-squash]]` lesson — the change breaks `GetWeekResponse` type at the contract boundary and any intermediate split would leave `apps/platform` failing `pnpm check-types` under `.husky/pre-commit` `turbo check-types --filter="...[HEAD]"`. **No deprecation-shim path** — it would require apps/platform → contracts/lms backward-compat union types, breaking the embed cleanliness for zero structural benefit.

**Five deliverables** (1 commit, see § 7):

1. **`lms/day` contract slice** — new namespace `packages/contracts/src/entities/lms/day/`. Houses `daySlotSchema` (the per-weekday read shape with embedded label + session-with-label), `sessionWithLabelSchema` (Session base + `label: Label | null`), `updateDayLabelSchema` (write — `{labelId}`), `updateDayNotesSchema` (write — `{notes}`), address-params `dayByAddressParamsSchema` (`{planId, startDate, dayOfWeek}`), request/response wrappers. Plus `MAX_NOTES_LENGTH` constant mirror of Week/Session.

2. **`getWeekResponseSchema` extension** — `packages/contracts/src/entities/lms/week/week-api.schema.ts`. Current shape `{ week: weekSchema.nullable() }` extends to `{ week: weekSchema.nullable(), days: z.array(daySlotSchema).length(7) }`. **Breaking change** for consumer `apps/platform/src/lib/hooks/use-weeks.ts` + `views/plan-detail-view.tsx` (handled in Phase 3 of this step). Existing `updateWeekNotesResponseSchema = weekSchema` stays (notes upsert returns the Week scalar, not the full 7-day shape).

3. **`lmsDayMetadataApi`** (`packages/api-server/src/endpoints/lms/day/admin.ts`) — two methods, each `prisma.$transaction` with `Prisma.TransactionIsolationLevel.Serializable`:

   - `setLabel(userId, planId, startDateParam, dayOfWeek, { labelId })` — **OQ-D applies**: if `labelId === null` AND Day is unmaterialized → no-op (return early, no transaction). Otherwise: outer `verifyPlanOwnership` → `verifyPlanEditable` → tx { intra-tx plan re-check (deletedAt / status, mirror of `lmsSessionApi.create:50-61`) → if `labelId !== null` validate `tx.label.findUnique` exists AND `applicableLevels.includes("DAY")` → `tx.week.upsert` → `tx.day.upsert` with `labelId` payload → re-query the materialized `Day` with `include: { label, sessions: { orderBy: order asc, include: { label } } }` → return `mapToDaySlot(dayOfWeek, materializedDay)` }. Returns `DaySlot` (so the client can `setQueryData` the relevant entry in `useWeek` cache without full refetch).

   - `setNotes(userId, planId, startDateParam, dayOfWeek, { notes })` — symmetric to `setLabel`. **OQ-D applies**: if `notes === null` AND Day is unmaterialized → no-op. Otherwise: same tx pattern, `tx.day.upsert` with `notes` payload, re-query + return `DaySlot`. No `applicableLevels` validation (notes are free text).

4. **`lmsWeekApi.getByPlanAndDate` extension** — `packages/api-server/src/endpoints/lms/week/admin.ts`. Change return type to `{ week: Week | null, days: DaySlot[] }` (7 entries). Single Prisma query with nested `include`:

   ```ts
   const week = await prisma.week.findUnique({
     where: { planId_startDate: { planId, startDate } },
     include: {
       days: {
         include: {
           label: true,
           sessions: {
             orderBy: { order: "asc" },
             include: { label: true },
           },
         },
       },
     },
   });
   ```

   Then map: build `Map<DayOfWeek, MaterializedDay>` from `week?.days ?? []`, iterate `dayOfWeekValues` (constant Mon..Sun from `@repo/contracts/lms/_shared`), call `mapToDaySlot(dow, dayMap.get(dow) ?? null)` for each. Result: 7-element array in deterministic enum order regardless of DB insertion order. N+1 prevented by `include`. **`upsertNotes` unchanged** — it still writes Week-level notes and returns `Week` scalar.

5. **`applicableLevels.includes("SESSION")` enforcement in `lmsSessionApi.{create, update}`** — `packages/api-server/src/endpoints/lms/session/admin.ts`. OQ-C inline fix (Step 6.1 follow-up). In `create`: inside the existing `$transaction`, after the intra-tx plan re-check, if `data.labelId` is non-null/non-undefined → validate same as `setLabel`. In `update`: outside the existing prisma.session.update, add a similar pre-check (no existing transaction; one extra `prisma.label.findUnique` is fine — update is not high-concurrency). Use the same error wording: `BadRequestError("Label is not applicable to SESSION level", { labelId, applicableLevels })` / `NotFoundError("Label not found", { labelId })`.

6. **`mappers/lms/day.mapper.ts`** (new) — `mapToDaySlot(dayOfWeek: DayOfWeek, day: MaterializedDay | null): DaySlot`. Builder shape; null-handles unmaterialized; reuses `mapToLabel` (per `mappers/lms/label.mapper.ts` after Step 6.1.5) and `mapToSession` (per `mappers/lms/session.mapper.ts`). For embedded session-with-label, the mapper spreads `{ ...mapToSession(s), label: s.label ? mapToLabel(s.label) : null }` — no separate `mapToSessionWithLabel` symbol (single use site; inline keeps mappers slim).

7. **Consumer adapt** — `apps/platform/src/lib/hooks/use-weeks.ts`: `useUpdateWeekNotes.onSuccess` currently writes `setQueryData(..., { week })` against the now-extended shape — this would drop `days` from cache. Switch to **`queryClient.invalidateQueries({ queryKey: platformKeys.weeks.byDate(planId, startDate) })`** (full refetch — simpler than partial merge; refetch cost is one extra HTTP roundtrip, acceptable for a notes-blur commit). Also: `apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx` line 59 — `weekData?.week?.notes ?? null` — stays correct after the extension (the inner `?.week?` still works because `week` may be null). The `WeekGrid` rendering remains placeholder-only for Step 6.2 (consumes `days` in Step 6.6+); pass through `days` to the WeekGrid as a prop **only if** TypeScript demands it for the new `GetWeekResponse` type — otherwise leave WeekGrid signature unchanged.

**No new authz guard.** Day is addressed via `(planId, startDate, dayOfWeek)`; ownership = plan ownership. Reuses `verifyPlanOwnership` + `verifyPlanEditable` + intra-tx plan re-check (TOCTOU defence) per Step 6.1 pattern.

**No Prisma schema change.** `Day`, `Week`, `Session`, `Label`, `DayOfWeek` all already shipped. No `db:reset`, no seed change, no edit to `analysis/artifacts/`.

**No HTTP routes / hooks / UI / labels-platform-mirror.** Those are Steps 6.3-6.7.

**Branch**: `feat/training-domain` (continues from Step 6.1.5 close-out HEAD `c0aec5fb`). **Single squashed commit per `[[husky-cross-package-squash]]`** — see § 7. Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — if a hook fails, fix the root cause.

---

## 2. Read these first (verbatim — do not skim)

**Domain anchors**:

- `analysis/artifacts/05-synthesis/domain-model.md` §1.0 Week + §1.1 Day + §1.2 Session. Confirm: Day has `label: optional single LabelRef`, `notes: optional free-text`, `sessions: ordered 0..N`. Single label per Day; coach sample evidence — only `REST DAY` label, 66 occurrences.
- `analysis/artifacts/06-formalization/schema.prisma` Day block (line 156-172). Confirm `(weekId, dayOfWeek)` unique; `labelId?` String with `onDelete: Restrict` on Label.
- `packages/api-server/prisma/schema.prisma` Day block (lines 614-631 live) — same as analysis. `Session` block (lines 633-651) for the session-with-label shape understanding (`labelId` FK + `onDelete: Restrict` to Label).
- `implementation/PLANNING_STATE.md` § "Decisions accepted" D7 (Day = lazy calendar slot, mirror of D6) + § "Deferred sub-decisions" Q10 (Session.freezeLoadsAtCreation, indefinite carry-forward — still no contract exposure) + Session.name (indefinite carry-forward — still no contract exposure) + § "Decisions accepted" D8 (Label+Exercise in `lms/*` namespace, completed via Step 6.1.5).
- `implementation/IMPLEMENTATION_LOG.md` Step 06.1.5 entry + the **5-flavour Lesson learned** addenda (especially Step 6.1.5 — instinct-process-blindness + the durable rule [[husky-cross-package-squash]]).

**Contract slices (consumed, partially extended)**:

- `packages/contracts/src/entities/lms/week/week.schema.ts` (17 lines). `weekSchema` shape; `updateWeekNotesSchema` (`{ notes: string|null, max 2000 }`). Unchanged in Step 6.2.
- `packages/contracts/src/entities/lms/week/week-api.schema.ts` (17 lines) — **this file is extended** in Phase 1. Current `getWeekResponseSchema = z.object({ week: weekSchema.nullable() })`. Final: `z.object({ week: weekSchema.nullable(), days: z.array(daySlotSchema).length(7) })` (import `daySlotSchema` from `../day`). `weekByPlanAndDateParamsSchema` unchanged.
- `packages/contracts/src/entities/lms/session/session.schema.ts` (29 lines). `sessionSchema` (`{id, dayId, order, labelId, notes, ts}`). Unchanged in Step 6.2.
- `packages/contracts/src/entities/lms/session/session-api.schema.ts` (32 lines). `sessionByDayParamsSchema`, `sessionByIdParamsSchema`, request/response wrappers. **No** `Session`-level extension in Step 6.2 (`createSessionResponseSchema = sessionSchema` stays minimal — write ops return scalar; read views (week response) embed label separately).
- `packages/contracts/src/entities/lms/_shared/day-of-week.ts` (16 lines). `dayOfWeekValues` const tuple + `dayOfWeekSchema` z.enum + `DayOfWeek` type. **Used heavily** — iterate `dayOfWeekValues` for the 7-day map; export from new `lms/day` slice via re-export from `../_shared` (don't duplicate).
- `packages/contracts/src/entities/lms/label/label.schema.ts` (41 lines after Step 6.1.5). `labelSchema` shape with `id, name, nameLower, applicableLevels, notes, ts`. `APP_LEVELS` const + `appLevelSchema` z.enum from `./label.constants`. **Embed**: `lms/day/day.schema.ts` imports `labelSchema` from `../label` (now legal — same `lms/*` namespace).
- `packages/contracts/src/entities/lms/label/label.constants.ts` (8 lines). `APP_LEVELS = ["DAY","SESSION","BLOCK"] as const` + `AppLevelValue` type — used in `applicableLevels.includes("DAY")` / `"SESSION"` enforcement.

**api-server (consumed, extended)**:

- `packages/api-server/src/endpoints/lms/week/admin.ts` (50 lines, lms HEAD after Step 6.1). **Extended in Phase 2**: `getByPlanAndDate` returns `{ week, days[7] }`. `upsertNotes` unchanged. Pre-task verify `import { resolveWeekStartDate } from "../_shared"` still on line 7.
- `packages/api-server/src/endpoints/lms/session/admin.ts` (213 lines, post Step 6.1). **Extended in Phase 2**: `create` adds `applicableLevels.includes("SESSION")` validation inside the existing `$transaction` (insertion point: after intra-tx plan re-check on line ~62, before `tx.week.upsert` on line ~63). `update` adds a pre-check before the existing `prisma.session.update` (insertion point: after `verifyPlanEditable(owner)` on line ~103, before the try block on line ~105). Use new `tx.label.findUnique` (or `prisma.label.findUnique` for update's non-tx path) on `where: { id: labelId }`, `select: { applicableLevels: true }`. Reuse error wordings (see § 1 deliverable 5).
- `packages/api-server/src/endpoints/lms/_shared/date.ts` (21 lines) — reused, not modified.
- `packages/api-server/src/endpoints/lms/_shared/index.ts` (1 line) — unchanged.
- `packages/api-server/src/mappers/lms/week.mapper.ts` (13 lines) — `mapToWeek` reused for the new week-level part of `{ week, days[7] }`. Unchanged.
- `packages/api-server/src/mappers/lms/session.mapper.ts` (14 lines) — `mapToSession` reused inside `mapToDaySlot` for the session base; spread `{ ...mapToSession(s), label: s.label ? mapToLabel(s.label) : null }` produces the embedded shape. Unchanged.
- `packages/api-server/src/mappers/lms/label.mapper.ts` (14 lines post-6.1.5) — `mapToLabel` reused inside `mapToDaySlot`. Unchanged.
- `packages/api-server/src/authz/guards.ts` (172 lines). `verifyPlanOwnership` (returns `{ status }`) + `verifyPlanEditable` (throws on `ARCHIVED`) reused. **No** new `verifyDayOwnership` (Day addressed via plan ownership). The intra-tx plan re-check pattern is shown in Step 6.1's `endpoints/lms/session/admin.ts:50-61` — **mirror it verbatim** for `setLabel` / `setNotes` tx bodies.

**Apps/platform (consumer adapt)**:

- `apps/platform/src/lib/api/endpoints/weeks.ts` (11 lines). `createWeeksAPI.getByDate` returns `GetWeekResponse` — type signature unchanged (the type itself extends; the call signature stays). Verify it compiles after Phase 1.
- `apps/platform/src/lib/hooks/use-weeks.ts` (35 lines). **Modified in Phase 3**: `useUpdateWeekNotes.onSuccess` currently does `queryClient.setQueryData(key, { week })`. Replace with `queryClient.invalidateQueries({ queryKey: key })`. Drop the existing comment about round-trip on the line; the explanation moves to a new short comment if any (one-liner is acceptable per `[[global-preferences]]` "comment only when non-obvious").
- `apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx` (66 lines). Line 59 — `notes={weekData?.week?.notes ?? null}` — compiles unchanged (the optional chain still resolves since `week` may be null). **If TypeScript demands prop passing for `days` to `WeekGrid`**, do nothing — `WeekGrid` doesn't consume `days` in Step 6.2 (placeholder rendering). If it works, leave WeekGrid signature unchanged.
- `apps/platform/src/modules/plan-detail/components/week-grid.tsx` (17 lines) — unchanged in Step 6.2.
- `apps/platform/src/modules/plan-detail/components/day-row.tsx` (49 lines) — unchanged in Step 6.2. Currently renders "No sessions" stub regardless of data; Step 6.6 wires in `days[i]`.
- `apps/platform/src/modules/plan-detail/components/week-notes.tsx` (68 lines) — unchanged in Step 6.2 (consumes `notes` prop, which `plan-detail-view.tsx` continues to extract from `weekData?.week`).

**Registration verbatim** (pre-task verify via `git show HEAD:<path>`; if drift, STOP):

- `packages/contracts/src/entities/lms/index.ts` (7 lines):
  ```ts
  export * from "./_shared";
  export * from "./exercise";
  export * from "./label";
  export * from "./plan-enrollment";
  export * from "./session";
  export * from "./training-plan";
  export * from "./week";
  ```
- `packages/contracts/package.json` exports field — confirm `./lms/day` is **absent** (we add it):
  ```json
  "./lms": "./src/entities/lms/index.ts",
  "./lms/_shared": "./src/entities/lms/_shared/index.ts",
  "./lms/exercise": "./src/entities/lms/exercise/index.ts",
  "./lms/label": "./src/entities/lms/label/index.ts",
  "./lms/plan-enrollment": "./src/entities/lms/plan-enrollment/index.ts",
  "./lms/session": "./src/entities/lms/session/index.ts",
  "./lms/training-plan": "./src/entities/lms/training-plan/index.ts",
  "./lms/week": "./src/entities/lms/week/index.ts",
  ```
- `packages/api-server/src/endpoints/lms/index.ts` (7 lines):
  ```ts
  export * from "./_shared";
  export * from "./exercise/admin";
  export * from "./label/admin";
  export * from "./plan-enrollment";
  export * from "./session";
  export * from "./training-plan";
  export * from "./week";
  ```
- `packages/api-server/src/mappers/lms/index.ts` (8 lines):
  ```ts
  export * from "./enum-maps";
  export * from "./exercise.enum-maps";
  export * from "./exercise.mapper";
  export * from "./label.mapper";
  export * from "./plan-enrollment.mapper";
  export * from "./session.mapper";
  export * from "./training-plan.mapper";
  export * from "./week.mapper";
  ```

**Hooks + pipeline (`[[husky-cross-package-squash]]` mandatory pre-read)**:

- `.husky/pre-commit` (3 lines):
  ```sh
  node scripts/check-secrets.mjs
  npx lint-staged
  SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"
  ```
- `.husky/pre-push` (2 lines):
  ```sh
  pnpm dep:check
  SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"
  ```
- `turbo.json` `tasks.check-types`: `dependsOn: ["^check-types"]` (no special filter; fan-out via `--filter="...[HEAD]"` includes every package whose graph touches a changed file).

**Implication for § 7**: Step 6.2 changes contracts (cascades to api-server + apps/platform) AND api-server (cascades to apps/platform) AND apps/platform (terminal). Any per-layer commit leaves at least one downstream package broken under `turbo check-types --filter="...[HEAD]"`. **Squash to 1 commit — mandatory per `[[husky-cross-package-squash]]`**. No deprecation-shim path (would require contracts → api-server back-compat union types; defeats the embed-cleanliness purpose).

**Test helpers + patterns (reused)**:

- `packages/api-server/src/test/helpers.ts` — `createTestCoach`, `createTestPlan`, `cleanupRaw`. Reuse for Day-metadata integration tests; pattern matches Step 6.1's `endpoints/lms/session/admin.test.ts` (538 lines).
- `packages/api-server/src/test/helpers.ts` exposes `cleanupRaw.label` — use to seed test labels with `applicableLevels: ["DAY"]` / `["SESSION"]` / `["BLOCK"]` for the validation cases.
- `endpoints/lms/week/admin.test.ts` (184 lines) — extend in Phase 2 with new-shape assertions.
- `endpoints/lms/session/admin.test.ts` (538 lines) — extend in Phase 2 with `applicableLevels` validation cases.

**Codebase rules (sacred — non-negotiable)**:

- One slice / one schema-set / one component per file. New `lms/day` slice follows the per-entity-folder convention.
- **No code comments** unless encoding a non-obvious _why_ (single line, ≤150 chars per commitlint body-max-line-length). The existing api-server has none in this domain.
- No `as any` / `as unknown` / unjustified `!` assertions. The known exception is `applicableLevels as AppLevelValue[]` in mappers — already established in `mapToLabel` (`mappers/lms/label.mapper.ts:9`).
- `--no-verify` / `--no-edit` / `--no-gpg-sign` are **forbidden globally** + reaffirmed in `[[husky-cross-package-squash]]`. If commitlint fails (`subject-case`, `body-max-line-length`), reformat — don't bypass.
- Sparse `order` is 10/20/30 — N/A in Step 6.2 (no Session insert in this step's new code path beyond what Step 6.1 already covers).

---

## 3. Scope

### 3.1 Phase 1 — contracts (new `lms/day` slice + `week-api.schema.ts` extension)

#### 3.1.1 New directory `packages/contracts/src/entities/lms/day/`

7 files mirroring the `lms/session` slice canonical layout from Step 6.0:

**`day.constants.ts`**:

```ts
export const DAY_CONSTANTS = {
  MAX_NOTES_LENGTH: 2000,
} as const;
```

(Mirror of `week.constants.ts` / `session.constants.ts`.)

**`day.schema.ts`**:

```ts
import { z } from "zod";

import { dayOfWeekSchema } from "../_shared";
import { labelSchema } from "../label";
import { sessionSchema } from "../session";

import { DAY_CONSTANTS } from "./day.constants";

export const sessionWithLabelSchema = sessionSchema.extend({
  label: labelSchema.nullable(),
});

export const daySlotSchema = z.object({
  dayOfWeek: dayOfWeekSchema,
  label: labelSchema.nullable(),
  notes: z.string().nullable(),
  sessions: z.array(sessionWithLabelSchema),
});

export const updateDayLabelSchema = z.object({
  labelId: z.string().cuid().nullable(),
});

export const updateDayNotesSchema = z.object({
  notes: z.string().max(DAY_CONSTANTS.MAX_NOTES_LENGTH).nullable(),
});
```

**`day.types.ts`**:

```ts
import { type z } from "zod";

import {
  type daySlotSchema,
  type sessionWithLabelSchema,
  type updateDayLabelSchema,
  type updateDayNotesSchema,
} from "./day.schema";

export type DaySlot = z.infer<typeof daySlotSchema>;
export type SessionWithLabel = z.infer<typeof sessionWithLabelSchema>;
export type UpdateDayLabelData = z.infer<typeof updateDayLabelSchema>;
export type UpdateDayNotesData = z.infer<typeof updateDayNotesSchema>;
```

**`day-api.schema.ts`**:

```ts
import { z } from "zod";

import { dayOfWeekSchema } from "../_shared";

import { daySlotSchema, updateDayLabelSchema, updateDayNotesSchema } from "./day.schema";

export const dayByAddressParamsSchema = z.object({
  planId: z.string().cuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayOfWeek: dayOfWeekSchema,
});

export const updateDayLabelRequestSchema = updateDayLabelSchema;
export const updateDayLabelResponseSchema = daySlotSchema;

export const updateDayNotesRequestSchema = updateDayNotesSchema;
export const updateDayNotesResponseSchema = daySlotSchema;
```

**`day-api.types.ts`**:

```ts
import { type z } from "zod";

import {
  type dayByAddressParamsSchema,
  type updateDayLabelRequestSchema,
  type updateDayLabelResponseSchema,
  type updateDayNotesRequestSchema,
  type updateDayNotesResponseSchema,
} from "./day-api.schema";

export type DayByAddressParams = z.infer<typeof dayByAddressParamsSchema>;
export type UpdateDayLabelRequest = z.infer<typeof updateDayLabelRequestSchema>;
export type UpdateDayLabelResponse = z.infer<typeof updateDayLabelResponseSchema>;
export type UpdateDayNotesRequest = z.infer<typeof updateDayNotesRequestSchema>;
export type UpdateDayNotesResponse = z.infer<typeof updateDayNotesResponseSchema>;
```

**`index.ts`**:

```ts
export * from "./day.constants";
export * from "./day.schema";
export * from "./day.types";
export * from "./day-api.schema";
export * from "./day-api.types";
```

**`day.schema.test.ts`** (Vitest unit, no DB) — minimum 10 cases:

1. `dayOfWeekValues` round-trip — `daySlotSchema.safeParse(...)` with every weekday passes.
2. `daySlotSchema` accepts a minimal materialized slot — `{ dayOfWeek: "MONDAY", label: null, notes: null, sessions: [] }`.
3. `daySlotSchema` accepts an empty slot — `{ dayOfWeek: "TUESDAY", label: null, notes: null, sessions: [] }` (same as #2 — empty is the unmaterialized representation).
4. `daySlotSchema` accepts a fully materialized slot with embedded label + 2 sessions (one with label, one without).
5. `daySlotSchema` rejects an invalid `dayOfWeek` — `"FOOBAR"`.
6. `daySlotSchema` rejects missing `sessions` field.
7. `daySlotSchema.shape.id === undefined` — D7 regression guard (Day's internal `id` is never exposed client-side as an address).
8. `sessionWithLabelSchema.shape.label !== undefined` — embed guard.
9. `sessionWithLabelSchema.shape.labelId !== undefined` — preserves base session fields (id + dayId + order + labelId + notes + ts) AND adds `label`.
10. `updateDayLabelSchema` accepts `{ labelId: null }` and `{ labelId: "clxxx..." }`; rejects `{ labelId: "not-a-cuid" }`.
11. `updateDayNotesSchema` accepts string under MAX_NOTES_LENGTH; rejects over.
12. **Regression: `sessionWithLabelSchema.shape.name === undefined`** — Session.name carry-forward (PLANNING_STATE deferred sub-decision).
13. **Regression: `sessionWithLabelSchema.shape.freezeLoadsAtCreation === undefined`** — Session.freezeLoadsAtCreation carry-forward.

#### 3.1.2 Extend `week-api.schema.ts`

**Current state** (verbatim, 17 lines):

```ts
import { z } from "zod";

import { updateWeekNotesSchema, weekSchema } from "./week.schema";

export const weekByPlanAndDateParamsSchema = z.object({
  planId: z.string().cuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getWeekResponseSchema = z.object({
  week: weekSchema.nullable(),
});

export const updateWeekNotesRequestSchema = updateWeekNotesSchema;

export const updateWeekNotesResponseSchema = weekSchema;
```

**Final state** — extend `getWeekResponseSchema` only:

```ts
import { z } from "zod";

import { daySlotSchema } from "../day";

import { updateWeekNotesSchema, weekSchema } from "./week.schema";

export const weekByPlanAndDateParamsSchema = z.object({
  planId: z.string().cuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const getWeekResponseSchema = z.object({
  week: weekSchema.nullable(),
  days: z.array(daySlotSchema).length(7),
});

export const updateWeekNotesRequestSchema = updateWeekNotesSchema;

export const updateWeekNotesResponseSchema = weekSchema;
```

Note: `.length(7)` is a Zod array length constraint — the runtime server-side will always produce exactly 7. Client-side parse will reject anything else (defence-in-depth; documents the invariant at the type level).

#### 3.1.3 Extend `week-api.schema.test.ts` (4 new cases)

Pre-task verify the file exists at `packages/contracts/src/entities/lms/week/week-api.schema.test.ts`. If not, add a minimal new test file mirroring `session-api.schema.test.ts` shape. Cases:

- `getWeekResponseSchema` accepts `{ week: null, days: [<7 empty slots, one per weekday>] }` — empty week representation.
- `getWeekResponseSchema` accepts `{ week: <materialized Week>, days: [<7 mixed empty/materialized>] }`.
- `getWeekResponseSchema` rejects `days.length === 6` or `8`.
- `getWeekResponseSchema` rejects missing `days` field (legacy `{ week }` shape — proves the breaking change is enforced).

#### 3.1.4 Barrel + exports

**`packages/contracts/src/entities/lms/index.ts`** (add `./day` alphabetical, between `./_shared` and `./exercise`):

```ts
export * from "./_shared";
export * from "./day";
export * from "./exercise";
export * from "./label";
export * from "./plan-enrollment";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

**`packages/contracts/package.json`** exports map — add `./lms/day` entry alphabetical between `./lms/_shared` and `./lms/exercise`:

```json
"./lms": "./src/entities/lms/index.ts",
"./lms/_shared": "./src/entities/lms/_shared/index.ts",
"./lms/day": "./src/entities/lms/day/index.ts",
"./lms/exercise": "./src/entities/lms/exercise/index.ts",
"./lms/label": "./src/entities/lms/label/index.ts",
"./lms/plan-enrollment": "./src/entities/lms/plan-enrollment/index.ts",
"./lms/session": "./src/entities/lms/session/index.ts",
"./lms/training-plan": "./src/entities/lms/training-plan/index.ts",
"./lms/week": "./src/entities/lms/week/index.ts",
```

### 3.2 Phase 2 — api-server

#### 3.2.1 New `mappers/lms/day.mapper.ts`

```ts
import {
  type Day as PrismaDay,
  type Label as PrismaLabel,
  type Session as PrismaSession,
} from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import { type DaySlot } from "@repo/contracts/lms/day";

import { mapToLabel } from "./label.mapper";
import { mapToSession } from "./session.mapper";

type DayWithRelations = PrismaDay & {
  label: PrismaLabel | null;
  sessions: (PrismaSession & { label: PrismaLabel | null })[];
};

export const mapToDaySlot = (dayOfWeek: DayOfWeek, day: DayWithRelations | null): DaySlot => ({
  dayOfWeek,
  label: day?.label ? mapToLabel(day.label) : null,
  notes: day?.notes ?? null,
  sessions: (day?.sessions ?? []).map((s) => ({
    ...mapToSession(s),
    label: s.label ? mapToLabel(s.label) : null,
  })),
});
```

**Add to `mappers/lms/index.ts`** — alphabetical, between `./exercise.mapper` (or after, depending on barrel sort — between `./exercise.mapper` and `./label.mapper`):

```ts
export * from "./enum-maps";
export * from "./exercise.enum-maps";
export * from "./exercise.mapper";
export * from "./day.mapper";
export * from "./label.mapper";
export * from "./plan-enrollment.mapper";
export * from "./session.mapper";
export * from "./training-plan.mapper";
export * from "./week.mapper";
```

(Verify sort — `day.mapper` alphabetically before `enum-maps`? No, `d` < `e`. Actually `day` < `enum-maps`. Adjust:)

```ts
export * from "./day.mapper";
export * from "./enum-maps";
export * from "./exercise.enum-maps";
export * from "./exercise.mapper";
export * from "./label.mapper";
export * from "./plan-enrollment.mapper";
export * from "./session.mapper";
export * from "./training-plan.mapper";
export * from "./week.mapper";
```

(Verify against the current file at task-time — preserve any existing non-alphabetical convention if present.)

#### 3.2.2 New `endpoints/lms/day/admin.ts` — `lmsDayMetadataApi`

Skeleton (the executor fills in the bodies; the prompt encodes the contracts + invariants + adversarial defences):

```ts
import { Prisma, type DayOfWeek as PrismaDayOfWeek } from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import {
  type DaySlot,
  type UpdateDayLabelData,
  type UpdateDayNotesData,
} from "@repo/contracts/lms/day";
import { type AppLevelValue } from "@repo/contracts/lms/label";
import { BadRequestError, ForbiddenError, NotFoundError } from "@repo/errors";

import { verifyPlanEditable, verifyPlanOwnership } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToDaySlot } from "../../../mappers/lms";
import { handlePrismaError } from "../../../utils";
import { resolveWeekStartDate } from "../_shared";

const DAY_OF_WEEK_TO_PRISMA = {
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
} as const satisfies Record<DayOfWeek, PrismaDayOfWeek>;

const DAY_INCLUDE = {
  label: true,
  sessions: { orderBy: { order: "asc" as const }, include: { label: true } },
} as const;

export const lmsDayMetadataApi = {
  setLabel: async (
    userId: string,
    planId: string,
    startDateParam: string,
    dayOfWeek: DayOfWeek,
    data: UpdateDayLabelData,
  ): Promise<DaySlot> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const startDate = resolveWeekStartDate(startDateParam);
    const prismaDayOfWeek = DAY_OF_WEEK_TO_PRISMA[dayOfWeek];

    if (data.labelId === null) {
      const existingDay = await prisma.day.findFirst({
        where: { dayOfWeek: prismaDayOfWeek, week: { planId, startDate } },
        include: DAY_INCLUDE,
      });

      if (existingDay === null) {
        return mapToDaySlot(dayOfWeek, null);
      }

      // Day exists; proceed to update — fall through to the tx below.
    }

    try {
      const day = await prisma.$transaction(
        async (tx) => {
          const planCheck = await tx.trainingPlan.findUnique({
            where: { id: planId },
            select: { deletedAt: true, status: true },
          });

          if (!planCheck || planCheck.deletedAt !== null) {
            throw new NotFoundError("Training plan not found", { planId });
          }

          if (planCheck.status === "ARCHIVED") {
            throw new ForbiddenError("Plan is archived; edits not allowed");
          }

          if (data.labelId !== null) {
            const label = await tx.label.findUnique({
              where: { id: data.labelId },
              select: { applicableLevels: true },
            });

            if (!label) {
              throw new NotFoundError("Label not found", { labelId: data.labelId });
            }

            const levels = label.applicableLevels as AppLevelValue[];

            if (!levels.includes("DAY")) {
              throw new BadRequestError("Label is not applicable to DAY level", {
                labelId: data.labelId,
                applicableLevels: levels,
              });
            }
          }

          const week = await tx.week.upsert({
            where: { planId_startDate: { planId, startDate } },
            create: { planId, startDate },
            update: {},
          });

          return tx.day.upsert({
            where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: prismaDayOfWeek } },
            create: { weekId: week.id, dayOfWeek: prismaDayOfWeek, labelId: data.labelId },
            update: { labelId: data.labelId },
            include: DAY_INCLUDE,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return mapToDaySlot(dayOfWeek, day);
    } catch (error) {
      return handlePrismaError(error, { entity: "Day" });
    }
  },

  setNotes: async (
    userId: string,
    planId: string,
    startDateParam: string,
    dayOfWeek: DayOfWeek,
    data: UpdateDayNotesData,
  ): Promise<DaySlot> => {
    const plan = await verifyPlanOwnership(planId, userId);

    verifyPlanEditable(plan);

    const startDate = resolveWeekStartDate(startDateParam);
    const prismaDayOfWeek = DAY_OF_WEEK_TO_PRISMA[dayOfWeek];

    if (data.notes === null) {
      const existingDay = await prisma.day.findFirst({
        where: { dayOfWeek: prismaDayOfWeek, week: { planId, startDate } },
        include: DAY_INCLUDE,
      });

      if (existingDay === null) {
        return mapToDaySlot(dayOfWeek, null);
      }
    }

    try {
      const day = await prisma.$transaction(
        async (tx) => {
          const planCheck = await tx.trainingPlan.findUnique({
            where: { id: planId },
            select: { deletedAt: true, status: true },
          });

          if (!planCheck || planCheck.deletedAt !== null) {
            throw new NotFoundError("Training plan not found", { planId });
          }

          if (planCheck.status === "ARCHIVED") {
            throw new ForbiddenError("Plan is archived; edits not allowed");
          }

          const week = await tx.week.upsert({
            where: { planId_startDate: { planId, startDate } },
            create: { planId, startDate },
            update: {},
          });

          return tx.day.upsert({
            where: { weekId_dayOfWeek: { weekId: week.id, dayOfWeek: prismaDayOfWeek } },
            create: { weekId: week.id, dayOfWeek: prismaDayOfWeek, notes: data.notes },
            update: { notes: data.notes },
            include: DAY_INCLUDE,
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );

      return mapToDaySlot(dayOfWeek, day);
    } catch (error) {
      return handlePrismaError(error, { entity: "Day" });
    }
  },
};
```

**`endpoints/lms/day/index.ts`** (new):

```ts
export * from "./admin";
```

**Add to `packages/api-server/src/endpoints/lms/index.ts`** (alphabetical, between `./_shared` and `./exercise/admin`):

```ts
export * from "./_shared";
export * from "./day";
export * from "./exercise/admin";
export * from "./label/admin";
export * from "./plan-enrollment";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

#### 3.2.3 Extend `endpoints/lms/week/admin.ts` — `getByPlanAndDate` returns 7-day shape

**Current `getByPlanAndDate`** (lines 10-24):

```ts
getByPlanAndDate: async (
  userId: string,
  planId: string,
  startDateParam: string,
): Promise<Week | null> => {
  await verifyPlanOwnership(planId, userId);

  const startDate = resolveWeekStartDate(startDateParam);

  const week = await prisma.week.findUnique({
    where: { planId_startDate: { planId, startDate } },
  });

  return week ? mapToWeek(week) : null;
},
```

**Final**:

```ts
getByPlanAndDate: async (
  userId: string,
  planId: string,
  startDateParam: string,
): Promise<GetWeekResponse> => {
  await verifyPlanOwnership(planId, userId);

  const startDate = resolveWeekStartDate(startDateParam);

  const week = await prisma.week.findUnique({
    where: { planId_startDate: { planId, startDate } },
    include: {
      days: {
        include: {
          label: true,
          sessions: { orderBy: { order: "asc" }, include: { label: true } },
        },
      },
    },
  });

  const dayMap = new Map(week?.days.map((d) => [d.dayOfWeek, d]) ?? []);
  const days = dayOfWeekValues.map((dow) =>
    mapToDaySlot(dow, dayMap.get(DAY_OF_WEEK_TO_PRISMA[dow]) ?? null),
  );

  return { week: week ? mapToWeek(week) : null, days };
},
```

(Imports to add: `import { dayOfWeekValues, type DayOfWeek } from "@repo/contracts/lms/_shared";` + `import { type GetWeekResponse } from "@repo/contracts/lms/week";` + `import { mapToDaySlot } from "../../../mappers/lms";` + the `DAY_OF_WEEK_TO_PRISMA` const can be hoisted from `endpoints/lms/session/admin.ts` to `endpoints/lms/_shared/day-of-week.ts` if you prefer DRY, **OR** duplicated in `endpoints/lms/day/admin.ts` and `endpoints/lms/week/admin.ts`. Hypothesis: hoist to `_shared/day-of-week.ts` is cleaner — 3 callsites soon — but adds a new shared file. Acceptable either way; document the choice in `output.md` § "Принятые решения".)

`upsertNotes` is **unchanged** — it still writes Week-level notes and returns `Week`. The two API methods diverge: `getByPlanAndDate` returns the full read shape; `upsertNotes` returns the Week scalar (client invalidates `useWeek` separately).

#### 3.2.4 Extend `endpoints/lms/session/admin.ts` — `applicableLevels` enforcement (OQ-C)

In `create` — inside the existing `$transaction` (between intra-tx plan re-check and `tx.week.upsert`):

```ts
if (data.labelId !== null && data.labelId !== undefined) {
  const label = await tx.label.findUnique({
    where: { id: data.labelId },
    select: { applicableLevels: true },
  });

  if (!label) {
    throw new NotFoundError("Label not found", { labelId: data.labelId });
  }

  const levels = label.applicableLevels as AppLevelValue[];

  if (!levels.includes("SESSION")) {
    throw new BadRequestError("Label is not applicable to SESSION level", {
      labelId: data.labelId,
      applicableLevels: levels,
    });
  }
}
```

(Add `import { type AppLevelValue } from "@repo/contracts/lms/label";` to the top.)

In `update` — outside any transaction, after `verifyPlanEditable(owner)`, before the existing `try { await prisma.session.update(...) }`:

```ts
if (data.labelId !== undefined && data.labelId !== null) {
  const label = await prisma.label.findUnique({
    where: { id: data.labelId },
    select: { applicableLevels: true },
  });

  if (!label) {
    throw new NotFoundError("Label not found", { labelId: data.labelId });
  }

  const levels = label.applicableLevels as AppLevelValue[];

  if (!levels.includes("SESSION")) {
    throw new BadRequestError("Label is not applicable to SESSION level", {
      labelId: data.labelId,
      applicableLevels: levels,
    });
  }
}
```

(Note: `data.labelId !== null` excludes the "explicitly unsetting the label" case from validation — null label is always allowed; non-null requires applicable check.)

#### 3.2.5 New `endpoints/lms/day/admin.test.ts`

Mirror layout of `endpoints/lms/session/admin.test.ts` (`beforeAll` creates coach + otherCoach + active plan + archived plan + labels with various `applicableLevels`; `afterAll` cleans up via `cleanupRaw`). Minimum **14 cases**:

1. **`setLabel` rejects non-owner** — `otherCoach.user.id` on owned plan → `ForbiddenError`. Assert no Week/Day materialization side-effect.
2. **`setLabel` rejects on archived plan** → `ForbiddenError`. Assert no side-effect.
3. **`setLabel(non-existent labelId)`** → `NotFoundError("Label not found")`. Assert no Day materialization (validation happens before upsert).
4. **`setLabel` with label having `applicableLevels=["SESSION","BLOCK"]`** (no DAY) → `BadRequestError("Label is not applicable to DAY level")`. Assert no materialization.
5. **`setLabel(validLabelId)` on empty week** — materializes Week + Day + sets `labelId`. Assert Week+Day exist after, returned `DaySlot.label` matches the label payload (embed proof), `DaySlot.sessions === []`, `DaySlot.dayOfWeek === <passed>`, `DaySlot.notes === null`.
6. **`setLabel(null)` on unmaterialized Day** — **no-op**. Assert returned `DaySlot = { dayOfWeek, label: null, notes: null, sessions: [] }`, no Week/Day created (`cleanupRaw.week.count` and `cleanupRaw.day.count` both 0 after the call). OQ-D regression guard.
7. **`setLabel(null)` on materialized Day with label** — clears the label; Day row remains as breadcrumb (per D7).
8. **`setNotes("test notes")` on empty week** — materializes Week + Day + sets `notes`. Returned `DaySlot.notes === "test notes"`, `DaySlot.label === null`, `DaySlot.sessions === []`.
9. **`setNotes(null)` on unmaterialized Day** — no-op (OQ-D mirror).
10. **`setNotes(over-cap)` rejection** — Zod-layer; verify in contract test, not here.
11. **`setLabel` then `setNotes` on same Day** — both compose; Day has both label and notes. Returned `DaySlot` from second call reflects both fields.
12. **TZ invariance** — `setLabel` on `TZ=Asia/Kolkata` with `startDateParam="2026-05-20"` (Wednesday) persists `Week.startDate` as UTC-midnight Monday `2026-05-18`. Mirror of `endpoints/lms/session/admin.test.ts:503-537`.
13. **Concurrent setLabel + setNotes on same Day** — both succeed; resulting Day has both fields (last write wins on each field independently; not racing on same field).
14. **`setLabel` materializes Day inside an already-materialized Week** — pre-existing Week (no Days yet). Call `setLabel`. Assert Week count stays 1, new Day row created.

Plus consider:

15. **`setLabel(validLabelId)` with sessions on the same Day** — preexisting Day with 2 sessions (each with own label). Call `setLabel(newLabelId)`. Returned `DaySlot.sessions.length === 2`, both sessions' embedded labels intact; Day's own label updated.

#### 3.2.6 Extend `endpoints/lms/week/admin.test.ts`

Add cases to existing `describe("getByPlanAndDate", ...)`:

1. **Empty week — returns null week + 7 empty days**. Assert `result.week === null`, `result.days.length === 7`, every `result.days[i]` has `label === null` AND `notes === null` AND `sessions === []`. Days are in `dayOfWeekValues` order (`MONDAY` first, `SUNDAY` last).
2. **Week with notes only, no Days** — `cleanupRaw.week.create({ data: { planId, startDate, notes: "test" } })`. Assert `result.week.notes === "test"`, `result.days.length === 7`, all 7 empty.
3. **Week with 1 materialized Day (Wednesday, has 0 sessions)** — `cleanupRaw.day.create({ data: { weekId, dayOfWeek: "WEDNESDAY" } })`. Assert `result.days[2]` (Wednesday index — 0-indexed Monday-first) has `dayOfWeek === "WEDNESDAY"`, `label === null`, `notes === null`, `sessions === []`. Other 6 days empty.
4. **Week with 1 Day (Tuesday, has label + 2 sessions, second session has its own label)** — full materialization. Assert: `result.days[1].label` matches the day's label, `result.days[1].sessions.length === 2`, `result.days[1].sessions[0].order === 10` AND `.label === null`, `result.days[1].sessions[1].order === 20` AND `.label` matches. Plus: `result.days[0]` and `result.days[2..6]` are empty.
5. **Sessions sorted asc by order** — Day with sessions inserted out-of-order (`cleanupRaw.session.create` with `order: 20`, then `order: 10`). Returned `result.days[i].sessions` is `[{order:10}, {order:20}]`.
6. **N+1 query prevention** — instrument with `prisma.$on("query", ...)` if simple; OR just assert "single findUnique with deep include" via inspection. **Acceptable to skip if instrumentation is heavy** — the include shape is the proof.

#### 3.2.7 Extend `endpoints/lms/session/admin.test.ts` (OQ-C cases)

Add to existing `describe("create", ...)` and `describe("update", ...)`:

1. **`create` rejects label with applicableLevels=["DAY"]** (no SESSION) → `BadRequestError("Label is not applicable to SESSION level")`. Assert no Session created (`cleanupRaw.session.count` unchanged).
2. **`create` rejects non-existent labelId** → `NotFoundError("Label not found")`. Assert no Session created.
3. **`update` rejects label with applicableLevels=["BLOCK"]** → `BadRequestError`. Assert Session unchanged.
4. **`update(labelId: null)` succeeds** — clearing the label is always allowed (no validation).

### 3.3 Phase 3 — apps/platform consumer adapt

#### 3.3.1 `apps/platform/src/lib/hooks/use-weeks.ts`

**Current `useUpdateWeekNotes.onSuccess`** (lines 25-29):

```ts
onSuccess: (week, { startDate }) => {
  // write back with the caller's startDate string — it is the exact useWeek read key; week.startDate (@db.Date over JSON) would not round-trip
  queryClient.setQueryData(platformKeys.weeks.byDate(planId, startDate), { week });
  toast.success("Week notes saved");
},
```

**Final**:

```ts
onSuccess: (_week, { startDate }) => {
  queryClient.invalidateQueries({ queryKey: platformKeys.weeks.byDate(planId, startDate) });
  toast.success("Week notes saved");
},
```

Rationale (encode in `output.md` § "Принятые решения", not as a code comment): the old `setQueryData({ week })` overwrites the entire cache entry, which after Step 6.2's response shape change would drop the `days` array. Partial merge `{ ...prev, week }` is correct but requires defensive null handling. Full invalidate is simpler and the cost (one extra HTTP request on notes blur) is negligible. Acceptable per the data-flow architecture review.

#### 3.3.2 `apps/platform/src/lib/api/endpoints/weeks.ts`

**No code change.** `createWeeksAPI.getByDate` returns `GetWeekResponse` — the type itself extends, the call signature stays. Verify the file compiles after Phase 1 + 2.

#### 3.3.3 `apps/platform/src/modules/plan-detail/views/plan-detail-view.tsx`

**No code change.** Line 59 `notes={weekData?.week?.notes ?? null}` compiles unchanged. Verify after Phase 1 + 2.

#### 3.3.4 `apps/platform/src/modules/plan-detail/components/week-grid.tsx`, `day-row.tsx`, `week-notes.tsx`

**No code changes** in Step 6.2. WeekGrid renders placeholder `<DayRow date={date} />` independently of week data; DayRow shows "No sessions" stub; WeekNotes consumes `notes` prop unchanged. Verify all compile.

#### 3.3.5 Phase 3 verification (no separate gate — squash § 7)

After Phase 1 + 2 + 3 all staged, Phase 5 global verification runs (§ 3.4).

### 3.4 Phase 4 — global verification (single squash gate)

After all Phase 1-3 edits are staged, before `git commit`:

- `pnpm check-types` (root, 16/16) green.
- `pnpm lint` (root, 16/16) green.
- `pnpm test` (root) — baseline + new contract tests (~13 new cases in `lms/day/day.schema.test.ts` + ~4 in `week-api.schema.test.ts`) + new api-server tests (~14 new in `endpoints/lms/day/admin.test.ts` + ~6 in extended `endpoints/lms/week/admin.test.ts` + ~4 in extended `endpoints/lms/session/admin.test.ts`). Expected: ~874 → ~915 tests, all green.
- `pnpm dep:check` 0 violations across 1113+ modules.
- `TZ=Asia/Kolkata pnpm --filter @repo/api-server test src/endpoints/lms/day/admin.test.ts` green (TZ invariance proof; document in output.md verification notes).
- Grep regressions:
  - `grep -rn "Session\.name\|session\.name" packages/api-server/src/endpoints/lms` → 0 (Session.name carry-forward).
  - `grep -rn "freezeLoadsAtCreation" packages/api-server/src/endpoints/lms packages/api-server/src/mappers/lms` → 0 (carry-forward; `schema.prisma` is the only legal mention).
  - `grep -rn "@repo/contracts/cms/label\|@repo/contracts/cms/exercise" packages apps` → 0 (Step 6.1.5 regression guard).
  - `grep -rn "from.*lms/day" packages/api-server/src` → exists (proves the new mapper + handler is reachable).
- Manual smoke (state in `output.md` § "Сценарий смоук-теста"): `apps/platform` plan-detail page loads, week-notes blur-commit triggers refetch (network tab shows `GET /api/platform/training-plans/.../weeks/...`), notes persist (refresh shows new value), 7-day grid still renders empty stubs.

---

## 4. Out of scope — do NOT build

- **HTTP routes** for `lmsDayMetadataApi` — Step 6.4.
- **HTTP route** for extended `GET .../weeks/[startDate]` — already exists; **only** the response payload schema flips (handled by the existing route picking up the new `GetWeekResponse` type via `getByPlanAndDate` return type).
- **Platform client API + hooks** for Day-metadata — Step 6.5 (`createDayMetadataAPI`, `useUpdateDayLabel`, `useUpdateDayNotes`).
- **Labels platform mirror** (`/api/platform/labels?q=`) — Step 6.3.
- **Session-level applicableLevels enforcement extension to Block-level labels** — Step 7 (Block model not in scope until then).
- **`SessionCard` / `DayRow` UI consumption of `days[i]`** — Steps 6.6 + 6.7.
- **`Session.name` exposure** — indefinite carry-forward. Regression test stays from Step 6.0.
- **`Session.freezeLoadsAtCreation` exposure** — indefinite carry-forward. Regression test stays from Step 6.0.
- **Block / Schema / SchemaRow / Archetype-level CRUD** — Steps 7+.
- **`mapToSessionWithLabel` symbol** in `mappers/lms/`. The shape is built inline inside `mapToDaySlot` via `{ ...mapToSession(s), label: ... }`. Single use site; extract only if a second consumer arises.
- **Day-row auto-cleanup** when sessions + label + notes all become null/empty — per D7 "Day-row that becomes empty after the last session-delete + null label + null notes is **left as a breadcrumb**".
- **Cross-day session move** in `lmsSessionApi.reorder` — explicitly out (Step 6.1 scope was within-day only).
- **`upsertNotes` return-shape extension** to `DaySlot` or full week — stays `Week` scalar. The notes upsert is Week-level; if the client wants the new days[i] state, it invalidates `useWeek` (Phase 3.3.1).
- **Deprecation-shim path** for `getWeekResponseSchema` (back-compat union types). Squash is the only viable strategy per `[[husky-cross-package-squash]]` — never re-explore.

---

## 5. Acceptance criteria

- All 4 Phase verifications pass (§ 3.4).
- File pivot counts roughly:
  - **8 new contract files**: `entities/lms/day/{day.constants,day.schema,day.types,day-api.schema,day-api.types,index}.ts` (6) + `day.schema.test.ts` (1) + extension of `week-api.schema.test.ts` (1 new file if absent, otherwise additive).
  - **3 new api-server files**: `endpoints/lms/day/{admin,index}.ts` (2) + `endpoints/lms/day/admin.test.ts` (1) + `mappers/lms/day.mapper.ts` (1). NB total 4 — count's off, recount.
  - **5 edited api-server files**: `endpoints/lms/week/admin.ts` (extend `getByPlanAndDate`), `endpoints/lms/week/admin.test.ts` (extend), `endpoints/lms/session/admin.ts` (add 2 applicableLevels validation blocks), `endpoints/lms/session/admin.test.ts` (extend), `endpoints/lms/index.ts` (add `./day` barrel line), `mappers/lms/index.ts` (add `./day.mapper` barrel line) — 6 edits actually.
  - **1 edited platform file**: `apps/platform/src/lib/hooks/use-weeks.ts` (swap `setQueryData` for `invalidateQueries`).
  - **1 edited contract file**: `packages/contracts/src/entities/lms/week/week-api.schema.ts` (extend `getWeekResponseSchema`).
  - **1 edited contract barrel**: `packages/contracts/src/entities/lms/index.ts` (add `./day`).
  - **1 edited `package.json`**: `packages/contracts/package.json` exports (add `./lms/day`).
  - **Zero Prisma changes**; **zero `analysis/artifacts/` changes**; **zero seed changes**; **zero new authz guards**; **zero new components/routes/hooks** on the platform side.
- Test deltas: +30..40 cases approximately (13 contract day-slice + 4 week-api extension + 14 day admin + 6 week admin extension + 4 session admin extension). All green; `TZ=Asia/Kolkata` invariance passes and is **non-vacuous** (T17-style dev-time revert of `resolveWeekStartDate` UTC anchor fails at least 1 day-admin case + 1 week-admin case).
- All regression guards from § 3.4 pass (`Session.name`, `freezeLoadsAtCreation`, `cms/{label,exercise}` 0 matches).
- **1 squashed commit on `feat/training-domain`** per § 7. No `--no-verify`.
- Manual smoke documented in `output.md` § "Сценарий смоук-теста" (3 steps minimum: open plan-detail; edit week notes; refresh page).

---

## 6. `output.md` — write `implementation/step-06.2/output.md`

Sections (Russian prose where natural, English for code/paths):

`## Что сделано` · `## Изменённые/созданные файлы` · `## Принятые решения` · `## Возникшие вопросы и как решены` · `## Что отложено` · `` ## Ссылка на `.feature-dev/<ts>/` `` · `## Сценарий смоук-теста` · `## Verification notes` · `## Acceptance criteria self-check`.

In `## Принятые решения`, document at minimum:

- **`DAY_OF_WEEK_TO_PRISMA` hoist** decision (kept duplicated in `endpoints/lms/{day,session}/admin.ts` vs hoisted to `endpoints/lms/_shared/day-of-week.ts`). Either choice OK; document the trade-off.
- **`mapToSessionWithLabel` inline vs extracted** — kept inline per § 4 directive; flag if any future consumer changes the calculus.
- **`useUpdateWeekNotes.onSuccess` invalidate vs partial-merge** — chose invalidate per § 3.3.1; flag if a second mutation surfaces same concern.
- **`endpoints/lms/index.ts` and `mappers/lms/index.ts` barrel sort order** if any deviation from strict alphabetical.

In `## Возникшие вопросы и как решены`, document any executor-side surfacings (especially Stage 6 QA findings) and resolution path (`AskUserQuestion` ratify, etc).

In `## Verification notes`, include:

- The full `pnpm check-types` / `lint` / `test` / `dep:check` outputs (one-line summary + counts).
- The `TZ=Asia/Kolkata` test run output + at least one specific dev-time-revert-proof line ("After reverting `resolveWeekStartDate` UTC-anchor to a 1-line `getMonday(parseStartDate(...))` no-UTC variant, day-admin test case #12 fails with `expected 18 to be 17`; restored").
- All grep-regression command outputs (Session.name, freezeLoadsAtCreation, cms/{label,exercise}, new lms/day import presence).
- The single squashed commit hash.

In `## Что отложено`, include:

- Memory-hygiene sweep on `~/.claude/projects/.../memory/` for stale `getWeekResponseSchema` references (planner-side housekeeping for close-out lesson — should be near-zero since the only mention is in workflow planning docs).
- Any pre-existing minor issues observed in the touched files (e.g. `getMonday`/`parseDateParam` test coverage gap — pre-Step-5 known; left).

---

## 7. Commits

**1 squashed commit on `feat/training-domain`** — mandatory per `[[husky-cross-package-squash]]`. Subject + body:

```
feat(training-domain): extend week response to 7-day shape with embedded label and add day-metadata side-channel

Implements D7-ratified week-detail surface. GET .../weeks/[startDate] now returns
{ week: Week | null, days: DayWithSessions[7] } — server always materializes all
7 weekday slots; client never branches on materialization state. Adds
lmsDayMetadataApi with setLabel + setNotes side-channel (each Serializable tx
with intra-tx plan TOCTOU re-check, label-applicableLevels validation for
setLabel, lazy week+day materialization; null-on-unmaterialized = no-op per
OQ-D). Inline Step 6.1 follow-up adds applicableLevels.includes("SESSION")
enforcement to lmsSessionApi.{create,update} (OQ-C).

Cross-package breaking change: getWeekResponseSchema's shape changes from
{ week } to { week, days[7] }. apps/platform/use-weeks.useUpdateWeekNotes
switches from setQueryData (would drop days from cache) to invalidateQueries.
plan-detail-view, week-grid, day-row, week-notes unchanged (placeholder UI
consumption stays until Step 6.6).

Single squashed commit per [[husky-cross-package-squash]] — any per-layer
split leaves a downstream package broken under .husky/pre-commit
'turbo check-types --filter="...[HEAD]"'. Deprecation-shim path dismissed
in thesis cycle (would require contracts → api-server back-compat union
types; defeats embed cleanliness).

New contract slice: packages/contracts/src/entities/lms/day/ (6 files +
1 schema test). New api-server: endpoints/lms/day/admin.ts + admin.test.ts +
mappers/lms/day.mapper.ts. Extended: endpoints/lms/week/admin.ts +
admin.test.ts, endpoints/lms/session/admin.ts + admin.test.ts, both lms
barrels, contracts/lms/index.ts barrel, packages/contracts/package.json
exports map. Zero Prisma changes, zero analysis-artifacts changes, zero
seed changes, zero new authz guards.

Tests: +~40 cases (13 contract day-slice + 4 week-api extension + 14 day
admin + 6 week admin + 4 session admin). TZ=Asia/Kolkata invariance proof
for day-admin (T17-style dev-time revert non-vacuity verified).
```

(Body line length ≤150 chars — split into reflow paragraphs as shown.)

**If Stage 6 QA surfaces a critical that requires a code change**, fold the fix into the same squash before committing (re-stage everything, re-run verification, then commit). **Do not add a second `fix(...)` commit** — would re-enter the husky pre-commit gate for the broken intermediate (same trap as Step 6.1.5). The squash is atomic-final.

**Commit-strategy sanity check** (run before staging anything):

```bash
cat .husky/pre-commit  # confirm "turbo check-types --filter='...[HEAD]'" is still gate
cat .husky/pre-push    # confirm "dep:check + lint check-types" is still gate
```

If hooks have changed since this prompt was written → STOP and surface. Don't re-derive a multi-commit strategy from a different hook config silently.

**Never** `--no-verify` / `--no-edit` / `--no-gpg-sign`. If pre-commit's `lint-staged` runs Prettier and reformats files, **let it** — the reformatted version is the new HEAD content and the commit proceeds with the reformat included.
