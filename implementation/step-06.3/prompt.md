# Step 6.3 — `lmsLabelPlatformApi` (read-only platform mirror)

> You are an **executor** session in the training-domain integration workflow. This prompt is self-contained: execute it via **`/feature small`** (lightweight pipeline — additive only, no breaking change, ~4 files of new/edited code + 1 test file, no Prisma, no analysis-artifacts touch). Read `implementation/WORKFLOW.md` first for the durable rules. Write `implementation/step-06.3/output.md` when done, per the format at the bottom.

---

## 0. Hard triggers — STOP and surface to the user

This is the **4th attempt** at the training domain; the prior three were deleted. If, while reading the codebase, you encounter any trace of a prior implementation — vocabulary like `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — **STOP and surface to the user**. Do not consume it as a reference. The only legitimate model source is `analysis/artifacts/` + the live Prisma schema.

If you hit a **prompt-vs-codebase conflict** or a **stale verbatim quote** (the prompt's "current state" of a barrel / file content doesn't match `git show HEAD:<path>`): **STOP, state the conflict with a hypothesis, and wait.** Prior precedents — Step 6.0 CONTEXT-001 (barrel drift), Step 6.1.5 Q1 (husky hook strategy mismatch), Step 6.1.5 Q2 (`@repo/api-server/cms` admin-import miss), Step 6.2 CONTEXT-001 (HTTP route handler manual-wrap). Don't apply silently.

**Pre-task verification** — run `git show HEAD:<path>` and confirm verbatim snippets in § 2 match:

- `packages/contracts/src/entities/lms/label/{label-api.schema,label-api.types,index}.ts`
- `packages/api-server/src/endpoints/lms/label/admin.ts` + the **absence of `index.ts`** in that folder
- `packages/api-server/src/endpoints/lms/index.ts`
- `packages/api-server/src/authz/guards.ts:42-55` (`requireCoachLikeRole`)
- `.husky/{pre-commit,pre-push}` + `turbo.json` (per `[[husky-cross-package-squash]]` — even though this step is additive, verify hooks for § 7 strategy)

If any drifts → STOP and surface.

**`[[planner-consumer-pattern-read]]` note**: Step 6.3 adds a **new** api method + a **new** schema. It does NOT change any existing contract response shape. No HTTP route handlers, hooks, or downstream mappers consume the new symbols yet (Step 6.4 wires the HTTP route, Step 6.5 wires the hook). No consumer-pattern surface to walk. The 6th-flavour pre-flight is satisfied by enumeration: zero existing consumers → zero risk.

---

## 1. What this step is

Provide platform (coach UI) a **read-only mirror** of the global labels catalog so future UI sub-steps (6.6 + 6.7) can autocomplete Day-label and Session-label selections via `useLabelSearch()` against server-side filtered/capped results.

**Why this step exists**:

- Admin `cmsLabelAdminApi` (`endpoints/lms/label/admin.ts` after Step 6.1.5 namespace move) is for the **admin** surface — manages label lifecycle (create/update/delete). Coach platform users should not be granted admin role just to read labels.
- Labels are **globally visible** per `analysis/artifacts/05-synthesis/domain-model.md §0 inheritance recap #15` (Labels catalog — Option C: единый global namespace + soft `applicable_levels` metadata). No tenant-scoping; all coaches see all labels.
- Autocomplete typeahead requires **server-side filtering** — submitting on each keystroke + filtering client-side over the full ~100-label catalog adds unnecessary client-side work as the library grows.

**Five deliverables** (2 atomic commits per § 7):

1. **Contract additions** — `packages/contracts/src/entities/lms/label/label-api.schema.ts` gains `labelSearchParamsSchema` (`{ q?: string min(1) max(200) }`); `label-api.types.ts` gains the `z.infer` types. **No new schema for response** — reuse `getLabelsResponseSchema = z.array(labelSchema)` directly (admin and platform return the same array shape; introducing an alias adds no value today; if platform diverges later — paginate, slim payload — extract then).

