# Step 6.1.5 — `Label` + `Exercise` namespace move (`cms/*` → `lms/*`)

> You are an **executor** session in the training-domain integration workflow. This prompt is self-contained: execute it via **`/feature small`** (lightweight pipeline — this is a **pure refactor**, zero new behaviour, zero Prisma changes; the small variant is sufficient because Research / Design / Plan stages are trivial — the verbatim move-list, barrel before/after, and dep-cruiser carve-out below ARE the plan). Read `implementation/WORKFLOW.md` first for the durable rules. Write `implementation/step-06.1.5/output.md` when done, per the format at the bottom.

---

## 0. Hard triggers — STOP and surface to the user

This is the **4th attempt** at the training domain; the prior three were deleted. If, while reading the codebase, you encounter any trace of a prior implementation — vocabulary like `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — **STOP and surface to the user**. Do not consume it as a reference. The only legitimate model source is `analysis/artifacts/` + the live Prisma schema.

If you hit a **prompt-vs-codebase conflict** (this prompt says X, the codebase clearly does Y) or a **stale verbatim quote** (the prompt's "current state" of a barrel / `package.json` / dep-cruiser rule doesn't match `git show HEAD:<path>`): **STOP, state the conflict with a hypothesis ("the codebase has Y at HEAD; the prompt was written against X; I think the prompt is stale because…; right?"), and wait.** The planner owns prompt errors and answers fast. Step 6.0 had one such escalation (`CONTEXT-001`) where a barrel had drifted between thesis and prompt-write; resolved in `6942b6cd`. Don't apply silently — silent application would have deleted a sibling entity.

**Pre-task verification** — for **every barrel file** edited in this step (6 of them), **every `package.json` exports section** (1), and **`.dependency-cruiser.cjs`** (1) — run `git show HEAD:<path>` and **confirm the verbatim "current state" snippet below matches**. If any drifts → STOP and surface.

---

## 1. What this step is

`Label` and `Exercise` are LMS catalogs by every signal: Prisma `@@map("training_labels")` / `@@map("training_exercises")`, FK targets on `Day.labelId`, `Session.labelId`, `BlockLabelAssignment.labelId`, `OneRMRecord.exerciseId`. But their contracts and api-server endpoints/mappers live in `cms/*` namespace — a Step 4 / Step 3 architectural mismatch placed them there without an architectural review against `docs/BOUNDED-CONTEXTS.md` §1+§8 (CMS = marketing surface; Label/Exercise are not marketing).

This is blocking Step 6.2: the ratified D7 embed `label: Label | null` in `getWeekResponseSchema` would require `contracts/lms/week → contracts/cms/label`, which fails `.dependency-cruiser.cjs` rule `contracts-lms-no-coaching-cms-billing` (lines 47-58: forbids `lms/* → cms/*`). The rule is correct; the wrong file is `Label`'s namespace.

**Step 6.1.5 fixes the namespace, period.** No behaviour change, no Prisma change, no analysis-artifacts change, no seed change, no semantic change in any function. Pure path-and-import refactor. After this step, Step 6.2 can `import { labelSchema } from "@repo/contracts/lms/label"` from `lms/week` / `lms/day` without dep-cruiser violation.

**Five deliverables** (4 commits, see § 7):

1. **Contracts move** — `packages/contracts/src/entities/cms/{label,exercise}/` → `packages/contracts/src/entities/lms/{label,exercise}/` (14 files, 706 LOC). Plus `lms/index.ts` barrel additive edit. Plus `packages/contracts/package.json` exports map: delete `./cms/{label,exercise}`, add `./lms/{label,exercise}`.

2. **api-server move + enum-maps split** — `endpoints/cms/{label,exercise}/` → `endpoints/lms/{label,exercise}/` (4 files, 839 LOC). `mappers/cms/{label,exercise}.mapper.ts` → `mappers/lms/{label,exercise}.mapper.ts` (37 LOC). Plus the **split** of `mappers/cms/enum-maps.ts` (156 LOC, mixed concerns): keep CMS-pure (Currency / PriceInterval / BlogCategory / ContactStatus) in `mappers/cms/enum-maps.ts`; extract LMS-pure Exercise enums (Equipment / MovementType / CanonicalCompoundType, both directions + maps + reverse maps) to **new** `mappers/lms/exercise.enum-maps.ts`. Plus 4 barrel additive edits.

3. **Admin imports update** — 34 files in `apps/admin/` (14 label consumers + 20 exercise consumers) get a mechanical find/replace `@repo/contracts/cms/{label,exercise}` → `@repo/contracts/lms/{label,exercise}`. Single sed-equivalent command per substitution. Plus 2 api-server self-consumers' contract imports update implicitly via Phase 1 + 2 (since the file itself moves).

4. **dep-cruiser carve-out widening** — `.dependency-cruiser.cjs` rule `admin-no-lms` (lines 247-265) gets 4 new `pathNot` entries for the new lms paths, so `apps/admin/` retains its Library access to the moved endpoints/mappers.

5. **Verification + regression sweep** — `pnpm check-types` 16/16 + `pnpm lint` 16/16 + `pnpm test` baseline-green + `pnpm dep:check` 0/1112 + grep regressions (`@repo/contracts/cms/{label,exercise}` → 0 results in source) + manual smoke (`/admin/labels` + `/admin/exercises` list pages load).

**No Prisma schema change.** `Label` and `Exercise` Prisma models already use `@@map("training_labels")` / `@@map("training_exercises")` (`packages/api-server/prisma/schema.prisma` lines 779-794 and 755-777). No `db:reset` required; no seed change; **zero edits in `analysis/artifacts/`**.

**No documentation rewrite.** `IMPLEMENTATION_LOG.md` Step 3 / Step 4 entries + `.feature-dev/` artifacts mention `cms/{label,exercise}` paths — those are point-in-time historical records, preserved unchanged. Only **new** entries (Step 6.1.5 output.md + future steps) use the new namespace.

**Branch**: `feat/training-domain` (recreated locally from fresh `main` after PR #192 merge). Per-layer conventional-commits, all-lowercase subjects, body lines ≤150 chars. Never `--no-verify` / `--no-edit` / `--no-gpg-sign` — if a hook fails, fix the root cause.

---

## 2. Read these first (verbatim — do not skim)

**Architectural anchor**:

- `docs/BOUNDED-CONTEXTS.md` §1 + §8 — five bounded contexts (IAM, CMS, LMS, Coaching, Billing). Label/Exercise are not explicitly mentioned in the doc; the **implicit** classification is by Prisma model location + FK relations + business purpose (training catalog vs marketing). This refactor ratifies their LMS membership.
- `.dependency-cruiser.cjs` lines 47-58 (`contracts-lms-no-coaching-cms-billing` — the rule this step does NOT violate, but motivates the move).
- `.dependency-cruiser.cjs` lines 247-265 (`admin-no-lms` — the carve-out this step widens).
- `analysis/artifacts/06-formalization/schema.prisma` `Label` + `Exercise` blocks — confirms `@@map("training_*")` already correct; no schema-level change needed.

**Prisma reality (live)**:

- `packages/api-server/prisma/schema.prisma` lines 779-794 — `model Label` with `@@map("training_labels")`. FK back-refs: `days Day[]`, `sessions Session[]`, `blockAssignments BlockLabelAssignment[]`. Confirms LMS membership.
- `packages/api-server/prisma/schema.prisma` lines 755-777 — `model Exercise` with `@@map("training_exercises")`. FK back-ref: `oneRMRecords OneRMRecord[]`. Confirms LMS membership.

**Move-source verbatim (read each before moving — confirm size matches the count in this prompt)**:

- `packages/contracts/src/entities/cms/label/` — 7 files (`index.ts` 5 LOC, `label.constants.ts` 7 LOC, `label.schema.ts` 40 LOC, `label.schema.test.ts` 204 LOC, `label.types.ts` 9 LOC, `label-api.schema.ts` 21 LOC, `label-api.types.ts` 27 LOC) — total 313 LOC.
- `packages/contracts/src/entities/cms/exercise/` — 7 files (`index.ts` 5 LOC, `exercise.constants.ts` 58 LOC, `exercise.schema.ts` 102 LOC, `exercise.schema.test.ts` 162 LOC, `exercise.types.ts` 13 LOC, `exercise-api.schema.ts` 23 LOC, `exercise-api.types.ts` 30 LOC) — total 393 LOC.
- `packages/api-server/src/endpoints/cms/label/admin.ts` 109 LOC + `admin.test.ts` 264 LOC.
- `packages/api-server/src/endpoints/cms/exercise/admin.ts` 153 LOC + `admin.test.ts` 313 LOC.
- `packages/api-server/src/mappers/cms/label.mapper.ts` 13 LOC.
- `packages/api-server/src/mappers/cms/exercise.mapper.ts` 24 LOC.
- `packages/api-server/src/mappers/cms/enum-maps.ts` 156 LOC — **read this in full; you will split it in Phase 2**.

**Barrel-current-state verbatim** (pre-task verify via `git show HEAD:<path>` — if any drifts, STOP):

- `packages/contracts/src/entities/lms/index.ts` (5 lines):
  ```ts
  export * from "./_shared";
  export * from "./plan-enrollment";
  export * from "./session";
  export * from "./training-plan";
  export * from "./week";
  ```
- `packages/contracts/src/entities/cms/` — **no `index.ts`** in this folder (flat `cms/<entity>/` structure, no aggregate barrel). Confirm via `ls packages/contracts/src/entities/cms/`; if a `cms/index.ts` exists at HEAD, STOP and surface.
- `packages/api-server/src/endpoints/cms/index.ts` (13 lines):
  ```ts
  export * from "./blog/admin";
  export * from "./blog/public";
  export * from "./contact/admin";
  export * from "./contact/inbound";
  export * from "./dashboard/admin";
  export * from "./exercise/admin";
  export * from "./label/admin";
  export * from "./pages/admin";
  export * from "./pages/public";
  export * from "./product/admin";
  export * from "./product/public";
  export * from "./review/admin";
  export * from "./review/public";
  ```
- `packages/api-server/src/endpoints/lms/index.ts` (5 lines):
  ```ts
  export * from "./_shared";
  export * from "./plan-enrollment";
  export * from "./session";
  export * from "./training-plan";
  export * from "./week";
  ```
- `packages/api-server/src/mappers/cms/index.ts` (7 lines):
  ```ts
  export * from "./blog.mapper";
  export * from "./contact.mapper";
  export * from "./enum-maps";
  export * from "./exercise.mapper";
  export * from "./label.mapper";
  export * from "./product.mapper";
  export * from "./review.mapper";
  ```
- `packages/api-server/src/mappers/lms/index.ts` (5 lines):
  ```ts
  export * from "./enum-maps";
  export * from "./plan-enrollment.mapper";
  export * from "./session.mapper";
  export * from "./training-plan.mapper";
  export * from "./week.mapper";
  ```

**`package.json` exports verbatim**:

- `packages/contracts/package.json` exports field (lines 8-37 of the JSON):
  ```json
  "exports": {
    ".": "./src/index.ts",
    "./common": "./src/common/index.ts",
    "./cms/blog": "./src/entities/cms/blog/index.ts",
    "./cms/contact": "./src/entities/cms/contact/index.ts",
    "./cms/dashboard": "./src/entities/cms/dashboard/index.ts",
    "./cms/exercise": "./src/entities/cms/exercise/index.ts",
    "./cms/label": "./src/entities/cms/label/index.ts",
    "./cms/pages": "./src/entities/cms/pages/index.ts",
    "./cms/product": "./src/entities/cms/product/index.ts",
    "./cms/review": "./src/entities/cms/review/index.ts",
    "./lms": "./src/entities/lms/index.ts",
    "./lms/_shared": "./src/entities/lms/_shared/index.ts",
    "./lms/plan-enrollment": "./src/entities/lms/plan-enrollment/index.ts",
    "./lms/session": "./src/entities/lms/session/index.ts",
    "./lms/training-plan": "./src/entities/lms/training-plan/index.ts",
    "./lms/week": "./src/entities/lms/week/index.ts",
    "./coaching/admin-user-view": "./src/entities/coaching/admin-user-view/index.ts",
    "./coaching/athlete-profile": "./src/entities/coaching/athlete-profile/index.ts",
    "./coaching/coach-action-item": "./src/entities/coaching/coach-action-item/index.ts",
    "./coaching/coach-athletes": "./src/entities/coaching/coach-athletes/index.ts",
    "./coaching/coach-dashboard": "./src/entities/coaching/coach-dashboard/index.ts",
    "./coaching/coach-invite": "./src/entities/coaching/coach-invite/index.ts",
    "./coaching/coach-note": "./src/entities/coaching/coach-note/index.ts",
    "./coaching/coach-profile": "./src/entities/coaching/coach-profile/index.ts",
    "./iam/auth": "./src/entities/iam/auth/index.ts",
    "./iam/invite-token": "./src/entities/iam/invite-token/index.ts",
    "./iam/user": "./src/entities/iam/user/index.ts",
    "./storage/upload": "./src/entities/storage/upload/index.ts"
  },
  ```
- `packages/api-server/package.json` exports field — read in full at task-time. The api-server uses **shallow per-context exports** (`./cms`, `./lms`, etc.) via the barrel `index.ts` files, **not** per-entity exports. So no `package.json` edits needed in api-server **as long as** the barrels are updated correctly in Phase 2. **Verify at task-time**: if `package.json` happens to have a `./cms/label` or `./cms/exercise` entry, the prompt is stale — STOP and surface.

**dep-cruiser `admin-no-lms` verbatim** (lines 247-265 of `.dependency-cruiser.cjs`):

```javascript
{
  name: "admin-no-lms",
  severity: "error",
  comment:
    "apps/admin serves CMS management + admin user/dashboard + admin LMS libraries " +
    "(M1.2/M1.3 + M2.6). It does not need direct access to LMS plan/block/segment endpoints — " +
    "those are platform (coach) concerns. The library endpoints (Exercise / BlockType / " +
    "SchemeType / DayType CRUD per ADR-0039) are explicitly allowed via the carve-out.",
  from: { path: "^apps/admin/" },
  to: {
    path: "^packages/api-server/src/(endpoints|mappers)/lms/",
    pathNot: [
      "^packages/api-server/src/endpoints/lms/index\\.ts$",
      "^packages/api-server/src/endpoints/lms/library/index\\.ts$",
      "^packages/api-server/src/endpoints/lms/library/(exercise|block-type|scheme-type|day-type)/[^/]+\\.ts$",
      "^packages/api-server/src/mappers/lms/index\\.ts$",
      "^packages/api-server/src/mappers/lms/(exercise|block-type|scheme-type|day-type)\\.mapper\\.ts$",
    ],
  },
},
```

**Note**: the existing `pathNot` has historical entries for `library/<entity>/` and `mappers/lms/<entity>.mapper.ts` style — those are residue from an earlier ADR-0039 design that did **not land** in this codebase (no `library/` folder exists in `endpoints/lms/` today). They are no-op patterns. Step 6.1.5 adds **flat-path** entries matching the actual destination, not `library/*` style. Do not refactor the existing dead entries — preserve them verbatim (they cost nothing and any cleanup would expand scope).

**Codebase rules (sacred — non-negotiable)**:

- One slice / one schema-set / one component per file. **You are not adding any new component or schema in this step.** Only moving files and editing imports.
- No code comments unless encoding a non-obvious _why_ (single line). You are NOT adding new comments; existing comments in moved files are preserved verbatim.
- No `as any` / `as unknown` / unjustified `!` assertions. You are NOT adding any new code logic — you are only moving + path-renaming.
- `--no-verify` / `--no-edit` / `--no-gpg-sign` are forbidden. If commitlint fails (`subject-case`, `body-max-line-length`), reformat — don't bypass.
- Prefer `git mv` over `mv` for directory moves — preserves git rename detection + relative imports inside the directory.

---

## 3. Scope

### 3.1 Phase 1 — Contracts move

#### 3.1.1 Directory moves

```bash
git mv packages/contracts/src/entities/cms/label packages/contracts/src/entities/lms/label
git mv packages/contracts/src/entities/cms/exercise packages/contracts/src/entities/lms/exercise
```

Both directories move as units. All internal relative imports (e.g. `./label.schema` inside `label-api.schema.ts`) are preserved by `git mv`. The 2 test files (`label.schema.test.ts`, `exercise.schema.test.ts`) move with their folders and continue importing their siblings via relative paths.

#### 3.1.2 Barrel — `packages/contracts/src/entities/lms/index.ts`

**Current state** (verbatim, see § 2):

```ts
export * from "./_shared";
export * from "./plan-enrollment";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

**Final state** (additive — preserve all existing entries; alphabetical with underscore-first):

```ts
export * from "./_shared";
export * from "./exercise";
export * from "./label";
export * from "./plan-enrollment";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

#### 3.1.3 `packages/contracts/package.json` exports map

**Delete** these two entries:

```json
"./cms/exercise": "./src/entities/cms/exercise/index.ts",
"./cms/label": "./src/entities/cms/label/index.ts",
```

**Add** these two entries (alphabetical, after `./lms/_shared`):

```json
"./lms/exercise": "./src/entities/lms/exercise/index.ts",
"./lms/label": "./src/entities/lms/label/index.ts",
```

Final lms-block ordering in exports:

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

Final cms-block ordering (with `./cms/exercise` and `./cms/label` removed):

```json
"./cms/blog": "./src/entities/cms/blog/index.ts",
"./cms/contact": "./src/entities/cms/contact/index.ts",
"./cms/dashboard": "./src/entities/cms/dashboard/index.ts",
"./cms/pages": "./src/entities/cms/pages/index.ts",
"./cms/product": "./src/entities/cms/product/index.ts",
"./cms/review": "./src/entities/cms/review/index.ts",
```

#### 3.1.4 Phase 1 verification (commit 1 gate)

After commits, before moving on:

- `pnpm --filter @repo/contracts check-types` green (TypeScript resolves the `lms/{label,exercise}` paths via the new package.json exports + barrel).
- `pnpm --filter @repo/contracts lint` green.
- `pnpm --filter @repo/contracts test` green — the 2 moved test files (`lms/{label,exercise}/*.schema.test.ts`) still run via relative imports.
- **Note**: at this point, downstream `apps/admin/` and `packages/api-server/` will be **temporarily broken** (they still import from `@repo/contracts/cms/{label,exercise}`). That's expected — Phase 2 + 3 fix it. Root-level `pnpm check-types` will fail until Phase 3 completes. Do not run root-level checks between commits 1 and 3.

### 3.2 Phase 2 — api-server move + enum-maps split

#### 3.2.1 Directory + file moves

```bash
git mv packages/api-server/src/endpoints/cms/label packages/api-server/src/endpoints/lms/label
git mv packages/api-server/src/endpoints/cms/exercise packages/api-server/src/endpoints/lms/exercise
git mv packages/api-server/src/mappers/cms/label.mapper.ts packages/api-server/src/mappers/lms/label.mapper.ts
git mv packages/api-server/src/mappers/cms/exercise.mapper.ts packages/api-server/src/mappers/lms/exercise.mapper.ts
```

#### 3.2.2 Self-consumer contract path updates (in the just-moved files)

The 4 moved api-server files now sit in `lms/*` but their `import` statements still reference `@repo/contracts/cms/{label,exercise}`. Replace each with the `lms/*` path:

- `packages/api-server/src/endpoints/lms/label/admin.ts` — line 1 area: `from "@repo/contracts/cms/label"` → `from "@repo/contracts/lms/label"`.
- `packages/api-server/src/endpoints/lms/label/admin.test.ts` — same.
- `packages/api-server/src/endpoints/lms/exercise/admin.ts` — same for `cms/exercise` → `lms/exercise`.
- `packages/api-server/src/endpoints/lms/exercise/admin.test.ts` — same.
- `packages/api-server/src/mappers/lms/label.mapper.ts` (now in `mappers/lms/`) — line 3: `from "@repo/contracts/cms/label"` → `from "@repo/contracts/lms/label"`.
- `packages/api-server/src/mappers/lms/exercise.mapper.ts` (now in `mappers/lms/`) — same for `cms/exercise` → `lms/exercise`.

This is **6 files** of single-line import path updates. Verify count via the Phase 4 grep regression.

#### 3.2.3 Split `mappers/cms/enum-maps.ts` (the critical work in Phase 2)

The current `packages/api-server/src/mappers/cms/enum-maps.ts` (156 LOC) holds **mixed concerns** — both CMS-pure enum maps and Exercise enum maps. After this step, Exercise enums must live in `mappers/lms/` so `endpoints/lms/exercise/admin.ts` can import them without cross-namespace dependency.

**Reorganization plan**:

**Keep in `mappers/cms/enum-maps.ts`** (CMS-pure — Currency / PriceInterval / BlogCategory / ContactStatus):

- imports: `Currency as PrismaCurrency`, `PriceInterval as PrismaPriceInterval`, `MarketingBlogCategory as PrismaMarketingBlogCategory`, `ContactSubmissionStatus as PrismaContactSubmissionStatus` from `@prisma/client`
- imports: `BlogCategory` from `@repo/contracts/cms/blog`, `ContactStatus` from `@repo/contracts/cms/contact`, `PriceInterval`, `ProductCurrency` from `@repo/contracts/cms/product`
- exports: `CURRENCY_MAP`, `PRICE_INTERVAL_MAP`, `BLOG_CATEGORY_MAP`, `CONTACT_SUBMISSION_STATUS_MAP`, `CONTACT_STATUS_TO_PRISMA_MAP`

**Extract to NEW `packages/api-server/src/mappers/lms/exercise.enum-maps.ts`** (LMS-pure — Exercise's three enums, both directions):

- imports: `CanonicalCompoundType as PrismaCanonicalCompoundType`, `Equipment as PrismaEquipment`, `MovementType as PrismaMovementType` from `@prisma/client`
- imports: `ExerciseCanonicalCompoundType`, `ExerciseEquipment`, `ExerciseMovementType` from `@repo/contracts/lms/exercise` (**note**: `lms/exercise`, not `cms/exercise` — Phase 1 already moved it)
- exports: `EQUIPMENT_MAP`, `equipmentToPrisma`, `MOVEMENT_TYPE_MAP`, `movementTypeToPrisma`, `CANONICAL_COMPOUND_TYPE_MAP`, `canonicalCompoundTypeToPrisma`

**Procedure**:

1. Create the new file `mappers/lms/exercise.enum-maps.ts` with the 3 imports + 6 exports listed above. The map contents are byte-for-byte copies from current `enum-maps.ts` lines 55-155 — preserve exactly.
2. Edit `mappers/cms/enum-maps.ts` — delete lines 13-17 (`ExerciseCanonicalCompoundType` / `ExerciseEquipment` / `ExerciseMovementType` import block from `@repo/contracts/cms/exercise`), delete lines 1-2 portions referencing `CanonicalCompoundType`, `Equipment`, `MovementType` from `@prisma/client` (keep the other Prisma imports), delete lines 55-155 (the 6 Exercise enum-map exports + reverse maps). End state: only Currency / PriceInterval / BlogCategory / ContactStatus material remains; ~55 LOC.

3. Verify: `endpoints/lms/exercise/admin.ts` must now import enum maps from `../../mappers/lms` (which re-exports `exercise.enum-maps` via the barrel updated in 3.2.4 below), not from `../../mappers/cms`. Update its import path accordingly — single-line change. Confirm via grep that `endpoints/lms/exercise/admin.ts` has zero `mappers/cms` references.

4. Same verification on `endpoints/lms/exercise/admin.test.ts` if it imports enum maps directly.

#### 3.2.4 Barrel updates

**`packages/api-server/src/endpoints/cms/index.ts`** — current state (13 lines) per § 2. Delete these 2 lines:

```ts
export * from "./exercise/admin";
export * from "./label/admin";
```

Final state (11 lines, alphabetical):

```ts
export * from "./blog/admin";
export * from "./blog/public";
export * from "./contact/admin";
export * from "./contact/inbound";
export * from "./dashboard/admin";
export * from "./pages/admin";
export * from "./pages/public";
export * from "./product/admin";
export * from "./product/public";
export * from "./review/admin";
export * from "./review/public";
```

**`packages/api-server/src/endpoints/lms/index.ts`** — current state (5 lines) per § 2. Final state (additive — alphabetical with underscore-first):

```ts
export * from "./_shared";
export * from "./exercise/admin";
export * from "./label/admin";
export * from "./plan-enrollment";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

**`packages/api-server/src/mappers/cms/index.ts`** — current state (7 lines) per § 2. Delete these 2 lines:

```ts
export * from "./exercise.mapper";
export * from "./label.mapper";
```

Final state (5 lines):

```ts
export * from "./blog.mapper";
export * from "./contact.mapper";
export * from "./enum-maps";
export * from "./product.mapper";
export * from "./review.mapper";
```

**`packages/api-server/src/mappers/lms/index.ts`** — current state (5 lines) per § 2. Final state (additive — alphabetical, including the new `exercise.enum-maps`):

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

#### 3.2.5 Phase 2 verification (commit 2 gate)

- `pnpm --filter @repo/api-server check-types` green.
- `pnpm --filter @repo/api-server lint` green.
- `pnpm --filter @repo/api-server test` green — including the 2 moved test files (now under `endpoints/lms/{label,exercise}/admin.test.ts`).
- **Note**: at this point, `apps/admin/` is still broken (Phase 3 fixes). Root checks fail until Phase 3.

### 3.3 Phase 3 — apps/admin imports update

#### 3.3.1 Mechanical find/replace

Two sed-equivalent operations (verify each affects the expected count):

```bash
grep -rl --include='*.ts' --include='*.tsx' '@repo/contracts/cms/label' apps packages \
  | xargs sed -i 's|@repo/contracts/cms/label|@repo/contracts/lms/label|g'

grep -rl --include='*.ts' --include='*.tsx' '@repo/contracts/cms/exercise' apps packages \
  | xargs sed -i 's|@repo/contracts/cms/exercise|@repo/contracts/lms/exercise|g'
```

(If `sed -i` is unavailable in the shell, fall back to per-file Edit operations — but the result MUST be byte-identical to the sed transformation: only the import path substring changes, nothing else.)

#### 3.3.2 Expected affected files (sanity reference)

**Label consumers** (~11 in apps/admin after Phase 2 moved the 3 api-server self-consumers; previously 14):

1. `apps/admin/src/lib/api/endpoints/labels.ts`
2. `apps/admin/src/lib/hooks/use-labels.ts`
3. `apps/admin/src/modules/labels/constants.ts`
4. `apps/admin/src/modules/labels/components/applicable-levels-field.tsx`
5. `apps/admin/src/modules/labels/components/label-form.tsx`
6. `apps/admin/src/modules/labels/views/labels-edit-view/labels-edit-form.tsx`
7. `apps/admin/src/modules/labels/views/labels-create-view/index.tsx`
8. `apps/admin/src/modules/labels/sections/labels-list-section/index.tsx`
9. `apps/admin/src/app/api/admin/labels/route.ts`
10. `apps/admin/src/app/api/admin/labels/[id]/route.ts`
11. `apps/admin/src/app/api/admin/labels/page-data/route.ts`

**Exercise consumers** (~16 in apps/admin after Phase 2; previously 20):

1. `apps/admin/src/lib/api/endpoints/exercises.ts`
2. `apps/admin/src/lib/hooks/use-exercises.ts`
3. `apps/admin/src/modules/exercises/components/classification-card.tsx`
4. `apps/admin/src/modules/exercises/components/demos-and-aliases-card.tsx`
5. `apps/admin/src/modules/exercises/components/basic-info-card.tsx`
6. `apps/admin/src/modules/exercises/components/enum-select-field.tsx`
7. `apps/admin/src/modules/exercises/components/notes-card.tsx`
8. `apps/admin/src/modules/exercises/components/secondary-movement-select.tsx`
9. `apps/admin/src/modules/exercises/constants.ts`
10. `apps/admin/src/modules/exercises/views/exercises-edit-view/exercises-edit-form.tsx`
11. `apps/admin/src/modules/exercises/sections/exercises-list-section/index.tsx`
12. `apps/admin/src/modules/exercises/views/exercises-create-view/index.tsx`
13. `apps/admin/src/app/api/admin/exercises/route.ts`
14. `apps/admin/src/app/api/admin/exercises/[id]/route.ts`
15. `apps/admin/src/app/api/admin/exercises/page-data/route.ts`
16. `apps/admin/src/app/api/admin/exercises/movement-families/route.ts`

This list is a **sanity reference** — the sed command will find the actual set. If `grep -rl` returns a file not in this list, surface it before proceeding (could be a missed admin consumer or a legitimate new file added between thesis-time and prompt-execution).

#### 3.3.3 Phase 3 verification (commit 3 gate)

- `pnpm check-types` (root, 16 workspaces) green.
- `pnpm lint` (root) green — `--max-warnings 0`.
- `pnpm test` (root) green — baseline + the 2 moved api-server test files + the 2 moved contract test files. **No new tests added in this step.**
- Grep regression:
  - `grep -rn "@repo/contracts/cms/label" apps packages` → 0 results.
  - `grep -rn "@repo/contracts/cms/exercise" apps packages` → 0 results.
  - `grep -rn "from.*mappers/cms/.*label" packages` → 0 results.
  - `grep -rn "from.*mappers/cms/.*exercise" packages` → 0 results.
  - `grep -rn "from \"\\./label\\.mapper\\|from \"\\./exercise\\.mapper" packages/api-server/src/mappers/cms` → 0 results (mappers/cms barrel no longer references them).

### 3.4 Phase 4 — dep-cruiser carve-out widen

#### 3.4.1 Edit `.dependency-cruiser.cjs` rule `admin-no-lms`

Current `pathNot` array (verbatim, in `.dependency-cruiser.cjs` lines 257-263):

```javascript
pathNot: [
  "^packages/api-server/src/endpoints/lms/index\\.ts$",
  "^packages/api-server/src/endpoints/lms/library/index\\.ts$",
  "^packages/api-server/src/endpoints/lms/library/(exercise|block-type|scheme-type|day-type)/[^/]+\\.ts$",
  "^packages/api-server/src/mappers/lms/index\\.ts$",
  "^packages/api-server/src/mappers/lms/(exercise|block-type|scheme-type|day-type)\\.mapper\\.ts$",
],
```

Final state — add 4 new entries (alphabetical-ish; keep existing entries intact):

```javascript
pathNot: [
  "^packages/api-server/src/endpoints/lms/index\\.ts$",
  "^packages/api-server/src/endpoints/lms/library/index\\.ts$",
  "^packages/api-server/src/endpoints/lms/library/(exercise|block-type|scheme-type|day-type)/[^/]+\\.ts$",
  "^packages/api-server/src/endpoints/lms/label/[^/]+\\.ts$",
  "^packages/api-server/src/endpoints/lms/exercise/[^/]+\\.ts$",
  "^packages/api-server/src/mappers/lms/index\\.ts$",
  "^packages/api-server/src/mappers/lms/(exercise|block-type|scheme-type|day-type)\\.mapper\\.ts$",
  "^packages/api-server/src/mappers/lms/label\\.mapper\\.ts$",
  "^packages/api-server/src/mappers/lms/exercise\\.enum-maps\\.ts$",
],
```

**Notes**:

- The new flat-path entries `endpoints/lms/{label,exercise}/[^/]+\.ts$` cover both `admin.ts` and `admin.test.ts` and any future siblings (already follows the `[^/]+\.ts$` style of existing entries).
- The `mappers/lms/exercise.mapper.ts` is **already** matched by the existing `(exercise|block-type|...)\.mapper\.ts$` entry — no duplicate entry needed.
- The `mappers/lms/label.mapper.ts` requires a new explicit entry (Label was not in the original alternation).
- The `mappers/lms/exercise.enum-maps.ts` requires a new entry — needed if `apps/admin/src/modules/exercises/` consumes it indirectly via the lms barrel (verify at task-time via `pnpm dep:check`; if no admin → exercise.enum-maps edge exists, the entry can be omitted — it costs nothing to include).
- **Do not delete the existing `library/*` entries** even though `library/` folder doesn't exist in the codebase today — they are inert no-ops, removing them is scope-creep, and they may be re-introduced by a future ADR.

#### 3.4.2 Phase 4 verification (commit 4 gate)

- `pnpm dep:check` → 0 violations across 1112+ modules.
- All previous gates (Phase 1, 2, 3) re-verified green.

### 3.5 Phase 5 — global verification + smoke

- `pnpm check-types` (root, 16/16) green.
- `pnpm lint` (root, 16/16) green.
- `pnpm test` (root) green — full suite. No new tests added; existing tests must all pass against the moved files. Expect ~504+ api-server cases + ~115+ contract cases unchanged in count.
- `pnpm dep:check` 0/1112 violations.
- `pnpm db:reset && pnpm db:seed` (optional — schema unchanged, but cheap to verify; skip if a fresh seed is already in place and you have not stopped the dev DB).
- Final grep sweep:
  - `grep -rn "@repo/contracts/cms/label" apps packages` → 0.
  - `grep -rn "@repo/contracts/cms/exercise" apps packages` → 0.
  - `grep -rn "endpoints/cms/label\|endpoints/cms/exercise" packages apps` → 0.
  - `grep -rn "mappers/cms/label.mapper\|mappers/cms/exercise.mapper" packages apps` → 0.
- **Manual smoke** (state in `## Verification notes` of `output.md`):
  - Open `/admin/labels` in browser → label list loads, click "Create" → form renders, fill in valid data → label persists.
  - Open `/admin/exercises` → exercise list loads, click "Create" → form renders (5 sub-cards from Step 3), fill valid data → exercise persists.
  - Open one existing label and edit `notes` → saves.
  - Open one existing exercise and edit `defaultDemoUrls` (add a URL) → saves.

---

## 4. Out of scope — do NOT build

- **Any new contract / schema / API logic.** This is a pure refactor.
- **Any Prisma schema change.** `Label.@@map("training_labels")` and `Exercise.@@map("training_exercises")` are already correct; do not touch them.
- **Any `analysis/artifacts/` edit.** Model semantics are unchanged.
- **Any seed change.** Existing seed already populates `app_*` and `training_*` tables correctly.
- **Cleanup of dead `library/*` entries** in dep-cruiser carve-out. They are inert. Out of scope.
- **Rewriting Step 3 / Step 4 IMPLEMENTATION_LOG entries** to mention new namespace. Historical paper-trail is preserved as point-in-time truth.
- **Rewriting `.feature-dev/*` artifacts**. Same — historical.
- **Memory-hygiene sweep of `~/.claude/projects/.../memory/`** for stale `cms/{label,exercise}` references — this is **planner-side housekeeping** done after step close-out, not part of the refactor. Flag any findings in `output.md` "Что отложено".
- **Restructuring `endpoints/cms/toggle-exclusive-featured.ts`**. It's unrelated to Label/Exercise; do not touch.
- **Adding new tests** for the moved files. Existing tests move with their folders and must still pass.
- **Improving moved code** along the way ("I noticed this could be cleaner — let me refactor while I'm here"). NO. Move byte-identical; any improvement is a separate PR.
- **Splitting `mappers/lms/enum-maps.ts`** further (it's currently 1 line — `export * from ...` doesn't exist there; the existing file holds `TRAINING_PLAN_STATUS_MAP`, `ROLE_MAP`, etc. — none Exercise). Leave alone.

---

## 5. Acceptance criteria

- All 5 Phase verifications pass (Phase 1/2/3/4/5 gates as enumerated above).
- File pivot count exactly:
  - **20 files moved** (renamed via `git mv`): 14 contracts + 4 api-server endpoints + 2 api-server mappers.
  - **1 file created**: `packages/api-server/src/mappers/lms/exercise.enum-maps.ts` (~100 LOC, byte-extracted from former `enum-maps.ts`).
  - **1 file size-reduced**: `packages/api-server/src/mappers/cms/enum-maps.ts` (156 LOC → ~55 LOC after removing Exercise enums).
  - **6 barrel files edited** (additive or deletive lines only, no reordering of unrelated entries): `contracts/lms/index.ts`, `api-server/endpoints/{cms,lms}/index.ts`, `api-server/mappers/{cms,lms}/index.ts`.
  - **6 self-consumer files import-path-updated**: the 4 moved api-server files + 2 moved api-server mappers (`@repo/contracts/cms/X` → `@repo/contracts/lms/X` inside each).
  - **27-34 admin consumer files** (range — depends on actual sed sweep count) with single import-path substring substituted; no other change.
  - **1 `package.json` edit** (`packages/contracts/package.json` exports map: 2 deletions + 2 additions).
  - **1 `.dependency-cruiser.cjs` edit** (4 `pathNot` additions to `admin-no-lms` rule).
- Zero Prisma schema changes; zero analysis-artifacts changes; zero seed changes; zero new tests; zero new components/schemas/endpoints.
- `pnpm dep:check` 0/1112 violations across all modules — proves the new `lms/{label,exercise}` paths are correctly allow-listed for admin access and CMS no longer leaks into LMS.
- Grep regressions all-zero as enumerated in Phase 3 and Phase 5.
- All 4 commits land on `feat/training-domain` per § 7 ordering; each commit alone compiles only for the package it touches (cross-package work happens over the 4-commit window).
- Manual smoke (`/admin/labels` + `/admin/exercises` list + form) passes — proves no runtime regression.

---

## 6. `output.md` — write `implementation/step-06.1.5/output.md`

Sections (Russian prose where natural, English for code/paths):

`## Что сделано` · `## Изменённые/созданные файлы` · `## Принятые решения` · `## Возникшие вопросы и как решены` · `## Что отложено` · `` ## Ссылка на `.feature-dev/<ts>/` `` · `## Verification notes` · `## Acceptance criteria self-check`.

**`## Сценарий смоук-теста`** — include a brief one (DB precondition: seed already loaded; steps: navigate `/admin/labels` then `/admin/exercises`, verify each list renders + a create+save round-trip works; expected: no UI regression vs pre-refactor; rollback: `git revert` the 4 commits or simply `git reset` if not pushed).

In `## Verification notes`, include:

- Output of `pnpm check-types` (root, 16/16 line).
- Output of `pnpm lint` (root, 16/16 line).
- Output of `pnpm test` (root, suite-count summary line; assert no test deltas).
- Output of `pnpm dep:check` (0/N violations line).
- Output of each grep regression command (the 4 from Phase 3.3.3 + the 4 from Phase 5).
- File-count tally vs § 5 acceptance criteria (assert each line).
- The 4 commit hashes in chronological order.

In `## Что отложено`, include:

- Memory-hygiene sweep of `~/.claude/projects/-home-maksym-projects-contrib-the-discipline-program/memory/` for stale `cms/{label,exercise}` references — planner housekeeping for close-out lesson.
- Any pre-existing minor issues observed in the moved code (e.g. test-helper rough edges, inconsistent error messages) — flag, do not fix. Reason: out-of-scope for a namespace move.

In `## Принятые решения`, document if you encountered any drift between this prompt's verbatim quotes and HEAD state — e.g. a barrel that gained a new entry between thesis-write and prompt-execution. State what you did and why.

---

## 7. Commits

Per-layer conventional-commits on `feat/training-domain`, all-lowercase subjects, body lines ≤150 chars. **4 commits, in this exact order** (each compiles for the package it touches; cross-package compilation only after commit 3):

```
refactor(contracts): move label and exercise from cms to lms namespace
refactor(api-server): mirror label exercise move and split enum maps
refactor(admin): update import paths after cms to lms move
chore(dep-check): widen admin-no-lms carve-out for moved entities
```

**Commit 1 body** (single paragraph, ≤150 char lines):

> Both entities are LMS catalogs by every signal (Prisma @@map("training\_\*"), FK relations from Day/Session/Block/SchemaRow/OneRMRecord). Step 4 placed them under cms namespace without architectural review; this commit corrects it. Pure file rename + barrel + package.json exports map update; zero behaviour change.

**Commit 2 body**:

> Mirror the contracts move on the api-server side: endpoints/cms/{label,exercise} → endpoints/lms/{label,exercise}; mappers/cms/{label,exercise}.mapper.ts → mappers/lms/. Split mappers/cms/enum-maps.ts — Exercise enums (Equipment/MovementType/CanonicalCompoundType, both directions) extracted to new mappers/lms/exercise.enum-maps.ts; CMS-pure stays (Currency/PriceInterval/BlogCategory/ContactStatus). Self-consumer contract import paths updated inside the moved files.

**Commit 3 body**:

> Mechanical find/replace across apps/admin: @repo/contracts/cms/{label,exercise} → @repo/contracts/lms/{label,exercise}. Affects route handlers (7), module trees (17), lib hooks/endpoints (4) — single import-path substring per file; no other change. Root pnpm check-types + lint green after this commit.

**Commit 4 body**:

> Adds 4 new pathNot entries to .dependency-cruiser.cjs admin-no-lms rule: endpoints/lms/{label,exercise}/[^/]+\.ts$ and mappers/lms/{label.mapper,exercise.enum-maps}.ts$. apps/admin retains its Library access to the moved endpoints/mappers. Dead library/\* entries left intact (no scope creep).

If `/feature small` Stage 6 QA surfaces a critical that requires a code change beyond the planned commits, add a 5th `fix(...)` commit. Never bypass hooks; fix root causes — commitlint `subject-case` (no capitals) and `body-max-line-length` (≤150 chars) are common pitfalls (Step 6.1 hit `subject-case` with a CamelCase identifier).
