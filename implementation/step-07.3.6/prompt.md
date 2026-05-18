# Step 07.3.6 — Block `@@unique([sessionId, order])` schema constraint

> Sixth sub-step of Step 7 decomposition. Closes Step 7.1 Stage 6 QA-001 carry-forward (WARNING severity). Pre-Step-8 surface eliminated — schema constraint shipped before Step 8 Schema entity adds more concurrent write paths to same Block chain.

---

## Execution mode

- **Wrapper**: `/feature small` (light pipeline — research + plan + review-light; Stage 6 hostile QA N/A for additive schema constraint per Step 6.1.5 D8 precedent).
- **Branch**: stay on `feat/training-domain`. **DO NOT cut a new `feat/<slug>` branch.** Override per `[[always-via-feature-skill]]` + `[[training-domain-workflow]]` (long-lived single branch convention; PR batched after Step 7.5 close-out per `[[training-domain-validation-gate]]` timing).
- **Commit strategy**: single atomic commit (see § 7 — verified against live `.husky/{pre-commit,pre-push}` + `turbo.json`).
- **Husky hooks**: NEVER `--no-verify` / `--no-edit` / `--no-gpg-sign`. Pre-commit + commit-msg + pre-push must pass clean. If any hook blocks — diagnose root cause + fix; surface to user if non-trivial.
- **Commit language**: subject + body fully English. Pre-commit hook (`scripts/check-secrets.mjs` reads commit messages) blocks Cyrillic in subjects (commitlint subject-case = lower-case enforced; commit-msg via `commitlint --edit $1`).

---

## § 0. Hard triggers — STOP-and-surface protocol

> Per `[[planner-verbatim-registration]]` + `[[planner-consumer-pattern-read]]` + `[[planner-adversarial-review]]` + `[[husky-cross-package-squash]]`: every verbatim quote below was captured at prompt-write time (2026-05-18, HEAD `d5b9d47f`). **Before executing § 3, re-Read each cited path and confirm byte-for-byte match.** Any drift → STOP, surface to user via `AskUserQuestion` with diff + hypothesis. Do not silently adapt.

### § 0.1 Live Block model (`packages/api-server/prisma/schema.prisma:653-669`)

```prisma
model Block {
  id        String   @id @default(cuid())
  sessionId String
  order     Int
  intensity Json?
  timeCap   Json?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  session          Session                @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  labelAssignments BlockLabelAssignment[]
  schemas          Schema[]

  @@index([sessionId, order])
  @@map("training_blocks")
}
```

**Insertion point**: new `@@unique([sessionId, order])` line **immediately after `@@index([sessionId, order])`** (mirror Week pattern lines 609-610 + Day pattern lines 627-628 — `@@unique` precedes `@@index` in canonical form OR follows it; current schema uses unique-first-then-index for Week/Day, prefer mirror).

**Pattern reference** (Week model lines 609-611, verbatim):

```prisma
  @@unique([planId, startDate])
  @@index([planId, startDate])
  @@map("training_weeks")
```

**Pattern reference** (Day model lines 627-630, verbatim):

```prisma
  @@unique([weekId, dayOfWeek])
  @@index([weekId, dayOfWeek])
  @@index([labelId])
  @@map("training_days")
```

**Final Block model target shape** (after edit):

```prisma
model Block {
  id        String   @id @default(cuid())
  sessionId String
  order     Int
  intensity Json?
  timeCap   Json?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  session          Session                @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  labelAssignments BlockLabelAssignment[]
  schemas          Schema[]

  @@unique([sessionId, order])
  @@index([sessionId, order])
  @@map("training_blocks")
}
```

> **Note**: Postgres automatically creates a unique index to enforce `@@unique([sessionId, order])`, which makes the existing `@@index([sessionId, order])` redundant from a query-planner standpoint. **DO NOT drop the explicit `@@index`** in this step — Prisma generates separate `Block_sessionId_order_key` (unique) and `Block_sessionId_order_idx` (plain) indexes. Removing the explicit index = unrelated cleanup, out of scope. Keep both lines (mirror Week + Day patterns at schema.prisma:609-610 + 627-628).

### § 0.2 Anchor analysis schema (`analysis/artifacts/06-formalization/schema.prisma:193-208`)

```prisma
model Block {
  id        String   @id @default(cuid())
  sessionId String
  order     Int
  intensity Json?
  timeCap   Json?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  session          Session                @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  labelAssignments BlockLabelAssignment[]
  schemas          Schema[]

  @@index([sessionId, order])
}
```

**Edit target** — same single-line addition before `@@index`:

```prisma
  @@unique([sessionId, order])
  @@index([sessionId, order])
```

(No `@@map` in anchor spec — pre-port slice convention; mirror live behavior structurally not literally.)

### § 0.3 `retryOnP2034` helper (`packages/api-server/src/utils/retry-on-p2034.ts:1-55`, verbatim)

```typescript
import { Prisma } from "@prisma/client";

import { ServiceUnavailableError } from "@repo/errors";

export type RetryOnP2034Options = {
  attempts?: number;
  jitterMsRange?: readonly [number, number];
  retryAfterSeconds?: number;
};

const DEFAULTS = {
  attempts: 2,
  jitterMsRange: [50, 200] as const,
  retryAfterSeconds: 5,
};

const isP2034 = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034";

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const jitter = (range: readonly [number, number]) =>
  range[0] + Math.random() * (range[1] - range[0]);

export const retryOnP2034 = async <T>(
  fn: () => Promise<T>,
  options?: RetryOnP2034Options,
): Promise<T> => {
  const attempts = options?.attempts ?? DEFAULTS.attempts;
  const range = options?.jitterMsRange ?? DEFAULTS.jitterMsRange;
  const retryAfterSeconds = options?.retryAfterSeconds ?? DEFAULTS.retryAfterSeconds;

  if (attempts < 1) {
    throw new Error("retryOnP2034: attempts must be >= 1");
  }

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (!isP2034(error)) {
        throw error;
      }

      if (attempt < attempts - 1) {
        await sleep(jitter(range));
      }
    }
  }

  throw new ServiceUnavailableError(
    "Resource is being modified concurrently, please retry in a moment",
    { retryAfter: retryAfterSeconds, lastErrorCode: "P2034" },
  );
};
```

**Critical confirmation**: `isP2034` filters **strictly** on `error.code === "P2034"`. P2002 (unique constraint violation) is NOT retried — it propagates immediately via `throw error` on line 42. This is by design: P2034 = SSI false-positive (worth retrying); P2002 = genuine collision (worth failing fast).

### § 0.4 `lmsBlockApi.create` flow (`packages/api-server/src/endpoints/lms/block/admin.ts:62-153`, abbreviated to relevant lines)