2. **`lmsLabelPlatformApi.list(userId, query?)`** in **new** file `packages/api-server/src/endpoints/lms/label/platform.ts`. Auth: `requireCoachLikeRole` outer. Body: optional substring `where: { nameLower: { contains: q.toLowerCase() } }`, sort `nameLower asc`, cap `take: 50`. Returns `Label[]` via `mapToLabel`.

3. **Folder structural symmetry fix** — `endpoints/lms/label/` currently has NO `index.ts` (asymmetric vs `endpoints/lms/{session,week,training-plan,plan-enrollment,day}/` which all have one). Create `endpoints/lms/label/index.ts` with `export * from "./admin"; export * from "./platform";`. Then change `endpoints/lms/index.ts` line `export * from "./label/admin";` to `export * from "./label";` (resolves through the new barrel). This brings label/ folder into structural alignment with siblings. **Note**: `endpoints/lms/exercise/` has the same asymmetry; leave it untouched (out of scope; flag in `## Что отложено` for a later structural-symmetry sweep).

4. **Test suite** — new `packages/api-server/src/endpoints/lms/label/platform.test.ts`. ~10 cases (see § 3.4.1). Mirror `endpoints/lms/label/admin.test.ts` cleanup pattern.

5. **Verification** — `pnpm check-types` 16/16 + `pnpm lint` 16/16 + `pnpm test` baseline + ~10 new cases + `pnpm dep:check` 0/1124+. Smoke-test: **N/A** (api-server-only step, no user-visible surface yet).

**No HTTP route**, **no platform client API/hook**, **no UI** in Step 6.3 — those are Steps 6.4/6.5/6.6+.

**Branch**: `feat/training-domain`. **2 atomic commits per § 7** — additive only, no breaking change, no intermediate broken trees. `[[husky-cross-package-squash]]` does NOT mandate squash here (rule applies to cross-package breaking changes).

---

## 2. Read these first (verbatim — do not skim)

**Domain anchor**:

- `analysis/artifacts/05-synthesis/domain-model.md` §0 inheritance recap #15 (Labels catalog: Option C — global namespace + soft `applicable_levels`). Confirms: no tenant scoping; all coaches see all labels; `applicable_levels` is presentation hint, not visibility filter.

**Contract slice (current state — verbatim)**:

- `packages/contracts/src/entities/lms/label/label.schema.ts` (40 lines after Step 6.1.5 move). `labelSchema` shape with `id, name, nameLower, applicableLevels, notes, ts`. `createLabelSchema` + `updateLabelSchema` are form-input shapes (used by admin only — out of scope).

- `packages/contracts/src/entities/lms/label/label-api.schema.ts` (21 lines) — **current state**:

  ```ts
  import { z } from "zod";

  import { idParamSchema } from "../../../common";

  import { createLabelSchema, labelSchema, updateLabelSchema } from "./label.schema";

  export const getLabelsResponseSchema = z.array(labelSchema);

  export const getLabelByIdParamsSchema = idParamSchema;

  export const createLabelRequestSchema = createLabelSchema;

  export const updateLabelParamsSchema = idParamSchema;

  export const updateLabelRequestSchema = updateLabelSchema;

  export const deleteLabelParamsSchema = idParamSchema;

  export const getLabelsPageDataResponseSchema = z.object({
    labels: getLabelsResponseSchema,
  });
  ```

- `packages/contracts/src/entities/lms/label/label-api.types.ts` (27 lines) — **current state**:

  ```ts
  import { type z } from "zod";

  import {
    type createLabelRequestSchema,
    type deleteLabelParamsSchema,
    type getLabelByIdParamsSchema,
    type getLabelsPageDataResponseSchema,
    type getLabelsResponseSchema,
    type updateLabelParamsSchema,
    type updateLabelRequestSchema,
  } from "./label-api.schema";

  export type GetLabelsResponse = z.infer<typeof getLabelsResponseSchema>;

  export type GetLabelByIdParams = z.infer<typeof getLabelByIdParamsSchema>;

  export type CreateLabelRequest = z.infer<typeof createLabelRequestSchema>;

  export type UpdateLabelParams = z.infer<typeof updateLabelParamsSchema>;

  export type UpdateLabelRequest = z.infer<typeof updateLabelRequestSchema>;

  export type DeleteLabelParams = z.infer<typeof deleteLabelParamsSchema>;

  export type GetLabelsPageDataResponse = z.infer<typeof getLabelsPageDataResponseSchema>;

  export type AdminLabelsPageData = GetLabelsPageDataResponse;
  ```

