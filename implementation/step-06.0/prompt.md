# Step 6.0 — Session contract slice + `_shared` namespace

> You are an **executor** session in the training-domain integration workflow. This prompt is self-contained: execute it via **`/feature`** (full pipeline — new contract entity + new namespace + 2 test files, ~10 files; not `/feature small`). Read `implementation/WORKFLOW.md` first for the durable rules. Write `implementation/step-06.0/output.md` when done, per the format at the bottom.

---

## 0. Hard triggers — STOP and surface to the user

This is the **4th attempt** at this domain; the prior three were deleted. If, while reading the codebase, you encounter any trace of a prior implementation — vocabulary like `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — **STOP and surface to the user**. Do not consume it as a reference. The only legitimate model source is `analysis/artifacts/` + the live Prisma schema.

If you hit a **prompt-vs-codebase conflict** (this prompt says X, the codebase clearly does Y) or a **domain-model limitation** (the model in `analysis/` can't express what the step needs): **STOP, state the conflict with a hypothesis ("the codebase does Y; I think the prompt is wrong because…; right?"), and wait.** Do not silently comply with a wrong prompt; do not silently bend the model. The planner owns prompt errors and answers fast.

---

## 1. What this step is

First atomic slice of **Step 6.x** (Day-level + Session-level operations decomposed into 8 sub-steps). Step 6.0 ships two **contract-only** deliverables — no api-server, no platform, no UI:

1. **New `packages/contracts/src/entities/lms/_shared/` namespace** housing `dayOfWeekSchema` — a mirrored enum for Prisma's `DayOfWeek` (`MONDAY..SUNDAY`). `_shared` is created now because Step 6.2 (Day metadata) will also import it; doing it once here avoids a cross-step move later. The BLOG_CATEGORY mirror precedent (Step 3 D11) applies — the contract layer never imports from `@prisma/client` (`contracts-no-prisma` dependency-cruiser rule).

2. **New `packages/contracts/src/entities/lms/session/` slice** — full-CRUD contract surface (entity schema, create/update/reorder write schemas, api-path-params, request/response schemas, types, test, barrel). Future Step 6.1..6.7 phases — `lmsSessionApi`, platform routes, hooks, UI — depend on this slice.

**The contract is internally complete and type-safe but has zero consumers in this step.** That is the correct state for the atomic boundary; consumers arrive in Steps 6.1+.

**No Prisma schema change.** Session model was ported in Step 2 (`schema.prisma` lines 633-651); DayOfWeek enum is at lines 477-485. No `db:reset`, no seed change, no edit to `analysis/artifacts/`.

**Two deferred sub-decisions (recorded in `PLANNING_STATE.md` § "Deferred sub-decisions"; restating here as binding guardrails for this step):**

- **Q10 — `Session.freezeLoadsAtCreation`**: the field exists in Prisma (`schema.prisma:639`, default `false`) as an edge-case flag for "testing weeks" (`analysis/artifacts/05-synthesis/edge-cases.md §2.4`, `06-formalization/implementation-notes.md §3.8`, `00-meta/phase-06-prompt.md Q10`). The default coach workflow uses **live formula resolution** (DP2): `1RM` is dynamic and percentage-based loads resolve against the athlete's current 1RM. Snapshot mode is the **edge case**, not the default. **Step 6.0 contract does NOT expose this field.** No `freezeLoadsAtCreation` in `sessionSchema`, `createSessionSchema`, or `updateSessionSchema`. The DB column stays at default `false`; nobody writes or reads it through the contract layer in this cycle. A future step adds it when (and only when) a concrete coach use-case for the toggle materializes.

- **`Session.name`**: there is **no `name` field** in Prisma's Session model. Do **NOT** add one to the contract "for flexibility". Session identity for the coach is `(order, label?, notes?)`; UI presentation (in Step 6.7) will use `label.name || "Session N"`. Engineering instincts toward optional name fields = anti-pattern per the "instinct-domain-modeling" lesson (see `implementation/IMPLEMENTATION_LOG.md` § "Lesson learned" Step 6.0 addendum).

**Branch**: `feat/training-domain` (single long-lived, recreated from `main` after PR #191 merged at Step 5 close-out). Per-layer conventional-commits, all-lowercase subjects, body lines ≤150 chars. Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — if a hook fails, fix the root cause.

---

## 2. Read these first (verbatim — do not skim)

**Domain**:

- `packages/api-server/prisma/schema.prisma` lines 633-651 — `Session` model. Confirm: no `name` field; `freezeLoadsAtCreation Boolean @default(false)` exists but is OUT OF SCOPE for this slice.
- `packages/api-server/prisma/schema.prisma` lines 477-485 — `DayOfWeek` enum (7 values, `MONDAY..SUNDAY`).
- `analysis/artifacts/06-formalization/er-final.md` §5 #7 — sparse-integer order semantics (10/20/30, ratified Phase 4 Q6). `Session.order` is a positive integer; reorder operations recompute on multiples of 10.

**Templates (mirror these in structure, not necessarily verb-by-verb)**:

- `packages/contracts/src/entities/lms/week/` — full slice layout (7 files). Match the file naming and barrel structure exactly. Note `week.schema.ts` uses `z.coerce.date()` for `@db.Date` (Session has no `@db.Date` field; both timestamps are full `DateTime` — use `z.date()` for them, same as `weekSchema`'s `createdAt`/`updatedAt`).
- `packages/contracts/src/entities/lms/training-plan/` — full-CRUD contract layout (Week was read-mostly; Session is POST + PUT + DELETE + PATCH:reorder).
- `packages/contracts/src/entities/cms/label/label.schema.test.ts` — entity-schema test pattern (`safeParse`-based accept/reject for both successful and failed validation, cap test for `MAX_NOTES_LENGTH`). Mirror this rather than `lms/week/week-api.schema.test.ts`'s api-only pattern — Session has create/update/reorder write schemas that warrant entity-level coverage.

**Registration** (additive only — preserve every existing entry; do not delete or reorder unrelated lines):

- `packages/contracts/src/entities/lms/index.ts` (currently exports `./plan-enrollment`, `./training-plan`, `./week`) — add `./_shared` and `./session`. **Do not remove `./plan-enrollment`** — it is a legitimate sibling entity in this bounded context (pre-Step 5).
- `packages/contracts/package.json` `exports` map (lines 19-22 are the current `./lms*` cluster: `./lms` root, `./lms/plan-enrollment`, `./lms/training-plan`, `./lms/week`) — alphabetical-with-underscore-first. Add `./lms/_shared` and `./lms/session`; **keep the `./lms` root entry and `./lms/plan-enrollment` line untouched**. The map has **no wildcard** — missing entries fail at `@repo/contracts/lms/session` resolution.

**Codebase rules (sacred — non-negotiable)**:

- `contracts-no-prisma` (dependency-cruiser `.dependency-cruiser.cjs`): files under `packages/contracts/**` must NOT import from `@prisma/client`. `dayOfWeekSchema` is a **mirror** enum (literal string union), not a Prisma re-export.
- One slice / one schema-set per file. No multi-component files.
- `z.string().cuid()` for cuid columns (consistent with `weekSchema`, `trainingPlanSchema`).
- No code comments unless encoding a non-obvious _why_ (single line). Schema files have none historically.
- No `as any` / `as unknown` / unjustified `!` assertions.

---

## 3. Scope

Two file groups + registration. Every file's exact contents are described below.

### 3.1 `_shared/day-of-week.ts` + barrel + test

**`packages/contracts/src/entities/lms/_shared/day-of-week.ts`**:

```ts
import { z } from "zod";

export const dayOfWeekValues = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
] as const;

export const dayOfWeekSchema = z.enum(dayOfWeekValues);

export type DayOfWeek = z.infer<typeof dayOfWeekSchema>;
```

**`packages/contracts/src/entities/lms/_shared/day-of-week.test.ts`**:

```ts
import { describe, expect, it } from "vitest";

import { dayOfWeekSchema, dayOfWeekValues } from "./day-of-week";

describe("dayOfWeekSchema", () => {
  it("accepts every value in dayOfWeekValues", () => {
    for (const value of dayOfWeekValues) {
      expect(dayOfWeekSchema.safeParse(value).success).toBe(true);
    }
  });

  it("rejects values outside the enum", () => {
    expect(dayOfWeekSchema.safeParse("Monday").success).toBe(false);
    expect(dayOfWeekSchema.safeParse("OCTODAY").success).toBe(false);
    expect(dayOfWeekSchema.safeParse(0).success).toBe(false);
    expect(dayOfWeekSchema.safeParse(null).success).toBe(false);
  });
});
```

**`packages/contracts/src/entities/lms/_shared/index.ts`**:

```ts
export * from "./day-of-week";
```

### 3.2 Session slice — 7 files

**`packages/contracts/src/entities/lms/session/session.constants.ts`**:

```ts
export const SESSION_CONSTANTS = {
  MAX_NOTES_LENGTH: 2000,
} as const;
```

(2000 matches `WEEK_CONSTANTS.MAX_NOTES_LENGTH` and `TRAINING_PLAN_CONSTANTS.MAX_DESCRIPTION_LENGTH` — consistency over headroom.)

**`packages/contracts/src/entities/lms/session/session.schema.ts`**:

```ts
import { z } from "zod";

import { SESSION_CONSTANTS } from "./session.constants";

export const sessionSchema = z.object({
  id: z.string().cuid(),
  dayId: z.string().cuid(),
  order: z.number().int().positive(),
  labelId: z.string().cuid().nullable(),
  notes: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createSessionSchema = z.object({
  labelId: z.string().cuid().nullable().optional(),
  notes: z.string().max(SESSION_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
});

export const updateSessionSchema = createSessionSchema;

export const reorderSessionsSchema = z.object({
  orderedIds: z.array(z.string().cuid()).min(1),
});
```

Notes:

- `createSessionSchema` is intentionally minimal — an empty `{}` is valid (the "+ Add session" flow creates an empty slot; label/notes are set inline afterwards in Step 6.7 UI).
- `updateSessionSchema = createSessionSchema` is a deliberate alias — same fields are mutable on update as on create; if the two schemas need to diverge in a later step, the alias gets split there.
- **No `freezeLoadsAtCreation`, no `name`** — see § 1 deferred sub-decisions.

**`packages/contracts/src/entities/lms/session/session-api.schema.ts`**:

```ts
import { z } from "zod";

import { dayOfWeekSchema } from "../_shared";

import {
  createSessionSchema,
  reorderSessionsSchema,
  sessionSchema,
  updateSessionSchema,
} from "./session.schema";

export const sessionByDayParamsSchema = z.object({
  planId: z.string().cuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dayOfWeek: dayOfWeekSchema,
});

export const sessionByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  sessionId: z.string().cuid(),
});

export const createSessionRequestSchema = createSessionSchema;
export const createSessionResponseSchema = sessionSchema;

export const updateSessionRequestSchema = updateSessionSchema;
export const updateSessionResponseSchema = sessionSchema;

export const reorderSessionsRequestSchema = reorderSessionsSchema;
export const reorderSessionsResponseSchema = z.object({
  sessions: z.array(sessionSchema),
});
```

Address-shape rationale (per planner thesis Q2 hypothesis, ratified):

- `sessionByDayParamsSchema` — POST + reorder address (`(planId, startDate, dayOfWeek)`); the session being created or reordered lives inside a specific day-slot.
- `sessionByIdParamsSchema` — PUT/DELETE address by PK (`(planId, sessionId)`); the server does one JOIN through `session → day → week → plan` to verify ownership. Simpler client wiring than carrying the full path tuple for every mutate.

**`packages/contracts/src/entities/lms/session/session.types.ts`**:

```ts
import { type z } from "zod";

import {
  type createSessionSchema,
  type reorderSessionsSchema,
  type sessionSchema,
  type updateSessionSchema,
} from "./session.schema";

export type Session = z.infer<typeof sessionSchema>;
export type CreateSessionData = z.infer<typeof createSessionSchema>;
export type UpdateSessionData = z.infer<typeof updateSessionSchema>;
export type ReorderSessionsData = z.infer<typeof reorderSessionsSchema>;
```

**`packages/contracts/src/entities/lms/session/session-api.types.ts`**:

```ts
import { type z } from "zod";

import {
  type createSessionRequestSchema,
  type createSessionResponseSchema,
  type reorderSessionsRequestSchema,
  type reorderSessionsResponseSchema,
  type sessionByDayParamsSchema,
  type sessionByIdParamsSchema,
  type updateSessionRequestSchema,
  type updateSessionResponseSchema,
} from "./session-api.schema";

export type SessionByDayParams = z.infer<typeof sessionByDayParamsSchema>;
export type SessionByIdParams = z.infer<typeof sessionByIdParamsSchema>;
export type CreateSessionRequest = z.infer<typeof createSessionRequestSchema>;
export type CreateSessionResponse = z.infer<typeof createSessionResponseSchema>;
export type UpdateSessionRequest = z.infer<typeof updateSessionRequestSchema>;
export type UpdateSessionResponse = z.infer<typeof updateSessionResponseSchema>;
export type ReorderSessionsRequest = z.infer<typeof reorderSessionsRequestSchema>;
export type ReorderSessionsResponse = z.infer<typeof reorderSessionsResponseSchema>;
```

**`packages/contracts/src/entities/lms/session/session.schema.test.ts`** — mirror `cms/label/label.schema.test.ts` structure. Coverage (each case = one `it()`, `safeParse`-based):

- `sessionSchema`:
  - Accepts a fully-populated valid object (all fields).
  - Accepts `labelId: null` and `notes: null`.
  - Rejects `order: 0` and `order: -1` (positive-int constraint).
  - Rejects `order: 1.5` (int constraint).
  - Rejects a non-cuid `id`.
- `createSessionSchema`:
  - Accepts an empty `{}` (empty slot creation).
  - Accepts `{ labelId: "ckx..." }` alone.
  - Accepts `{ notes: "warmup focus" }` alone.
  - Accepts `{ labelId: null, notes: null }` (explicit clear).
  - Rejects a `notes` string of length `MAX_NOTES_LENGTH + 1`.
  - Rejects a non-cuid `labelId`.
- `reorderSessionsSchema`:
  - Accepts a `[cuid1, cuid2, cuid3]` array.
  - Rejects an empty array (`min(1)`).
  - Rejects an array containing a non-cuid string.

Note: `updateSessionSchema` is the same alias as `createSessionSchema`; reuse the same suite of assertions referring to `updateSessionSchema` for symmetry (a small extra `describe` block).

**`packages/contracts/src/entities/lms/session/index.ts`**:

```ts
export * from "./session.constants";
export * from "./session.schema";
export * from "./session.types";
export * from "./session-api.schema";
export * from "./session-api.types";
```

### 3.3 Registration

**Additive only. Preserve every existing entry. Do not delete or reorder unrelated lines.** Run `git show HEAD:packages/contracts/src/entities/lms/index.ts` and `git show HEAD:packages/contracts/package.json` at task start to confirm the current state matches what is quoted below — if not, **STOP and surface to the planner**.

**`packages/contracts/src/entities/lms/index.ts`** — current state (verbatim at planning time):

```ts
export * from "./plan-enrollment";
export * from "./training-plan";
export * from "./week";
```

Final state (added `_shared` and `session`, all others untouched; alphabetical with underscore-first):

```ts
export * from "./_shared";
export * from "./plan-enrollment";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

**`packages/contracts/package.json` `exports` map** — current `./lms*` cluster (verbatim at planning time, lines 19-22):

```json
"./lms": "./src/entities/lms/index.ts",
"./lms/plan-enrollment": "./src/entities/lms/plan-enrollment/index.ts",
"./lms/training-plan": "./src/entities/lms/training-plan/index.ts",
"./lms/week": "./src/entities/lms/week/index.ts",
```

Final state (added `./lms/_shared` and `./lms/session`; existing entries kept as-is, alphabetical-with-underscore-first):

```json
"./lms": "./src/entities/lms/index.ts",
"./lms/_shared": "./src/entities/lms/_shared/index.ts",
"./lms/plan-enrollment": "./src/entities/lms/plan-enrollment/index.ts",
"./lms/session": "./src/entities/lms/session/index.ts",
"./lms/training-plan": "./src/entities/lms/training-plan/index.ts",
"./lms/week": "./src/entities/lms/week/index.ts",
```

(`./lms` root entry stays first; underscore sorts before letters in JSON-key convention. Surrounding `./cms/*`, `./coaching/*`, `./iam/*`, `./storage/*` clusters are untouched.)

---

## 4. Out of scope — do NOT build

- **ANY api-server code.** `lmsSessionApi`, mappers, route factories, integration tests, `_shared/date.ts` extraction — all Step 6.1.
- **ANY platform code.** Routes, hooks, client API, UI — Steps 6.4–6.7.
- **ANY mapper.** Session mapper lives in `packages/api-server/src/mappers/lms/` and is Step 6.1.
- **`Session.freezeLoadsAtCreation`** in any schema — deferred (Q10 carry-forward). Field stays Prisma-only with default `false`.
- **`Session.name`** — schema does not have it; do not add.
- **Extending `getWeekResponseSchema`** to embed `days[]` or `sessions[]` — that's Step 6.2.
- **Any Prisma schema change**, `db:reset`, seed change, or `analysis/artifacts/` edit.

---

## 5. Acceptance criteria

- `pnpm --filter @repo/contracts check-types` green.
- `pnpm --filter @repo/contracts lint` green.
- `pnpm --filter @repo/contracts test` green — including the 2 new test files (`day-of-week.test.ts` with 2 cases; `session.schema.test.ts` with the cases listed in § 3.2).
- `pnpm dep:check` clean — `contracts-no-prisma` holds (no `@prisma/client` import anywhere in the slice).
- Root `pnpm check-types` and `pnpm lint` green across all 16 workspaces (no consumers yet, so this is a sanity check that nothing accidentally regressed).
- No `as any` / `as unknown` / unjustified `!`. No code comments (no non-obvious _why_ to encode in this slice).
- **Smoke-test: N/A** — contract-only step, no user-visible surface.

---

## 6. `output.md` — write `implementation/step-06.0/output.md`

Sections (Russian prose where natural, English for code/paths):

`## Что сделано` · `## Изменённые/созданные файлы` · `## Принятые решения` · `## Возникшие вопросы и как решены` · `## Что отложено` · `` ## Ссылка на `.feature-dev/<ts>/` `` · `## Verification notes` · `## Acceptance criteria self-check`.

**Omit `## Сценарий смоук-теста`** — explicitly N/A for contract-only steps. State this in `## Verification notes`.

---

## 7. Commits

Per-layer conventional-commits on `feat/training-domain`, all-lowercase subjects, body lines ≤150 chars. Suggested layering — single commit, since `_shared` and Session land together:

```
feat(contracts): add session slice and lms _shared namespace
```

If `/feature`'s plan stage produces a clean 2-commit split (e.g. `_shared` first then Session), that is also fine. Never bypass hooks; fix root causes.