```typescript
export const lmsBlockApi = {
  create: async (
    userId: string,
    planId: string,
    sessionId: string,
    data: CreateBlockData,
  ): Promise<Block> => {
    const owner = await verifySessionOwnership(sessionId, userId);
    // ... owner/plan/session validation ...

    try {
      const block = await retryOnP2034(() =>
        prisma.$transaction(
          async (tx) => {
            // ... intra-tx plan + session re-check + assertLabelsApplicable ...

            const max = await tx.block.aggregate({
              where: { sessionId },
              _max: { order: true },
            });

            const nextOrder = (max._max.order ?? 0) + 10;

            const created = await tx.block.create({
              data: {
                sessionId,
                order: nextOrder,
                // ... rest of fields ...
              },
            });

            // ... labelIds createMany conditional ...

            return tx.block.findUniqueOrThrow({
              where: { id: created.id },
              include: BLOCK_WITH_LABELS_INCLUDE,
            });
          },
          { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
        ),
      );

      return mapToBlockWithLabels(block);
    } catch (error) {
      return handlePrismaError(error, { entity: "Block" });
    }
  },
  // ... update, delete, reorder, assignLabels ...
};
```

**Critical observation**: `_max(order) + 10` computation runs inside `Serializable` transaction wrapped in `retryOnP2034`. Concurrent `lmsBlockApi.create` calls produce one of three outcomes post-schema-change:

| Race window                                                         | Behaviour pre-`@@unique`                                                                 | Behaviour post-`@@unique`                                                                                                                                        |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSI predicate-lock catches concurrent aggregate read at commit time | P2034 → retry → second tx sees updated max → succeeds with order=N+20 (both fulfilled)   | Same — P2034 retry path unchanged; SSI gate fires before unique check                                                                                            |
| SSI doesn't catch (aggregate predicate lock granularity varies)     | Both inserts succeed silently with duplicate `(sessionId, N+10)` — **silent corruption** | Second insert hits unique constraint → P2002 → `handlePrismaError` → `ConflictError("Block with this sessionId already exists")` → caller sees rejected with 409 |
| Same row updated mid-flight                                         | P2034 → retry — same as case 1                                                           | Same — P2034 retry path unchanged                                                                                                                                |

**Net behavioural change**: post-`@@unique`, the silent-corruption case is eliminated (good); some concurrent races that previously produced fulfilledCount=2 may now produce fulfilledCount=1 with a 409 ConflictError on the loser (acceptable degradation — silent corruption was worse). Coach concurrent-edit UX preserved via retry-on-P2002 = **future enhancement deferred к carry-forward** (see § 8) — out of QA-001 closure scope.

### § 0.5 `handlePrismaError` P2002 mapping (`packages/api-server/src/utils/prisma-error-handler.ts:10-24`, verbatim)

```typescript
if (error instanceof Prisma.PrismaClientKnownRequestError) {
  if (error.code === "P2002") {
    const target = error.meta?.target;
    const field = Array.isArray(target) ? target[0] : context.field;

    throw new ConflictError(`${context.entity} with this ${field || "value"} already exists`, {
      field: field || "unknown",
    });
  }
  // ... other code branches ...
  if (error.code === "P2034") {
    throw new ConflictError(`${context.entity} was modified concurrently, please retry`);
  }
}
```

**Confirmation**: P2002 surfaces as `ConflictError` via the existing handler. No new error-handling code needed in Step 7.3.6 — constraint addition is enforcement-only; error-path already wired.

### § 0.6 Existing concurrent test case 9 (`packages/api-server/src/endpoints/lms/block/admin.test.ts:326-357`, verbatim)

```typescript
it("concurrent Block.create on the same session — at least one succeeds via P2034 retry", async () => {
  const ctx = await provisionSession();

  try {
    const [first, second] = await Promise.allSettled([
      lmsBlockApi.create(coach.user.id, activePlanId, ctx.session.id, {
        notes: "first concurrent",
      }),
      lmsBlockApi.create(coach.user.id, activePlanId, ctx.session.id, {
        notes: "second concurrent",
      }),
    ]);

    expect(first.status === "fulfilled" || second.status === "fulfilled").toBe(true);

    const fulfilledCount = [first, second].filter((r) => r.status === "fulfilled").length;
    const stored = await cleanupRaw.block.findMany({
      where: { sessionId: ctx.session.id },
      orderBy: { order: "asc" },
    });

    expect(stored).toHaveLength(fulfilledCount);

    if (fulfilledCount === 2) {
      expect(stored[0]?.order).toBe(10);
      expect(stored[1]?.order).toBe(20);
      expect(new Set(stored.map((s) => s.id)).size).toBe(2);
    }
  } finally {
    await ctx.cleanup();
  }
});
```

**Critical observation**: test asserts **at-least-one** succeeds, and the `if (fulfilledCount === 2)` block is conditional. Post-`@@unique`, fulfilledCount may shift more often к 1 (P2002 surface на loser), but **the test stays green** — design already tolerates "second fails" path. Phase 4c below adds explicit regression check.

### § 0.7 `provisionSession` test helper (`packages/api-server/src/endpoints/lms/block/admin.test.ts:23-53`, verbatim)

```typescript
const provisionSession = async (options: { planId?: string } = {}) => {
  const planId = options.planId ?? activePlanId;

  weekCounter += 1;

  const startDate = new Date(Date.UTC(2026, 0, 1));

  startDate.setUTCDate(startDate.getUTCDate() + weekCounter * 7);

  const week = await cleanupRaw.week.create({
    data: { planId, startDate },
  });
  const day = await cleanupRaw.day.create({
    data: { weekId: week.id, dayOfWeek: "TUESDAY" },
  });
  const session = await cleanupRaw.session.create({
    data: { dayId: day.id, order: 10 },
  });

  return {
    week,
    day,
    session,
    cleanup: async () => {
      await cleanupRaw.block.deleteMany({ where: { sessionId: session.id } }).catch(() => {});
      await cleanupRaw.session.delete({ where: { id: session.id } }).catch(() => {});
      await cleanupRaw.day.delete({ where: { id: day.id } }).catch(() => {});
      await cleanupRaw.week.delete({ where: { id: week.id } }).catch(() => {});
    },
  };
};
```

**Use pattern for new tests**: each test calls `await provisionSession()` to get a unique session ID (week counter increments) + uses returned `ctx.session.id` as `sessionId` for direct Prisma block inserts. `ctx.cleanup()` in `finally` block.

### § 0.8 `db:reset` + `db:seed` scripts (`packages/api-server/package.json`, verbatim)