- `packages/contracts/src/entities/lms/label/index.ts` (5 lines) — barrel, unchanged in Step 6.3:
  ```ts
  export * from "./label.schema";
  export * from "./label.types";
  export * from "./label.constants";
  export * from "./label-api.schema";
  export * from "./label-api.types";
  ```

**api-server (current state — verbatim)**:

- `packages/api-server/src/endpoints/lms/label/admin.ts` (109 lines after Step 6.1.5 move). **Pattern reference only** — don't modify. Notable: exports `cmsLabelAdminApi` (CMS-prefixed symbol — deferred rename per Step 6.1.5; do NOT rename in Step 6.3). Reuses `prisma`, `mapToLabel`, `findOrThrow`, `handlePrismaError` from existing module structure.

- **Folder listing** `packages/api-server/src/endpoints/lms/label/` — exactly 2 files: `admin.ts`, `admin.test.ts`. **No `index.ts`** (asymmetry vs siblings — see § 3.2.3 fix).

- `packages/api-server/src/endpoints/lms/index.ts` (current state — 8 lines):

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

  Note `./label/admin` is a direct file re-export (label folder lacks index.ts). Step 6.3 changes this to `./label` (resolved via new label/index.ts).

- `packages/api-server/src/authz/guards.ts:42-55` — `requireCoachLikeRole`:

  ```ts
  const COACH_LIKE_ROLES: ReadonlySet<UserRole> = new Set([
    UserRole.COACH,
    UserRole.HEAD_COACH,
    UserRole.ADMIN,
  ]);

  export const requireCoachLikeRole = async (userId: string): Promise<UserRole> => {
    const user = await findOrThrow(
      prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
      "User",
    );

    const role = ROLE_MAP[user.role];

    if (!COACH_LIKE_ROLES.has(role)) {
      throw new ForbiddenError("Coach role required");
    }

    return role;
  };
  ```

- `packages/api-server/src/mappers/lms/label.mapper.ts` (14 lines after Step 6.1.5) — `mapToLabel(row: PrismaLabel): Label` plain field copy. Reuse.

- `packages/api-server/src/db/client.ts` — `prisma` instance.

- `packages/api-server/src/utils/index.ts` — `handlePrismaError` (not needed for Step 6.3's read-only API; reads don't throw the P2002/P2003 family).

**Test infra**:

- `packages/api-server/src/test/helpers.ts` — `createTestCoach` (returns `{user, profile}` with COACH role), `cleanupRaw` for setup/teardown bypassing soft-delete logic.
- For non-coach role tests: create a User directly with `cleanupRaw.user.create({ data: { ..., role: "ATHLETE" } })`. There's no `createTestAthlete` helper visible; if one exists, prefer it. Verify in `test/helpers.ts` at task-time.

**Hooks + pipeline (per `[[husky-cross-package-squash]]` mandatory check)**:

- `.husky/pre-commit` runs `turbo check-types --filter="...[HEAD]"`. Step 6.3 commit 1 touches contracts only; api-server check-types runs but compiles green (new symbol unused). Commit 2 touches api-server; uses new schemas. Both compile cleanly — **per-layer commits are safe here**.
- `.husky/pre-push` runs `dep:check + lint check-types --filter="...[origin/main]"`. Final state after both commits passes.
- `turbo.json` `tasks.check-types`: `dependsOn: ["^check-types"]` — standard fan-out.

**Codebase rules (sacred)**:

- One slice / one schema-set per file.
- **No code comments** unless encoding non-obvious _why_ (single line ≤150 chars per commitlint).
- No `as any` / `as unknown` / unjustified `!`. Mapper `applicableLevels as AppLevelValue[]` exception already established.
- `--no-verify` / `--no-edit` / `--no-gpg-sign` are forbidden. If commitlint `subject-case` or `body-max-line-length` fails, reformat — don't bypass. **Subject cap is 100 chars** (per Step 6.2 close-out commit's 103-char rejection lesson).

---

## 3. Scope

### 3.1 Phase 1 — contracts (additive)

#### 3.1.1 Extend `packages/contracts/src/entities/lms/label/label-api.schema.ts`

**Current state** (verbatim above). **Final state** — append after existing `deleteLabelParamsSchema`, before `getLabelsPageDataResponseSchema`:

```ts
export const labelSearchParamsSchema = z.object({
  q: z.string().min(1).max(200).optional(),
});
```

Full final file:

```ts
import { z } from "zod";

import { idParamSchema } from "../../../common";

import { createLabelSchema, labelSchema, updateLabelSchema } from "./label.schema";

export const getLabelsResponseSchema = z.array(labelSchema);

export const getLabelByIdParamsSchema = idParamSchema;

export const createLabelRequestSchema = createLabelSchema;

export const updateLabelParamsSchema = idParamSchema;

export const updateLabelRequestSchema = updateLabelSchema;

export const deleteLabelParamsSchema = idParamSchema;

export const labelSearchParamsSchema = z.object({
  q: z.string().min(1).max(200).optional(),
});

export const getLabelsPageDataResponseSchema = z.object({
  labels: getLabelsResponseSchema,
});
```

**Rationale**: `getLabelsResponseSchema = z.array(labelSchema)` is reused as the platform response shape — admin and platform return identical arrays. **No new alias** introduced (`labelSearchResponseSchema`); KISS — if the platform later diverges (cursor pagination, slim payload), extract then.

#### 3.1.2 Extend `packages/contracts/src/entities/lms/label/label-api.types.ts`

Append the `z.infer` type for the new schema. Alphabetical order in imports + exports:

```ts
import { type z } from "zod";

import {
  type createLabelRequestSchema,
  type deleteLabelParamsSchema,
  type getLabelByIdParamsSchema,
  type getLabelsPageDataResponseSchema,
  type getLabelsResponseSchema,
  type labelSearchParamsSchema,
  type updateLabelParamsSchema,
  type updateLabelRequestSchema,
} from "./label-api.schema";

export type GetLabelsResponse = z.infer<typeof getLabelsResponseSchema>;

export type GetLabelByIdParams = z.infer<typeof getLabelByIdParamsSchema>;

export type CreateLabelRequest = z.infer<typeof createLabelRequestSchema>;

export type UpdateLabelParams = z.infer<typeof updateLabelParamsSchema>;

export type UpdateLabelRequest = z.infer<typeof updateLabelRequestSchema>;

export type DeleteLabelParams = z.infer<typeof deleteLabelParamsSchema>;

export type LabelSearchParams = z.infer<typeof labelSearchParamsSchema>;

export type GetLabelsPageDataResponse = z.infer<typeof getLabelsPageDataResponseSchema>;

export type AdminLabelsPageData = GetLabelsPageDataResponse;
```

#### 3.1.3 Contract tests (optional schema test)

If `packages/contracts/src/entities/lms/label/` has an existing `*.test.ts` file (other than the schema test mentioned in Step 4 — verify at task-time), add 2-3 cases for `labelSearchParamsSchema`:

- accepts `{ q: "push" }`
- accepts `{}` (q is optional)
- rejects `{ q: "" }` (min 1)
- rejects `{ q: "x".repeat(201) }` (max 200)

If no schema-test file structure exists for these slices yet, **skip** — tests will be exercised through api-server integration cases.

#### 3.1.4 Phase 1 verification (commit 1 gate)

- `pnpm --filter @repo/contracts check-types` green.
- `pnpm --filter @repo/contracts lint` green.
- `pnpm --filter @repo/contracts test` green (existing label schema test plus optional new cases).
- `pnpm --filter @repo/api-server check-types` green — api-server doesn't import the new schema yet; compiles unchanged.

### 3.2 Phase 2 — api-server (additive + structural symmetry fix)