```json
"db:push:prisma": "prisma db push",
"db:push": "prisma db push && tsx scripts/apply-sql-checks.ts",
"db:reset:prisma": "prisma db push --force-reset",
"db:reset": "prisma db push --force-reset && tsx scripts/apply-sql-checks.ts",
"db:seed": "prisma db seed",
```

**Critical**: `db:reset` does NOT auto-seed (per ADR-0019). Always follow with explicit `db:seed`. Per `[[discipline-db-non-prod]]` — Neon dev, no migration history, safe drop-recreate.

### § 0.9 `apply-sql-checks.ts` SQL file (`packages/api-server/prisma/sql/lms-checks.sql`, verbatim)

```sql
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS idx_single_head_coach
    ON "users" (role)
    WHERE role = 'HEAD_COACH';
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE marketing_reviews
    ADD CONSTRAINT chk_review_rating
      CHECK (rating BETWEEN 1 AND 5);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS plan_enrollment_unique_active
  ON lms_plan_enrollments ("planId", "athleteId")
  WHERE "deletedAt" IS NULL;
```

**Confirmation**: ZERO Block-related entries. Adding `@@unique` via Prisma DSL won't conflict with `apply-sql-checks.ts`. **DO NOT** add a SQL constraint duplicate here — Prisma is source of truth для simple composite unique constraints; `lms-checks.sql` is reserved для invariants Prisma can't express (partial unique with WHERE, named CHECK constraints).

### § 0.10 Seed has zero Block inserts (regression check)

Confirmed at prompt-write time:

```bash
grep -rn "block.create\|block\.upsert\|Block.create" packages/api-server/prisma/seed/ packages/api-server/prisma/seed.ts
# (no output)
```

Per D4 (Block content NOT seeded — Block CRUD is coach UI workflow, not seed concern). `db:reset` followed by `db:seed` produces zero Block rows; new constraint can't conflict at seed time.

### § 0.A grep enumeration (mandatory pre-execution, per `[[planner-consumer-pattern-read]]`)

Before Phase 1 schema edit, run each grep and confirm expected zero-impact:

```bash
# 1. Prisma type consumers of Block model (admin endpoints, mappers)
grep -rn "Prisma\.Block\|BlockCreateInput\|BlockUncheckedCreateInput\|BlockInclude" packages/api-server/src/
# Expected hits: BLOCK_WITH_LABELS_INCLUDE satisfies Prisma.BlockInclude (admin.ts:27). Type shape unchanged by @@unique addition; no fan-out.

# 2. Prisma client callsites on Block
grep -rn "prisma\.block\|tx\.block\|cleanupRaw\.block" packages/api-server/src/
# Expected hits: lmsBlockApi (admin.ts), week + day mappers via include (mapper code), test fixtures (admin.test.ts + provisionSession cleanup). No callsite affected by @@unique addition (none try to insert duplicate (sessionId, order)).

# 3. Mapper consumers
grep -rn "mapToBlock\|mapToBlockWithLabels" packages/api-server/src/
# Expected hits: imports + mapper definitions (block.mapper.ts, day.mapper.ts via mapToSessionWithLabelAndBlocks, week admin.ts). All read-path; schema constraint = write-time enforcement, no read effect.

# 4. Existing @@unique / @@index on Block in schema
grep -nE "@@unique|@@index" packages/api-server/prisma/schema.prisma | grep -i block
# Expected hits: @@index([sessionId, order]) on Block (line 667), @@unique([blockId, labelId]) on BlockLabelAssignment (line 680), @@index([blockId, order]) on BlockLabelAssignment (line 681), @@index([blockId, order]) on Schema (line 709), @@index([labelId]) on BlockLabelAssignment (line 682). None conflict with new @@unique([sessionId, order]) on Block.

# 5. Seed Block inserts (zero-check)
grep -rn "block\.create\|block\.upsert" packages/api-server/prisma/seed/ packages/api-server/prisma/seed.ts
# Expected: zero output (per § 0.10).

# 6. Test fixture Block inserts (sanity — no duplicate (sessionId, order) per test)
grep -rn "cleanupRaw\.block\.create" packages/api-server/src/endpoints/lms/block/admin.test.ts
# Expected hits: fixture creations in update/delete/reorder/assignLabels describe blocks (e.g., lines 243, 246, 363, 390). Each test runs `await provisionSession()` for a unique sessionId (weekCounter increments) so order: 10 fixtures don't collide across tests; within a test, fixtures explicitly use sparse orders (10, 20, 30) — no collision per session.
```

If ANY grep produces unexpected hits → STOP, surface to user via `AskUserQuestion` with the diff + hypothesis. Do not silently adapt the plan.

### § 0.B Husky hook gates (verbatim, `.husky/pre-commit` + `.husky/pre-push`)

`.husky/pre-commit`:

```
node scripts/check-secrets.mjs
npx lint-staged
SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"
```

`.husky/pre-push`:

```
pnpm dep:check
SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"
```

**Implication for commit strategy** (per `[[husky-cross-package-squash]]`): pre-commit runs `check-types --filter="...[HEAD]"` — propagates через `turbo.json` `dependsOn: ["^check-types"]` to all downstream packages of changed files. Since Step 7.3.6 touches only `packages/api-server/` (code) + `analysis/` (not a code package), the fan-out is limited to `@repo/api-server` itself + its consumers (`apps/{admin,platform,marketing}`). Prisma client regen via postinstall is type-system-neutral для `@@unique` addition (no type shape change), so no intermediate broken trees. **Single atomic commit OK** — no squash required by hook gate, but atomicity preferred for schema-change revertability (mirror Step 6.1.5 D8 pattern).

### § 0.C Commitlint config (verbatim, `commitlint.config.cjs`)

```javascript
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [2, "always", 150],
    "header-max-length": [2, "always", 100],
    "scope-case": [2, "always", "lower-case"],
    "subject-case": [2, "always", ["lower-case"]],
    "type-case": [2, "always", "lower-case"],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "docs", "style", "refactor", "test", "chore", "revert", "perf"],
    ],
  },
};
```

**Implication**: subject ≤ 100 chars, fully lower-case (acronyms too — `sessionid`, `api-server`); body lines ≤ 150 chars. Planned subject `feat(api-server): add unique constraint on block (sessionid, order)` = 62 chars ✓, lowercase ✓, type `feat` ✓.

### § 0.D er-final.md § 5 cross-cutting invariants (`analysis/artifacts/06-formalization/er-final.md:364-375`, verbatim, target locus)