#### 3.2.1 New `packages/api-server/src/endpoints/lms/label/platform.ts`

```ts
import { type Label } from "@repo/contracts/lms/label";

import { requireCoachLikeRole } from "../../../authz/guards";
import { prisma } from "../../../db/client";
import { mapToLabel } from "../../../mappers/lms";

const LABEL_SEARCH_CAP = 50;

export const lmsLabelPlatformApi = {
  list: async (userId: string, query?: string): Promise<Label[]> => {
    await requireCoachLikeRole(userId);

    const where =
      query !== undefined ? { nameLower: { contains: query.toLowerCase() } } : undefined;

    const rows = await prisma.label.findMany({
      where,
      orderBy: { nameLower: "asc" },
      take: LABEL_SEARCH_CAP,
    });

    return rows.map(mapToLabel);
  },
};
```

Notes:

- Symbol `lmsLabelPlatformApi` uses correct `lms*` prefix (per architectural namespace from Step 6.1.5 D8). Do NOT prefix `cms*`.
- `LABEL_SEARCH_CAP = 50` hardcoded module-local — not configurable by caller, defence against scraping.
- `query !== undefined` (not `!!query`) — empty string `""` would slip past `!!` but match-all via `contains: ""`. Zod schema `.min(1)` validates at HTTP layer (Step 6.4); this endpoint trusts its input. If a TS caller passes `""` directly bypassing schema, `contains: ""` matches everything — acceptable (programming error, not security).
- `query.toLowerCase()` — Prisma's `contains` is case-sensitive in Postgres; the `nameLower` column is the lowercase mirror (per `mapToLabel`'s `nameLower` field), so we match against the indexed lowercase form.
- `mapToLabel` is imported from `../../../mappers/lms` (barrel) per existing convention.

#### 3.2.2 New `packages/api-server/src/endpoints/lms/label/platform.test.ts`

Mirror `endpoints/lms/label/admin.test.ts` cleanup pattern (`beforeAll` seeds users + labels; `afterAll` `cleanupRaw.label.deleteMany` + user cleanup). Use `createTestCoach()` for the coach. For the non-coach test, create a User row directly with `cleanupRaw.user.create({ data: { ..., role: "ATHLETE" } })` — if a `createTestAthlete` helper exists in `test/helpers.ts`, prefer it.

Minimum **10 cases**:

1. **Rejects non-coach role** — athlete user → `ForbiddenError("Coach role required")`. No rows touched.
2. **Coach without query** — returns all labels (≤cap), sorted by `nameLower` asc. Seed ≥3 labels with names "Push", "Pull", "Active Rest" → returned in nameLower-asc order `["active rest", "pull", "push"]` (use `r.name` to verify, but sort order is by `nameLower`).
3. **Coach with substring query `"push"`** — returns labels containing "push" in nameLower. Seed labels `"Push Day"`, `"Push-Pull"`, `"Active Rest"` → returns first two; sorted asc.
4. **Case-insensitive — query `"PUSH"`** — same as case 3; query is lowercased server-side. Result identical.
5. **Mid-word substring** — query `"rest"` → matches `"Active Rest"`. Confirms substring (not just prefix).
6. **No match** — query `"xyz999"` → empty array.
7. **Cap enforcement** — seed 60 labels named `"label-00".."label-59"` (or similar deterministic naming); `list(coach, undefined)` returns 50 entries (first 50 in `nameLower` asc order — e.g. `label-00..label-49`).
8. **Special-char query** — query `"50%"` → Prisma `contains` parameterizes safely (no SQL injection); matches only labels with literal "50%" substring (none in seed → empty).
9. **HEAD_COACH role authorized** — create user with role `HEAD_COACH`, call list, returns labels. Confirms `requireCoachLikeRole` accepts HEAD_COACH.
10. **ADMIN role authorized** — create user with role `ADMIN`, call list, returns labels. Confirms requireCoachLikeRole accepts ADMIN (debug/impersonate path).

Optional bonus:

11. **Sort verification** — seed `"Z label"`, `"A label"`, `"M label"` → returned `["A label", "M label", "Z label"]` (asc).

Each test that creates labels cleans up via `cleanupRaw.label.deleteMany` in `try/finally` (or `afterAll` if shared across the `describe`).

#### 3.2.3 New `packages/api-server/src/endpoints/lms/label/index.ts`

Structural symmetry — `endpoints/lms/{session,week,training-plan,plan-enrollment,day}/` all have `index.ts`. Add for `label/`:

```ts
export * from "./admin";
export * from "./platform";
```

#### 3.2.4 Edit `packages/api-server/src/endpoints/lms/index.ts`

Change `./label/admin` (direct file re-export) → `./label` (resolves via new label/index.ts). Final state — 8 lines:

```ts
export * from "./_shared";
export * from "./day";
export * from "./exercise/admin";
export * from "./label";
export * from "./plan-enrollment";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

Note: `./exercise/admin` stays as-is (exercise folder also lacks index.ts; out of scope to fix here — flag in `## Что отложено`).

#### 3.2.5 Phase 2 verification (commit 2 gate)

- `pnpm --filter @repo/api-server check-types` green.
- `pnpm --filter @repo/api-server lint` green.
- `pnpm --filter @repo/api-server test` green — including new `platform.test.ts` (~10 cases) and existing `admin.test.ts` (unchanged, regression-safe through barrel rename).
- Root verification per § 3.3.

### 3.3 Phase 3 — global verification

- `pnpm check-types` (root, 16/16) green.
- `pnpm lint` (root, 16/16) green.
- `pnpm test` (root) — baseline + ~10 new cases. Expected: ~926 → ~936 total.
- `pnpm dep:check` 0 violations / 1124+ modules.
- Grep regression:
  - `grep -rn "lmsLabelPlatformApi" packages/api-server/src` → 2+ hits (definition + barrel index re-export visible to TS).
  - `grep -rn "from.*endpoints/lms/label\"$" packages/api-server/src` (rough; verify the barrel resolves cleanly through both admin + platform exports — the `lms/index.ts` barrel should expose both `cmsLabelAdminApi` and `lmsLabelPlatformApi` symbols).
- Manual smoke: **N/A** — api-server-only step, no user-visible surface yet. State in `output.md` Verification notes.

### 3.4 Adversarial pass

| Axis                         | Scenario                                                                                  | Defence                                                                                                                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Authz                        | non-coach calls list                                                                      | `requireCoachLikeRole` throws ForbiddenError                                                                                                                                              |
| Authz                        | coach not in COACH_LIKE_ROLES set                                                         | guard rejects (UserRole enum exhaustive)                                                                                                                                                  |
| SQL injection                | query contains `%` `_` `'` `;`                                                            | Prisma `contains` parameterizes safely                                                                                                                                                    |
| Performance leading-wildcard | `contains: q` is `LIKE '%q%'` → seq scan worst-case                                       | acceptable at ~100 rows scale; future: GIN trgm index if catalog grows >1k                                                                                                                |
| Cap evasion                  | client passes `take=99999` somehow                                                        | endpoint hardcodes `LABEL_SEARCH_CAP=50`; client cannot override                                                                                                                          |
| Empty `q` reaching endpoint  | TS caller bypasses Zod schema                                                             | `contains: ""` matches everything — programming error, not security; HTTP layer (Step 6.4) Zod-rejects                                                                                    |
| Zero-width-char-only `q`     | passes `.min(1)` but `contains: ""` after toLowerCase (still non-empty zero-width string) | matches only labels containing zero-width chars (none in normal seed); empty result. Acceptable; matches admin label-input zero-width-strip behavior asymmetrically — flag if it surfaces |
| Concurrent calls             | many parallel `list()` calls                                                              | read-only; no transaction; no contention                                                                                                                                                  |
| Whitespace `q`               | `q="   "`                                                                                 | Prisma `contains: "   "` matches labels with literal triple-space. Endpoint doesn't trim. **Hypothesis**: trim at HTTP layer (Step 6.4) if desired. Don't auto-trim here                  |
| Deleted/soft-deleted labels  | Label model has no `deletedAt` field                                                      | n/a                                                                                                                                                                                       |