```markdown
## §5. Cross-cutting invariants (post Phase 5 ratify)

1. **Bodyweight equipment ↔ Load.kind**: ...
2. **Placeholder ↔ PerSetSubstitution**: ...
3. **Nested schema kinds**: ...
4. **Compound trailing load resolution** (DP4): ...
5. **Intensity partial overlay** (Q3): ...
6. **Label.applicableLevels** — soft hint, ...
7. **Order semantics** (Q6): sparse integers, default 10/20/30 increments. Gaps allowed.
8. **BlockLabelAssignment** unique `(blockId, labelId)`: set semantics (no dups), ordered list (presentation).
9. **PerformedSession** unique `(sessionId, userId)`: latest-only (Q9). Re-do = new Session. Per D2 (2026-05-12), `userId` references `User` (external).
10. **Week** unique `(planId, startDate)`: один Week per ISO-week per Plan (D1, 2026-05-12). Day unique `(weekId, dayOfWeek)`: ≤7 Days per Week, индексированы перечислением, не sparse integer.
```

**Insertion point**: new invariant #11 immediately after #10 (mirror existing #8/#10 wording for composite uniqueness). § 4 cardinality matrix (lines 339-360) — **NO edit** (row 345 `Session → Block | 1:N (0..N) | yes (order) | Cascade` is about cardinality + ordering semantics; uniqueness lives in § 5 per existing convention).

### § 0.E implementation-notes.md § 4 structure (`analysis/artifacts/06-formalization/implementation-notes.md:1197-1333`, target locus)

```markdown
## §4. Migration considerations

### §4.1 Order field defaults (Q6)

### §4.2 Label.applicableLevels defaults

### §4.3 Exercise.defaultLoad nullable

### §4.4 Pace label removal (Q8)

### §4.5 Archetype seed

### §4.6 Catalog seed scope (Q11 Phase 7.1)

## §5. Open items / future work
```

**Insertion point**: new `### §4.7 Step 7.3.6 — Block (sessionId, order) composite uniqueness constraint` immediately after §4.6 closing and before `## §5. Open items` heading. 1-paragraph record describing what changed and why (planner: QA-001 carry-forward closure pre-Step-8 contention defense).

---

## § 1. Goal

Ship composite-uniqueness invariant on Block `(sessionId, order)` at the DB layer via Prisma `@@unique([sessionId, order])`. Closes Step 7.1 Stage 6 QA-001 carry-forward (WARNING). Pre-Step-8 surface eliminated — schema constraint shipped before Step 8 Schema entity adds more concurrent write paths to the same Block chain (Schema entity will reuse `verifyBlockOwnership` chain + introduce per-Block reorder + insert flows).

---

## § 2. Inputs (all confirmed verbatim at prompt-write time per § 0)