---

## 4. Out of scope — do NOT build

- **HTTP route** for `lmsLabelPlatformApi.list` — Step 6.4 (`GET /api/platform/labels?q=`).
- **Platform client API + hook** — Step 6.5 (`createLabelsAPI`, `useLabelSearch`).
- **UI consumption** — Step 6.6 (Day-label Autocomplete) + 6.7 (Session-label Autocomplete).
- **Symbol rename `cmsLabelAdminApi` → `lmsLabelAdminApi`** — Step 6.1.5 deferred follow-up; out of scope for 6.3. The new `lmsLabelPlatformApi` symbol uses the correct prefix from start, but the existing admin symbol stays `cmsLabelAdminApi` until its own atomic refactor PR.
- **`endpoints/lms/exercise/index.ts` structural symmetry fix** — same asymmetry as label folder pre-fix; orthogonal to Step 6.3 scope. Flag in `## Что отложено`.
- **Admin `?q=` retrofit** — `apps/admin/src/app/api/admin/labels/route.ts` doesn't support server-side search (admin uses client-side filter over the full list — acceptable at ~100 rows). Out of scope to retrofit.
- **`labelSearchResponseSchema` alias** — reuse `getLabelsResponseSchema` directly; no aliasing.
- **Pagination / cursor** — hardcoded `take: 50`; pagination deferred indefinitely (catalog expected <1k for foreseeable future per `[[discipline-program DB non-prod]]`).
- **`?q=` trim / normalize / zero-width-strip** — endpoint accepts raw query; HTTP layer (Step 6.4) handles normalization if needed.
- **GIN trgm index for `nameLower`** — perf optimization for >1k labels; not needed now.
- **Prisma schema changes**, seed changes, `analysis/artifacts/` edits — none required.

---

## 5. Acceptance criteria

- All Phase 1 + Phase 2 verifications pass.
- File pivot counts:
  - **1 new file** in contracts (none — contract changes are edits only).
  - **3 new files** in api-server: `endpoints/lms/label/platform.ts`, `endpoints/lms/label/index.ts`, `endpoints/lms/label/platform.test.ts`.
  - **3 edited files**: `packages/contracts/src/entities/lms/label/label-api.schema.ts` (add `labelSearchParamsSchema`), `packages/contracts/src/entities/lms/label/label-api.types.ts` (add `LabelSearchParams`), `packages/api-server/src/endpoints/lms/index.ts` (`./label/admin` → `./label`).
  - **Zero Prisma changes**, zero analysis-artifacts changes, zero seed changes, zero apps/\* changes, zero existing api-server endpoint logic changes.
- Test deltas: +~10 cases in `endpoints/lms/label/platform.test.ts` (+2-3 contract cases if § 3.1.3 added). Baseline 926 → ~936-939 total; all green.
- All regression guards pass:
  - `grep -rn "cmsLabelAdminApi" packages/api-server/src/endpoints/lms/label/admin.ts` returns ≥1 hit (existing admin symbol unchanged).
  - `grep -rn "lmsLabelPlatformApi" packages/api-server/src/endpoints/lms/label/platform.ts` returns ≥1 hit (new platform symbol).
  - `grep -rn "@repo/contracts/cms/label" apps packages` returns 0 (post-Step-6.1.5 regression).
  - `endpoints/lms/index.ts` exports include `cmsLabelAdminApi` (via barrel) AND `lmsLabelPlatformApi` (via barrel). Verify via TS-driven smoke import.
- **2 atomic commits on `feat/training-domain`** per § 7. No `--no-verify`.
- Smoke-test status: **N/A** (api-server-only).

---

## 6. `output.md` — write `implementation/step-06.3/output.md`

Sections (Russian prose where natural, English for code/paths):

`## Что сделано` · `## Изменённые/созданные файлы` · `## Принятые решения` · `## Возникшие вопросы и как решены` · `## Что отложено` · `` ## Ссылка на `.feature-dev/<ts>/` `` · `## Verification notes` · `## Acceptance criteria self-check`.

**Omit `## Сценарий смоук-теста`** — N/A for api-server-only step. State this in `## Verification notes`.