- Live schema: `packages/api-server/prisma/schema.prisma:653-669` — Block model with only `@@index([sessionId, order])`, no `@@unique`.
- Anchor analysis schema: `analysis/artifacts/06-formalization/schema.prisma:193-208` — mirrors live (also `@@index` only).
- Er-final § 4 cardinality matrix + § 5 cross-cutting invariants list — uniqueness convention lives in § 5 (#8/#9/#10 precedent).
- Implementation-notes § 4 Migration considerations — 6 existing entries (§4.1-§4.6); new §4.7 appends naturally.
- `db:reset` + `db:seed` scripts — ADR-0019 compliant (no migration history; Neon dev per `[[discipline-db-non-prod]]`).
- `retryOnP2034` helper — strict P2034 filter; P2002 propagates immediately.
- `handlePrismaError` — already maps P2002 → `ConflictError`; no error-handling addition needed.
- Existing concurrent test case 9 (`admin.test.ts:326-357`) — design tolerates post-constraint fulfilledCount shift к 1 occasionally.
- `apply-sql-checks.ts` SQL file — zero Block-related entries; no conflict potential.
- Seed — zero Block inserts; no `db:seed` conflict.

---

## § 3. Phases (sequential)

### Phase 1 — Live Prisma schema edit

**File**: `packages/api-server/prisma/schema.prisma`

**Change**: insert single line `  @@unique([sessionId, order])` between `@@index([sessionId, order])` and `@@map("training_blocks")` on the Block model (lines 667-668).

**Final Block model** (verbatim target — must match byte-for-byte after edit):

```prisma
model Block {
  id        String   @id @default(cuid())
  sessionId String
  order     Int
  intensity Json?
  timeCap   Json?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  session          Session                @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  labelAssignments BlockLabelAssignment[]
  schemas          Schema[]

  @@unique([sessionId, order])
  @@index([sessionId, order])
  @@map("training_blocks")
}
```

> **Note on `@@unique` + `@@index` co-existence**: Postgres creates an index implicitly for unique constraints, so the redundant `@@index` could theoretically be dropped. Step 7.3.6 keeps both lines because (a) Week + Day patterns at schema.prisma:609-610 + 627-628 both have unique + explicit index; (b) dropping the index is an unrelated cleanup; (c) test verifications stay tighter if existing query patterns continue using the named index. Index cleanup = separate concern, not in QA-001 closure scope.

### Phase 2 — Analysis-artifacts sync (3 files per WORKFLOW.md domain-model change protocol)

#### Phase 2a — `analysis/artifacts/06-formalization/schema.prisma`

**Change**: identical insertion of `  @@unique([sessionId, order])` on Block model (lines 207-208).

**Final Block model in anchor spec**:

```prisma
model Block {
  id        String   @id @default(cuid())
  sessionId String
  order     Int
  intensity Json?
  timeCap   Json?
  notes     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  session          Session                @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  labelAssignments BlockLabelAssignment[]
  schemas          Schema[]

  @@unique([sessionId, order])
  @@index([sessionId, order])
}
```

(No `@@map` — anchor spec pre-port convention.)

#### Phase 2b — `analysis/artifacts/06-formalization/er-final.md` § 5

**Change**: append new invariant #11 immediately after #10 (line 375), before the `---` separator and `## §6. Rendering` heading.

**Verbatim insertion**:

```markdown
11. **Block** unique `(sessionId, order)`: composite uniqueness — sparse-int positional ordering (#7), no duplicates within session. Engineering enforcement to prevent silent corruption under concurrent create/reorder races (Step 7.3.6 — closes Step 7.1 QA-001 pre-Step-8 surface).
```

**§ 4 cardinality matrix (lines 339-360)**: **NO edit**. Row 345 (`Session → Block`) already says "yes (order)" — that's the ordering-semantics column, not uniqueness. Uniqueness convention per existing pattern lives in § 5 invariants (#8 BlockLabelAssignment, #10 Week + Day).

#### Phase 2c — `analysis/artifacts/06-formalization/implementation-notes.md` § 4

**Change**: insert new §4.7 subsection between the closing of §4.6 (line ~1332) and the `## §5. Open items / future work` heading (line 1333).

**Verbatim insertion**:

```markdown
### §4.7 Step 7.3.6 — Block (sessionId, order) composite uniqueness constraint

Added 2026-05-18 per Step 7.3.6 (closes Step 7.1 Stage 6 QA-001 carry-forward). Prisma `@@unique([sessionId, order])` on Block model enforces composite uniqueness at the DB layer. Pre-existing `lmsBlockApi.create` flow (`_max(order) + 10` inside `Serializable` transaction wrapped in `retryOnP2034`) was previously protected only by Postgres SSI false-positive detection — under SSI predicate-lock granularity edge cases, concurrent creates on the same session could silently insert duplicate `(sessionId, order)` rows. Constraint addition eliminates the silent-corruption surface; P2002 surface on the loser propagates as `ConflictError` via existing `handlePrismaError`. Future enhancement (deferred carry-forward QA-001b): wrap `retryOnP2034` (or new variant) to also retry P2002 на `_max+N` insert pattern, preserving prior concurrent UX where two simultaneous creates often produced fulfilledCount=2. Out of QA-001 closure scope.
```

### Phase 3 — DB reset + seed

```bash
pnpm --filter @repo/api-server db:reset
pnpm --filter @repo/api-server db:seed
```

**Expected output**:

- `db:reset`: `prisma db push --force-reset` recreates schema with new `@@unique`; `tsx scripts/apply-sql-checks.ts` applies 3 SQL constraints (HEAD_COACH + review_rating + plan_enrollment_unique_active) — none conflict with new Block constraint.
- `db:seed`: `prisma db seed` runs `seed.ts` + `seed-pages.ts` — zero Block inserts, no constraint conflict.

**Verification**: query DB to confirm unique index exists:

```bash
# Optional sanity (not required for prompt completion, but useful for executor confidence)
psql "$DATABASE_URL" -c "\d training_blocks"
# Expected: index list includes "Block_sessionId_order_key" (UNIQUE) + "Block_sessionId_order_idx" (plain)
```

> **Important per `[[neon-dev-direct-url]]`**: ensure `DATABASE_URL` in `.env.local` is the direct non-pooler URL (no `-pooler` host, no `?pgbouncer=true`). Pooler triggers cache flake + slow tests + idle drop.

### Phase 4 — Test cases

**File**: `packages/api-server/src/endpoints/lms/block/admin.test.ts`

#### Phase 4a — New test case: Prisma-level direct collision (constraint floor defense)

**Insertion point**: append to `describe("create", () => { ... })` block, immediately AFTER existing case 9 (`it("concurrent Block.create on the same session ...")` at lines 326-357). New test = case 10.

**Verbatim test body**:

```typescript
it("enforces composite uniqueness on (sessionId, order) via P2002", async () => {
  const ctx = await provisionSession();

  try {
    await cleanupRaw.block.create({
      data: { sessionId: ctx.session.id, order: 10 },
    });

    await expect(
      cleanupRaw.block.create({
        data: { sessionId: ctx.session.id, order: 10 },
      }),
    ).rejects.toMatchObject({
      code: "P2002",
    });

    const stored = await cleanupRaw.block.count({ where: { sessionId: ctx.session.id } });

    expect(stored).toBe(1);
  } finally {
    await ctx.cleanup();
  }
});
```

**Rationale**: API path (`lmsBlockApi.create`) cannot trigger P2002 in a non-concurrent context — `_max(order) + 10` always yields a fresh order. Direct `cleanupRaw.block.create` with explicit `order: 10` is the only way to verify the constraint floor at the DB layer (the actual schema enforcement under test). Aligns with the planner-discipline hypothesis (e) preference: test the invariant directly, not through an API path that has its own guards.

#### Phase 4b — New test case: `retryOnP2034` passthrough on P2002 (helper boundary verification)

**Insertion point**: append to `describe("create", () => { ... })` block, immediately AFTER Phase 4a's new case. New test = case 11.

**Verbatim test body**:

```typescript
it("does not retry P2002 collision under retryOnP2034 wrap", async () => {
  const ctx = await provisionSession();

  await cleanupRaw.block.create({
    data: { sessionId: ctx.session.id, order: 10 },
  });

  try {
    const start = Date.now();

    await expect(
      retryOnP2034(() =>
        cleanupRaw.block.create({
          data: { sessionId: ctx.session.id, order: 10 },
        }),
      ),
    ).rejects.toMatchObject({
      code: "P2002",
    });

    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(50);
  } finally {
    await ctx.cleanup();
  }
});
```

**Required import addition** at top of test file (after existing `lmsBlockApi` import):

```typescript
import { retryOnP2034 } from "../../../utils";
```

**Rationale**: explicit verification that `retryOnP2034` (per § 0.3 verbatim quote) does NOT treat P2002 as retryable — passes through immediately. Elapsed-time assertion (< 50ms) catches accidental retry-wrap regression (a single retry would add the helper's jitter delay of 50-200ms). Defense against future helper refactor accidentally widening the retry filter.

#### Phase 4c — Existing case 9 regression check

**Action**: re-run existing case 9 (`packages/api-server/src/endpoints/lms/block/admin.test.ts:326-357`) **without modification**. Verify it still passes after the schema constraint addition.

**Expected behavior**: test stays green. As noted in § 0.6, the design uses `Promise.allSettled` + at-least-one assertion + conditional `if (fulfilledCount === 2)` block. Post-`@@unique`, the test may produce fulfilledCount=1 more often (P2002 surface on loser), which is still within the test's expected behavior set.

**Escalation protocol**: if case 9 fails after schema change, STOP and surface to user via `AskUserQuestion`. Likely root cause = P2002 percolates as something other than expected `Promise.allSettled` rejection. Surface verbatim failure + hypothesis (probably wrap `Promise.allSettled` result type narrowing issue OR `handlePrismaError` raises a different error class). Do not silently modify the case.

### Phase 5 — Verifications (run from repo root)

```bash
# Type-check all packages
pnpm check-types
# Expected: 16/16 packages OK

# Lint all packages
pnpm lint
# Expected: 16/16 packages OK, 0 warnings

# Full test suite
pnpm test
# Expected: 110 files, 1075 passed (baseline 1073 + 2 new cases). Existing test count baseline at HEAD d5b9d47f = 1073/1073 (per Step 7.3.5 close-out).

# api-server isolated
pnpm --filter @repo/api-server test
# Expected: 588/588 (baseline 586 + 2 new cases). Step 7.3.5 close-out baseline = 586/586.

# Dependency boundaries
pnpm dep:check
# Expected: 0 violations / 1175 modules (no new files = no module count delta from Step 7.3.5 close-out baseline of 1175).
```

If any verification fails — diagnose root cause + fix; do not bypass hooks. If non-trivial, surface to user with verbatim error + hypothesis.

### Phase 6 — Single atomic commit

**Subject**: `feat(api-server): add unique constraint on block (sessionid, order)` (62 chars; commitlint lowercase compliant; `sessionid` per `subject-case = lower-case` enforcement).

**Body** (per-section logical grouping; each line ≤ 150 chars per `body-max-line-length`):

```
- prisma: add @@unique([sessionId, order]) on Block model alongside existing @@index — closes Step 7.1 QA-001 carry-forward (WARNING).
- analysis: mirror constraint in 06-formalization/schema.prisma + add invariant #11 to er-final.md § 5 + append §4.7 record to implementation-notes.md.
- tests: +2 cases in lms/block/admin.test.ts — direct P2002 floor defense + retryOnP2034 passthrough verification.
- db: prisma db push --force-reset applied via pnpm --filter @repo/api-server db:reset; explicit db:seed follows (ADR-0019; no migration history during workflow).
- regression: existing concurrent case 9 verified green post-constraint addition (Promise.allSettled at-least-one assertion already tolerates fulfilledCount shift to 1 under unique-key SSI semantics).
- analysis-files touched: 06-formalization/{schema.prisma, er-final.md, implementation-notes.md}.
```

**Stage by explicit names** (per `[[no-db-creds-in-settings-local]]` hygiene):

```bash
git add \
  packages/api-server/prisma/schema.prisma \
  packages/api-server/src/endpoints/lms/block/admin.test.ts \
  analysis/artifacts/06-formalization/schema.prisma \
  analysis/artifacts/06-formalization/er-final.md \
  analysis/artifacts/06-formalization/implementation-notes.md
```

Then `git commit -m "..." -m "..."` via HEREDOC for proper multi-line body formatting.

**Husky gates**: pre-commit (lint-staged + check-types) + commit-msg (commitlint) + pre-push (dep:check + lint+check-types upstream). All must pass clean. NO `--no-verify`.

---

## § 4. Acceptance criteria (must self-check in `output.md`)

1. `packages/api-server/prisma/schema.prisma` Block model has `@@unique([sessionId, order])` line between `@@index([sessionId, order])` and `@@map("training_blocks")` — verbatim match against § 3 Phase 1 target.
2. `analysis/artifacts/06-formalization/schema.prisma` Block model has identical `@@unique([sessionId, order])` line (no `@@map`).
3. `analysis/artifacts/06-formalization/er-final.md` § 5 contains new invariant #11 immediately after #10 — verbatim match against § 3 Phase 2b text.
4. `analysis/artifacts/06-formalization/implementation-notes.md` contains new §4.7 subsection between §4.6 closing and § 5 heading — verbatim match against § 3 Phase 2c text.
5. `analysis/artifacts/06-formalization/er-final.md` § 4 cardinality matrix (lines 339-360) **unchanged** (uniqueness lives in § 5 per existing convention).
6. `analysis/artifacts/05-synthesis/domain-model.md` **untouched** (entity semantics unchanged — Block already conceptually unique-per-position-in-session via sparse-int ordering; constraint is engineering enforcement, not domain-model change).
7. `analysis/artifacts/06-formalization/{stress-final.md}` + `analysis/artifacts/05-synthesis/{stress-test.md}` **untouched** (no new edge case driven this change — QA-001 was latent regression risk, not stress-test case).
8. `db:reset` + `db:seed` run clean — no Block constraint conflict (seed has zero Block inserts; lms-checks.sql has zero Block entries).
9. Phase 4a new case (direct P2002 floor defense) passes — second `cleanupRaw.block.create` with duplicate `(sessionId, order=10)` throws with `code: "P2002"`.
10. Phase 4b new case (retryOnP2034 passthrough) passes — `retryOnP2034(() => cleanupRaw.block.create(...))` throws P2002 immediately (elapsed < 50ms; no retry delay).
11. Phase 4c existing case 9 still green — concurrent `lmsBlockApi.create` test passes (fulfilledCount may shift к 1 occasionally under P2002 surface; test design tolerates).
12. `pnpm check-types` 16/16 OK (no new TS errors from Prisma client regen — `@@unique` is type-system-neutral).
13. `pnpm lint` 16/16 OK, 0 warnings (no new code outside additive test cases + import line).
14. `pnpm test` 1075/1075 (110 files; baseline 1073 + 2 new cases = exact match).
15. `pnpm --filter @repo/api-server test` 588/588 (baseline 586 + 2 new cases).
16. `pnpm dep:check` 0/1175 (exact baseline match — no new files = no module count delta).
17. Single atomic commit on `feat/training-domain` (no branch cut, no squash needed by hook gate — atomic preferred for revertability per Step 6.1.5 D8 mirror).
18. Husky pre-commit + commit-msg + pre-push all clean without `--no-verify` / `--no-edit` / `--no-gpg-sign`.
19. Commit subject `feat(api-server): add unique constraint on block (sessionid, order)` (62 chars ≤ 100; lowercase incl. `sessionid` per `subject-case` rule).
20. Commit body lists per-section changes (≤ 150 chars per line per `body-max-line-length`).
21. `output.md` records `analysis-files touched: 06-formalization/{schema.prisma, er-final.md, implementation-notes.md}` per WORKFLOW.md domain-model change protocol.
22. Self-check on every § 0 verbatim quote (re-Read each path at execution time; confirm byte-for-byte match against this prompt; surface any drift via `AskUserQuestion` before proceeding).

---

## § 5. Adversarial pass (mandatory per `[[planner-adversarial-review]]`)

**Six axes — schema-change blast radius:**

### Axis 1 — Existing Block rows post-`db:reset`

`db:reset` drops all data via `prisma db push --force-reset`. Constraint applied к fresh schema; no migration of existing data needed (per `[[discipline-db-non-prod]]` — non-prod Neon dev). **No regression risk.**

### Axis 2 — Concurrent `lmsBlockApi.create` on same session (case 9 behavior)

Pre-constraint: `Serializable` transaction with `_max(order) + 10` computation; SSI predicate-lock catches concurrent aggregate reads → P2034 → retried via `retryOnP2034` → second tx sees updated max → succeeds with order=N+20.

Post-constraint: same Serializable + retry path; **plus** unique-key enforcement at insert. If SSI catches first (typical под Serializable per `[[postgres-ssi-upsert-unique-key]]`): same P2034 retry path; both fulfilled most of the time. If SSI doesn't catch (predicate-lock granularity edge): unique check raises P2002 → `handlePrismaError` → `ConflictError` → caller sees rejected with 409.

**Net behavior**: test case 9 stays green (at-least-one assertion tolerant). Concurrent UX may degrade slightly (fewer fulfilledCount=2 outcomes), but silent-corruption case (pre-constraint duplicate orders) is eliminated. **Acceptable trade-off**; future enhancement deferred к carry-forward (see § 8).

### Axis 3 — `lmsBlockApi.reorder` operation (`packages/api-server/src/endpoints/lms/block/admin.ts:193-246`)

Reorder uses `prisma.$transaction(data.orderedIds.map((id, i) => prisma.block.update({where: {id}, data: {order: (i+1)*10}})))` — sequential updates at **default isolation** (NOT Serializable), NO `retryOnP2034` wrap.

Concurrent reorder + create scenario:

- Pre-constraint: create grabs `_max(order)=N`, computes N+10, inserts; reorder simultaneously updates existing block X from order=N+10 к something else → no insert collision (different rows; but duplicate orders silently produced if reorder shifts X к order=N+10 mid-flight).
- Post-constraint: reorder UPDATE with new `order=K` could collide with concurrent create INSERT at same K → P2002 raises on whichever commits second → caller sees clear error → admin retries manually.

**Net result**: post-constraint is **safer** (no silent corruption; eventually consistent admin retry). Reorder is admin-only path (not coach hot path); P2002 surface acceptable. **NO API change required**. Flag as known behavior note in § 8.

### Axis 4 — `lmsBlockApi.update` operation (`admin.ts:155-179`)

Update conditional-spreads `intensity`/`timeCap`/`notes` only — **NEVER touches `order` field** (verified at admin.ts:163-170). No constraint risk. **No regression.**

### Axis 5 — `lmsBlockApi.delete` operation (`admin.ts:181-191`)

Delete removes row — frees up `(sessionId, order)` slot. No constraint risk. Cascade Block → BlockLabelAssignment[] + Schema[] per FK `onDelete: Cascade`. **No regression.**

### Axis 6 — Test fixtures with hardcoded `order: 10`

Multiple existing test cases create blocks at `order: 10` (e.g., admin.test.ts:363, 390 in update/delete describe blocks). Each test calls `await provisionSession()` which increments `weekCounter` and creates a unique session ID — so `order: 10` fixtures are unique per session context (no cross-test collision). Within a single test, fixtures explicitly use sparse orders (10, 20, 30 — no internal collision). **No regression**.

Verify via grep (§ 0.A item 6) at execution time.

### Axis 7 — Test cleanup with `cleanupRaw.block.deleteMany`

`provisionSession` cleanup at line 47: `await cleanupRaw.block.deleteMany({ where: { sessionId: session.id } }).catch(() => {})`. Deletes all blocks for session before session itself. **No constraint interference** (deleteMany doesn't insert).

---

## § 6. Open questions ratifications (already locked at thesis cycle 2026-05-18)

All 8 OQ (a-g + h) ratified by user per planner thesis:

- **(a)** Verbatim reads — confirmed; § 0.1-0.10 above.
- **(b)** Constraint syntax `@@unique([sessionId, order])` — confirmed; standard Prisma mirror of Week/Day pattern (§ 0.1).
- **(c)** `db:reset` + `db:seed` execution timing — confirmed; ADR-0019 compliant; non-prod Neon dev per `[[discipline-db-non-prod]]`.
- **(d)** Analysis sync scope — confirmed; § 5 invariant #11 (NOT § 4 cardinality matrix), per existing pattern #8/#10.
- **(e)** Test scope — confirmed; 2 cases (P2002 floor + retryOnP2034 passthrough) + verify case 9 unchanged.
- **(f)** `retryOnP2034` + P2002 interaction — confirmed; strict P2034 filter (§ 0.3 verbatim); P2002 propagates.
- **(g)** Pipeline pick `/feature small` — confirmed; mirrors Step 6.1.5 D8 (analysis-touch + schema change shipped `/feature small`).
- **(h)** Session bundling H1 (Block-only) — confirmed; Session = future carry-forward QA-001b (see § 8); strict per-step single-concern.

NO new escalations expected at execution time. If anything surfaces (e.g., grep produces unexpected hits in § 0.A; verbatim drift in § 0.1-0.10; case 9 regression in Phase 4c) — STOP, surface via `AskUserQuestion` with hypothesis.

---

## § 7. Commit strategy (verified against live hook config per `[[husky-cross-package-squash]]`)

**Pre-check** (verbatim § 0.B):

- `.husky/pre-commit` runs `pnpm turbo run check-types --filter="...[HEAD]"` — fan-out to all packages depending on changed files.
- `turbo.json` `check-types: dependsOn: ["^check-types"]` — propagates upstream.
- Touched paths:
  - `packages/api-server/prisma/schema.prisma` → Prisma client regen via postinstall → `@@unique` is type-system-neutral (no shape change to `Prisma.BlockCreateInput` / `BlockInclude`).
  - `packages/api-server/src/endpoints/lms/block/admin.test.ts` → api-server isolated check-types.
  - `analysis/artifacts/06-formalization/*` → NOT a code package; no check-types impact.
- **No intermediate broken trees expected** — schema change is additive enforcement-only; existing types unchanged.

**Pick**: **single atomic commit** covering schema + analysis sync + tests. Rationale:

- Cross-package squash NOT required by hook gate (single-package code scope).
- Single atomic preferred for **schema-change revertability** (mirror Step 6.1.5 D8 precedent: one commit to revert if needed; per-layer body subsections document logical grouping).
- Analysis files are auxiliary artifacts of the schema change — natural to ship together.

**Commit subject**: `feat(api-server): add unique constraint on block (sessionid, order)` — 62 chars ≤ 100; lowercase incl. `sessionid` (per `subject-case = lower-case` rule); type `feat` (additive enforcement layer).

**Commit body** (per-section logical grouping, ≤ 150 chars per line):

```
- prisma: add @@unique([sessionId, order]) on Block model alongside existing @@index — closes Step 7.1 QA-001 carry-forward (WARNING).
- analysis: mirror constraint in 06-formalization/schema.prisma + add invariant #11 to er-final.md § 5 + append §4.7 record to implementation-notes.md.
- tests: +2 cases in lms/block/admin.test.ts — direct P2002 floor defense + retryOnP2034 passthrough verification.
- db: prisma db push --force-reset applied via pnpm --filter @repo/api-server db:reset; explicit db:seed follows (ADR-0019; no migration history during workflow).
- regression: existing concurrent case 9 verified green post-constraint addition (Promise.allSettled at-least-one assertion already tolerates fulfilledCount shift to 1 under unique-key SSI semantics).
- analysis-files touched: 06-formalization/{schema.prisma, er-final.md, implementation-notes.md}.
```

**HEREDOC pattern** (per harness convention):

```bash
git commit -m "$(cat <<'EOF'
feat(api-server): add unique constraint on block (sessionid, order)

- prisma: add @@unique([sessionId, order]) on Block model alongside existing @@index — closes Step 7.1 QA-001 carry-forward (WARNING).
- analysis: mirror constraint in 06-formalization/schema.prisma + add invariant #11 to er-final.md § 5 + append §4.7 record to implementation-notes.md.
- tests: +2 cases in lms/block/admin.test.ts — direct P2002 floor defense + retryOnP2034 passthrough verification.
- db: prisma db push --force-reset applied via pnpm --filter @repo/api-server db:reset; explicit db:seed follows (ADR-0019; no migration history during workflow).
- regression: existing concurrent case 9 verified green post-constraint addition (Promise.allSettled at-least-one assertion already tolerates fulfilledCount shift to 1 under unique-key SSI semantics).
- analysis-files touched: 06-formalization/{schema.prisma, er-final.md, implementation-notes.md}.
EOF
)"
```

**Stage by explicit names** (per `[[no-db-creds-in-settings-local]]` hygiene — NEVER `git add -A` / `git add .`):

```bash
git add \
  packages/api-server/prisma/schema.prisma \
  packages/api-server/src/endpoints/lms/block/admin.test.ts \
  analysis/artifacts/06-formalization/schema.prisma \
  analysis/artifacts/06-formalization/er-final.md \
  analysis/artifacts/06-formalization/implementation-notes.md
```

---

## § 8. Out of scope

- **Session `@@unique([dayId, order])`** — same latent regression surface; ratified H1 (Block-only) per thesis OQ-h. Flag as new carry-forward QA-001b: "Session model has identical `@@index([dayId, order])` without `@@unique`; same SSI-mechanism protection as pre-Step-7.3.6 Block; future Step 7.x or pre-Step-8 cleanup". Mirror Step 7.3.6 implementation pattern (1-line schema + analysis sync + 2 tests).
- **`BlockLabelAssignment.order` uniqueness** — presentation ordering, set semantics already enforced via `@@unique([blockId, labelId])`. No QA-001-level latent regression surface. Not in scope.
- **Schema/SchemaRow `@@unique([parent, order])`** — Step 8 future scope; will be designed with constraint from the start.
- **`retryOnP2034` extension к also retry P2002** — flagged as future enhancement carry-forward QA-001c: "Block.create concurrent UX — post-constraint loser sees immediate P2002 ConflictError instead of retry. Helper extension (new variant `retryOnConcurrentInsertRace` taking both codes) preserves prior concurrent UX where two simultaneous creates often produced fulfilledCount=2. Step 7.x or pre-Step-8 cleanup".
- **Reorder operation Serializable wrap + retry-on-P2034** — admin-only path; P2002 surface acceptable. Same axis-3 reasoning. Not in QA-001 closure scope.
- **Index cleanup (drop redundant `@@index` alongside `@@unique`)** — Week + Day patterns keep both lines; unrelated optimization concern. Not in scope.
- **UI changes** — Step 7.4 strictly.

---

## § 9. Carry-forwards to record in `output.md`

**NEW** (post Step 7.3.6 close):

- **QA-001b — Session `@@unique([dayId, order])`** — same latent regression surface as Block pre-7.3.6; admin-only path; flag для future Step 7.x or pre-Step-8 cleanup. Mirror Step 7.3.6 implementation pattern.
- **QA-001c — `retryOnP2034` widening к also retry P2002** — preserve concurrent-UX where prior fulfilledCount=2 outcomes degraded к 1 post-`@@unique` addition. Helper extension OR new variant. Step 7.x or pre-Step-8 cleanup.

**PRE-EXISTING unchanged** (from Step 7.3.5 close-out):

- **`DAY_INCLUDE` hoist к shared `endpoints/lms/_shared/day-include.ts`** — Step 8 Schema entity trigger.
- **`BLOCK_WITH_LABELS_INCLUDE` hoist к shared module** — Step 8 trigger.
- **`mapToBlockWithSchemas` mapper** — Step 8 (Schema entity).
- **Symbol rename `cms{Label,Exercise}AdminApi` → `lms*`** — Step 6.1.5 deferred, low priority.
- **`useLabelSearch({level:"BLOCK"})` 3rd callsite** — Step 7.4 trigger per R1 ratification.
- **React Context для label preload** — Step 7.4 trigger (5-6 level prop drilling materializes).
- **QA-006 HEAD_COACH + ARCHIVED composition test** — INFO, optional.
- **QA-019 D-7 invariant outcome-only test** — accepted per `[[no-tech-debt-in-mocks]]`.
- **QA-022 TxClient Omit deny-list fragile к Prisma upgrades** — flag для `/upgrade @prisma/client` prompts.

**CLOSED**:

- **QA-001 Block `@@unique([sessionId, order])`** — shipped в Step 7.3.6 (this step).

---

## § 10. `output.md` structure (executor produces per WORKFLOW.md § "output.md format")

Headers in Russian prose where natural, English for code/paths:

```markdown
## Что сделано

<3-5 line summary>

## Изменённые/созданные файлы

<list with LOC counts>

## Принятые решения

<D-1, D-2, ... — each minor justification with rationale>

## Возникшие вопросы и как решены

<any § 0 escalations OR none>

## Что отложено

<carry-forwards per § 9 above>

## Ссылка на `.feature-dev/<ts>/`

`.feature-dev/<ts>/`

## Verification notes

<verbatim console output for each Phase 5 command>

## Acceptance criteria self-check

<22 numbered points per § 4 above, each ✓ or ✗ with rationale>
```

No smoke-test section needed — Step 7.3.6 is backend-only (schema constraint + analysis sync + integration tests). First scenario-based browser smoke arrives Step 7.4 (BlockList + BlockCard surface).

---

## Final reminder — planner discipline (per `[[coach-pov-first]]` + 7-flavour checklist)

- Every change traceable к either § 0 verbatim quote OR ratified OQ in § 6.
- No instinct-engineering ("seems cleaner to also drop the redundant index" / "let's also wrap reorder in retry while we're here") — out of scope = deferred carry-forward, NOT silent expansion.
- Every § 0 verbatim quote re-Read at execution time; any drift → STOP + `AskUserQuestion`.
- § 0.A grep enumeration MUST run pre-Phase-1; any unexpected hit → STOP + surface.
- Existing case 9 regression check (Phase 4c) is mandatory — do not skip even if "case 9 looks safe under analysis".
- HEREDOC commit body — single atomic; never bypass hooks; subject lowercase incl. acronyms (`sessionid`, `api-server`).

**Правильное решение важнее времени и усилий.**