In `## Принятые решения`, document at minimum:

- **No `labelSearchResponseSchema` alias** — reused `getLabelsResponseSchema` directly. Flag if a future step needs the alias.
- **Folder symmetry fix scope** — added `endpoints/lms/label/index.ts` (was missing). Left `endpoints/lms/exercise/` alone (orthogonal).
- **Hardcoded `LABEL_SEARCH_CAP = 50`** — module-local const, not exposed via config or contract.
- Any other deviation from the prompt.

In `## Что отложено`, include:

- `endpoints/lms/exercise/index.ts` structural symmetry fix — same asymmetry as label folder pre-fix, but not in scope; can be a 1-commit cleanup in any future Step 6.x close-out.
- Symbol rename `cmsLabelAdminApi` → `lmsLabelAdminApi` (carry-forward from Step 6.1.5).
- `?q=` trim / zero-width-strip normalization — Step 6.4 HTTP layer concern.
- GIN trgm index for `nameLower` if catalog grows >1k labels.

In `## Verification notes`, include:

- `pnpm check-types` / `lint` / `test` / `dep:check` outputs (one-line summary).
- Grep regressions (`cmsLabelAdminApi` symbol intact, new `lmsLabelPlatformApi` present, no `@repo/contracts/cms/label` leftover).
- Both commit hashes.

---

## 7. Commits

**2 atomic commits on `feat/training-domain`**, in this order — additive only, no broken intermediate trees (verified via § 3.1.4 + § 3.2.5 gates; hooks pass each commit cleanly):

```
feat(contracts): add label search params schema for platform mirror

feat(api-server): add lms label platform api with structural label/index barrel
```

**Subject cap is 100 chars** per commitlint (Step 6.2 close-out's 103-char rejection lesson). Both subjects above are within cap.

**Commit 1 body** (paragraph reflow ≤150 chars per line):

> Adds labelSearchParamsSchema ({ q?: string min(1) max(200) }) to lms/label
> contract slice. Reuses existing getLabelsResponseSchema for response (admin
> and platform return identical array shape); no separate alias needed.
> Additive only — api-server compiles unchanged after this commit; downstream
> consumer arrives in the next commit.

**Commit 2 body**:

> Adds lmsLabelPlatformApi.list(userId, query?) read-only endpoint in
> endpoints/lms/label/platform.ts. Auth: requireCoachLikeRole. Optional
> case-insensitive substring filter on nameLower; sorted nameLower asc;
> hardcoded cap take: 50 (not client-configurable). Reuses mapToLabel.
> Adds new endpoints/lms/label/index.ts barrel for structural symmetry
> with lms/{session,week,...}/ siblings; flips endpoints/lms/index.ts
> export from ./label/admin to ./label (resolves through new barrel).
> 10 integration test cases cover authz (non-coach reject, HEAD_COACH
> and ADMIN allow), search behavior (no query, substring, case-insensitive,
> mid-word, no-match), cap enforcement, sort order, and SQL-safe special
> chars. Sibling endpoints/lms/exercise/ has the same asymmetry; left
> for a future structural cleanup.

**Per-layer atomicity rationale** (per `[[husky-cross-package-squash]]`): commits 1 + 2 are both additive — contracts adds a new symbol unused by api-server until commit 2 imports it; api-server's existing endpoints stay byte-identical. Pre-commit `turbo check-types --filter="...[HEAD]"` runs on each commit and passes both because the new symbol is optional and unconsumed in commit 1, then consumed in commit 2 with the schema already in place. Squash is not required here; per-layer keeps the paper trail cleaner.

**If Stage 6 QA surfaces a critical that requires a code change** — fold into the relevant commit (1 or 2) before staging; do not add a separate `fix(...)` commit unless the fix spans both layers. Never `--no-verify` / `--no-edit` / `--no-gpg-sign`.

**Commit-strategy sanity check** (run before staging anything):

```bash
cat .husky/pre-commit
cat .husky/pre-push
```

If hooks have changed since this prompt was written → STOP and surface. Don't silently re-derive a strategy from a different hook config.
