# Step 7.3.5 — Block embed в week response (read-surface enabler)

**Branch**: `feat/training-domain` (HEAD `c7e95e44` post-Step-7.3 close-out; 5 commits ahead of `main`). Stay on this branch — do NOT cut a feature branch (see § Execution mode).

**Type**: Cross-package backend read-surface enabler (contracts + api-server). Pure additive — extends `sessionWithLabelSchema` с `blocks: Block[]` field (mirror Step 6.2 D7 embed pattern one level deeper: Session → Block, applied here exactly as Day → Session was applied в Step 6.2). **Read-surface gap fix** identified at Step 7.4 thesis-time per `[[planner-read-surface-trace]]` finding.

**Scope**: 5 file edits across 2 packages — extend Zod schema; extend Prisma include nested for blocks; extract `mapToSessionWithLabelAndBlocks` named helper (closes Step 6.2 D-2 carry-forward); +3 api-server integration test cases; +1-2 contract schema test cases. **No new files; no Prisma schema change; no analysis-artifacts change; no UI; no api-routes; no apps/platform/.** Strictly read-shape widening.

**Execution mode**: **`/feature small` pipeline** per `[[always-via-feature-skill]]` (single-vertical backend slice; additive; no architectural decisions). **Branch-cut override MANDATORY**: this step lives on long-lived `feat/training-domain` per `[[training-domain-workflow]]`. If `/feature small` Stage 0 attempts `git checkout -b feat/<slug>` from main, you MUST **STOP** and `AskUserQuestion` showing attempted branch + planner override directive, then continue on current `feat/training-domain` branch.

---

## § 0. Hard triggers — read-then-act gate

Before any code, **verify every verbatim quote in § 0.1-0.5 against current branch HEAD `c7e95e44` byte-for-byte**. If any quote diverges, **STOP**, run `AskUserQuestion` showing actual file content + this prompt's claim, wait for planner ratification. Do NOT silently adapt — planner owns prompt errors.

### § 0.0 Prior-implementation trace stops

This is the **4th attempt** at this domain; prior three deleted (per `implementation/WORKFLOW.md`). If you encounter vocab like `SchemeType`, `SETS_REPS as 9th archetype`, `per-block atomic save`, `coach always edit mode`, `plan-editor rollback`, ADR-0037/0041/0042/0043 — STOP and surface. Only legitimate sources are `analysis/artifacts/`, live Prisma schema, the Step 7.0 contracts + Step 7.1 api-server + Step 7.2 routes + Step 7.3 client hooks, и Step 6.2 D7 Day-embed mirror referenced here.

### § 0.A Zero-state verification commands

Run at executor launch и verify expected counts:

```bash
grep -n "blocks" packages/contracts/src/entities/lms/day/day.schema.ts
# Expected: 0 hits BEFORE step. Step 7.3.5 adds `blocks: z.array(blockSchema)` field to sessionWithLabelSchema.

grep -n "blocks" packages/api-server/src/endpoints/lms/week/admin.ts
# Expected: 0 hits BEFORE step. Step 7.3.5 extends Prisma include с nested blocks.

grep -n "blocks\|mapToBlock" packages/api-server/src/mappers/lms/day.mapper.ts
# Expected: 0 hits BEFORE step. Step 7.3.5 imports mapToBlockWithLabels + uses it в session mapper.

grep -n "mapToSessionWithLabel\b" packages/api-server/src/mappers/lms/
# Expected: 0 hits BEFORE step (Step 6.2 D-2 inline-spread — no named helper yet). Step 7.3.5 extracts `mapToSessionWithLabelAndBlocks`.

grep -n "blocks" packages/contracts/src/entities/lms/day/day.schema.test.ts
# Expected: 0 hits BEFORE step. Step 7.3.5 adds 1-2 contract test cases.

grep -rln "@repo/contracts/lms/block" packages/api-server/src/mappers/
# Expected: 1 hit (block.mapper.ts already imports). Step 7.3.5 also imports from day.mapper.ts → expected 2 hits after.

grep -rln "@repo/contracts/lms/block" apps/platform/src/
# Expected: 2 hits (blocks.ts + use-blocks.ts from Step 7.3). UNCHANGED — Step 7.3.5 doesn't touch apps/platform/.
```

### § 0.B Domain-trace stops (scope-narrow guards)

Per `[[planner-read-surface-trace]]` + `[[always-via-feature-skill]]` — Step 7.3.5 is **strictly contract + api-server read-shape widening**. If you find yourself tempted to:

- Touch any file under `apps/platform/` — **STOP**, surface. Step 7.4 will consume widened response shape transparently via TS types; no platform change in 7.3.5.
- Touch any file under `packages/api-routes/` — **STOP**, surface. Route handlers return wider response transparently.
- Change Prisma schema (`packages/api-server/prisma/schema.prisma`) — **STOP**, surface. Step 7.3.5 = read-shape only; QA-001 schema constraint `@@unique([sessionId, order])` defers to **Step 7.3.6** (separate sub-step, pre-Step-8) per planner ratification.
- Update analysis-artifacts (`analysis/artifacts/05-synthesis/` or `06-formalization/`) — **STOP**, surface. No domain-model semantics change; no Prisma schema touch; analysis-files-touched = none per WORKFLOW.md.
- Add Block routes or change Block client API/hooks — **STOP**, surface. All Block CRUD shipped Steps 7.1-7.3.
- Touch any contract namespace beyond `packages/contracts/src/entities/lms/day/` — **STOP**, surface. `block.schema.ts` (Step 7.0) provides `blockSchema` import; no contract changes elsewhere.

### § 0.1 Current `sessionWithLabelSchema` (`packages/contracts/src/entities/lms/day/day.schema.ts:1-29`, full file)

Insertion target — add `blocks: z.array(blockSchema)` field to `sessionWithLabelSchema.extend({...})`. Name **unchanged** (extend in place per OQ (a) ratification 2026-05-18 — mirror Step 6.2 precedent where Day sessions array shape changed without rename).

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

**Expected final state** for `sessionWithLabelSchema`:

```ts
import { blockSchema } from "../block";
// ...rest of imports unchanged

export const sessionWithLabelSchema = sessionSchema.extend({
  label: labelSchema.nullable(),
  blocks: z.array(blockSchema),
});
```

Notes:

- Import `blockSchema` from `"../block"` (Step 7.0 barrel export — verified at `packages/contracts/src/entities/lms/block/index.ts`).
- Field NOT optional: empty session must return `blocks: []`, not `blocks: undefined` (mirror `sessions: []` pattern в daySlotSchema).
- `blockSchema` from Step 7.0 already embeds `labels: Label[]` field per Step 7.0 D7 ship — chained embed: DaySlot → SessionWithLabel → Block + labels[].
- `daySlotSchema.sessions: z.array(sessionWithLabelSchema)` type widens transitively — no edit needed at daySlotSchema level.

### § 0.2 Current `lmsWeekApi.getByPlanAndDate` (`packages/api-server/src/endpoints/lms/week/admin.ts:14-42`, full method)

Extension target — Prisma `include` for `sessions` gains nested `blocks` include с ordering для blocks + nested ordering для labelAssignments.

```ts
export const lmsWeekApi = {
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
  // ...upsertNotes unchanged
};
```

**Expected final state** — extend `sessions.include` с nested `blocks`:

```ts
sessions: {
  orderBy: { order: "asc" },
  include: {
    label: true,
    blocks: {
      orderBy: { order: "asc" },
      include: {
        labelAssignments: {
          orderBy: { order: "asc" },
          include: { label: true },
        },
      },
    },
  },
},
```

Notes:

- Block ordering `orderBy: {order: "asc"}` (Block.order sparse integer per Step 7.0 — mirror Session ordering invariant).
- `labelAssignments.orderBy: {order: "asc"}` — BlockLabelAssignment.order sparse integer per Step 7.1 (mapper sort defense already present, но Prisma orderBy preferred — ground truth at query level).
- `include: {label: true}` inside labelAssignments — fetch Label entity for each BlockLabelAssignment join row.
- `upsertNotes` method **unchanged** (no read-shape semantics; pure write).

### § 0.3 Current `mapToDaySlot` (`packages/api-server/src/mappers/lms/day.mapper.ts:1-27`, full file)

Two-part change:

1. Extend `DayWithRelations` Prisma type to include nested `blocks` per session.
2. **Extract** `mapToSessionWithLabelAndBlocks` named helper (closes Step 6.2 D-2 carry-forward per OQ (b) ratification) — replaces inline spread `{...mapToSession(s), label: ...}` с named function call.

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

**Expected final state**:

```ts
import {
  type Block as PrismaBlock,
  type BlockLabelAssignment as PrismaBlockLabelAssignment,
  type Day as PrismaDay,
  type Label as PrismaLabel,
  type Session as PrismaSession,
} from "@prisma/client";

import { type DayOfWeek } from "@repo/contracts/lms/_shared";
import { type DaySlot, type SessionWithLabel } from "@repo/contracts/lms/day";

import { mapToBlockWithLabels } from "./block.mapper";
import { mapToLabel } from "./label.mapper";
import { mapToSession } from "./session.mapper";

type BlockWithLabelsRelation = PrismaBlock & {
  labelAssignments: (PrismaBlockLabelAssignment & { label: PrismaLabel })[];
};

type SessionWithRelations = PrismaSession & {
  label: PrismaLabel | null;
  blocks: BlockWithLabelsRelation[];
};

type DayWithRelations = PrismaDay & {
  label: PrismaLabel | null;
  sessions: SessionWithRelations[];
};

export const mapToSessionWithLabelAndBlocks = (s: SessionWithRelations): SessionWithLabel => ({
  ...mapToSession(s),
  label: s.label ? mapToLabel(s.label) : null,
  blocks: s.blocks.map(mapToBlockWithLabels),
});

export const mapToDaySlot = (dayOfWeek: DayOfWeek, day: DayWithRelations | null): DaySlot => ({
  dayOfWeek,
  label: day?.label ? mapToLabel(day.label) : null,
  notes: day?.notes ?? null,
  sessions: (day?.sessions ?? []).map(mapToSessionWithLabelAndBlocks),
});
```

Notes:

- Helper name = `mapToSessionWithLabelAndBlocks` (descriptive; mirrors `mapToBlockWithLabels` convention from Step 7.1).
- Helper return type = `SessionWithLabel` (transitively widened to include `blocks: Block[]` via § 0.1 contract change).
- `BlockWithLabelsRelation` type mirrors `BlockWithLabels` from `block.mapper.ts:12-14` shape — re-declared here as local Prisma type for `DayWithRelations` chain. (Не reuse via export from block.mapper.ts — type stays mapper-internal per Step 7.1 convention.)
- `mapToBlockWithLabels` imported from `./block.mapper` — already shipped Step 7.1 verbatim (§ 0.4 below). Reuse-as-is.
- Day.mapper.ts barrel `mappers/lms/index.ts` += `export { mapToSessionWithLabelAndBlocks } from "./day.mapper"` IF executor uses it elsewhere — but Step 7.3.5 scope only consumes it inside same file. Skip barrel export. Add only when downstream consumer arrives (likely Step 7.4 NOT, since UI uses Zod-inferred types not mappers; api-server-internal).

### § 0.4 `mapToBlockWithLabels` reference (`packages/api-server/src/mappers/lms/block.mapper.ts:12-33` — Step 7.1, reuse-as-is)

Step 7.3.5 imports this helper unchanged. Quoted here для confirmation it exists и matches expected shape.

```ts
type BlockWithLabels = PrismaBlock & {
  labelAssignments: (PrismaBlockLabelAssignment & { label: PrismaLabel })[];
};

export const mapToBlock = (b: PrismaBlock): Block => ({
  id: b.id,
  sessionId: b.sessionId,
  order: b.order,
  intensity: b.intensity === null ? null : intensitySchema.parse(b.intensity),
  timeCap: b.timeCap === null ? null : timeCapSchema.parse(b.timeCap),
  notes: b.notes,
  labels: [],
  createdAt: b.createdAt,
  updatedAt: b.updatedAt,
});

export const mapToBlockWithLabels = (b: BlockWithLabels): Block => ({
  ...mapToBlock(b),
  labels: [...b.labelAssignments]
    .sort((a, x) => a.order - x.order)
    .map((la) => mapToLabel(la.label)),
});
```

Notes:

- `mapToBlockWithLabels` performs defensive shallow-copy sort by `labelAssignments.order` (Step 7.1 implementation detail). Prisma `orderBy` в § 0.2 query is the primary order source; mapper sort is defense-in-depth.
- `intensitySchema.parse` / `timeCapSchema.parse` on read — fires only when `b.intensity` / `b.timeCap` non-null. DB-corruption defense via `handlePrismaError` ZodError branch shipped Step 7.2 — `mapToDaySlot → mapToSessionWithLabelAndBlocks → mapToBlockWithLabels` chain inherits this defense.

### § 0.5 `blockSchema` reference (`packages/contracts/src/entities/lms/block/block.schema.ts` — Step 7.0)

`blockSchema` already embeds `labels: Label[]` (Step 7.0 D7 pattern). Confirms chained embed in Step 7.3.5 produces: `DaySlot.sessions[].blocks[].labels[]` — 4 levels of nested entities per `getWeekResponse`.

Verify import path: `import { blockSchema } from "../block"` (barrel) — NOT deep `import { blockSchema } from "../block/block.schema"` (deep-import forbidden per Step 7.3 anti-pattern precedent).

---

## § 1. Goal

Ship the read-surface enabler: extend `getWeekResponseSchema.days[].sessions[]` to embed `blocks: Block[]` field так что Step 7.4 UI can render `BlockList` per `SessionCard` from a single `useWeek` fetch. Pure additive backend slice; closes the read-path gap surfaced at Step 7.4 thesis-time (per `[[planner-read-surface-trace]]`). No new files, no Prisma schema change, no analysis-artifact change, no UI consumer change in this step.

## § 2. Scope checklist (per-file)

**EDIT** (5 files):

1. `packages/contracts/src/entities/lms/day/day.schema.ts` — extend `sessionWithLabelSchema` += `blocks: z.array(blockSchema)`; add `blockSchema` import from `"../block"`.
2. `packages/contracts/src/entities/lms/day/day.schema.test.ts` — +1-2 cases verifying `blocks` field accepts array of valid blocks + empty array valid.
3. `packages/api-server/src/endpoints/lms/week/admin.ts` — extend `prisma.week.findUnique({...}).include.days.include.sessions.include` += `blocks: {orderBy, include: {labelAssignments: {orderBy, include: {label: true}}}}`.
4. `packages/api-server/src/endpoints/lms/week/admin.test.ts` — +3 cases: (i) embedded blocks shape per Session с 2 blocks each + labels; (ii) empty blocks array — Session without blocks returns `blocks: []`; (iii) cross-Session isolation — blocks belonging to Session A не leak в Session B's response.
5. `packages/api-server/src/mappers/lms/day.mapper.ts` — extract `mapToSessionWithLabelAndBlocks` named helper; extend `DayWithRelations` Prisma type chain; integrate в `mapToDaySlot.sessions.map(...)`.

**NEW**: 0 files.

**NO**:

- `packages/api-server/prisma/schema.prisma` — no schema change (QA-001 constraint defers к Step 7.3.6).
- `analysis/artifacts/` — no domain-model semantics change; no Prisma schema touch.
- `packages/contracts/src/entities/lms/block/` — Step 7.0 contract reused as-is.
- `packages/contracts/src/entities/lms/session/` — Session schema unchanged (only `sessionWithLabelSchema` extension in `lms/day/`).
- `packages/api-server/src/endpoints/lms/block/` — Step 7.1 endpoints unchanged.
- `packages/api-server/src/mappers/lms/block.mapper.ts` — Step 7.1 mapper reused as-is.
- `packages/api-routes/` — route handlers transparent.
- `apps/platform/` — UI defers к Step 7.4; types update transitively via TS compilation.
- Block routes (`apps/platform/src/app/api/.../blocks/`) — Step 7.2 reads not in scope (Block CRUD via routes; week read = lmsWeekApi.getByPlanAndDate).
- `apps/platform/src/lib/api/endpoints/blocks.ts` + `use-blocks.ts` — Step 7.3 unchanged.

## § 3. Phases

Single phase per `[[husky-cross-package-squash]]` ratification (OQ (f) — squash trigger). All 5 file edits ship in **one atomic commit**. Phase boundaries below are logical (for code organization), not commit boundaries.

### Logical Phase A — Contract slice extend (1 file + 1 test file)

Edit `packages/contracts/src/entities/lms/day/day.schema.ts`:

```ts
import { z } from "zod";

import { blockSchema } from "../block";
import { dayOfWeekSchema } from "../_shared";
import { labelSchema } from "../label";
import { sessionSchema } from "../session";

import { DAY_CONSTANTS } from "./day.constants";

export const sessionWithLabelSchema = sessionSchema.extend({
  label: labelSchema.nullable(),
  blocks: z.array(blockSchema),
});

// ...rest of file unchanged (daySlotSchema, updateDayLabelSchema, updateDayNotesSchema)
```

Edit `packages/contracts/src/entities/lms/day/day.schema.test.ts`:

- +1 case в `describe("sessionWithLabelSchema")` (or top-level if no describe exists) — verify schema accepts `{...validSession, label: ..., blocks: [validBlock]}`.
- +1 case — verify schema accepts empty array `blocks: []`.
- (Optional 3rd case: rejection when `blocks` field missing — verifies non-optional.)

### Logical Phase B — api-server query extend (1 file)

Edit `packages/api-server/src/endpoints/lms/week/admin.ts:14-42`:

Modify `prisma.week.findUnique({...}).include.days.include.sessions` to add nested blocks include per § 0.2 expected-final-state quote. No other changes к file.

### Logical Phase C — Mapper extract + extend (1 file)

Edit `packages/api-server/src/mappers/lms/day.mapper.ts` per § 0.3 expected-final-state quote:

- Add Prisma imports for `Block as PrismaBlock` + `BlockLabelAssignment as PrismaBlockLabelAssignment`.
- Add `SessionWithLabel` type import from `@repo/contracts/lms/day`.
- Add `mapToBlockWithLabels` import from `./block.mapper`.
- Add `BlockWithLabelsRelation` Prisma type alias.
- Extend `DayWithRelations.sessions` к `SessionWithRelations[]` (new type alias).
- **Extract** `mapToSessionWithLabelAndBlocks` named exported helper (replaces inline spread).
- Refactor `mapToDaySlot.sessions` map к use the new helper.

### Logical Phase D — api-server integration tests (1 file)

Edit `packages/api-server/src/endpoints/lms/week/admin.test.ts`:

- +3 cases в existing `describe("getByPlanAndDate")` block (or analogous):

**Case D-1 (embedded blocks shape — happy path)**:

- Setup: create plan + week + day + session + 2 blocks (block1 + block2 with `order=10, 20`); assign 2 labels к block1 + 1 label к block2; each block has Intensity + TimeCap fields populated.
- Call: `lmsWeekApi.getByPlanAndDate(coachId, planId, startDate)`.
- Assert: `response.days[i].sessions[0].blocks.length === 2`; `blocks[0].id === block1.id`, `blocks[1].id === block2.id` (order asc); `blocks[0].labels.length === 2`; `blocks[1].labels.length === 1`; labels sorted by `BlockLabelAssignment.order` asc.

**Case D-2 (empty blocks — session без blocks)**:

- Setup: create plan + week + day + session WITHOUT any blocks.
- Call: same as D-1.
- Assert: `response.days[i].sessions[0].blocks === []` (empty array, not undefined).

**Case D-3 (cross-Session isolation — blocks not leaking)**:

- Setup: create plan + week + day + 2 sessions (session A + session B); 2 blocks под session A, 1 block под session B.
- Call: same as D-1.
- Assert: `sessionA.blocks.length === 2`; `sessionB.blocks.length === 1`; block IDs disjoint between sessions; each block's `sessionId` matches its parent.

### Phase E — Verification gates (no commit)

Run from repo root after the single atomic commit:

```bash
pnpm check-types
# Expected: 16/16 packages. Contract change widens DaySlot.sessions[].blocks: Block[] required field;
# api-server mapper provides; transitive TS propagation to apps/platform consumers (no consumer change yet — types update silently).

pnpm lint
# Expected: 16/16, 0 warnings. New imports + helper extraction prettier-stable.

pnpm test
# Expected: ≥1071/1071 (Step 7.3 baseline 1068 + ~3 api-server cases + ~1-2 contract cases = +3 to +5 new tests).
# Hard floor: 1068 + 3 = 1071 (matches D-1/D-2/D-3 only). Soft target: 1071-1073 (with contract +1-2).

pnpm --filter @repo/api-server test
# Expected: ≥586 (Step 7.3 api-server baseline 583 + 3 new cases = exact 586 if только D-1/D-2/D-3).

pnpm dep:check
# Expected: 0 violations / 1175 modules exact (no new files; module count unchanged from Step 7.3).
```

If `pnpm test` или dep:check diverge from expected ranges → STOP-and-surface (likely additional unintended file edit).

## § 4. Out of scope (DO NOT)

Hard "do not touch" list — surface via `AskUserQuestion` if any of these surface as needed:

1. **Prisma schema** (`packages/api-server/prisma/schema.prisma`) — no edits. QA-001 `@@unique([sessionId, order])` defers к **Step 7.3.6** (planner ratified split 2026-05-18).
2. **Analysis-artifacts** (`analysis/artifacts/`) — no edits. Read-shape widening doesn't change Prisma schema или domain semantics. Analysis-files-touched in IMPLEMENTATION_LOG = **none**.
3. **`apps/platform/`** — no edits. Step 7.4 UI consumer transparent via TS type propagation. **NO** PlanDetailView edit, **NO** new components, **NO** Step 7.3 hook/API edits, **NO** Step 7.2 route edits.
4. **`packages/api-routes/`** — no edits. Route handlers return wider response transparently via `getWeekResponseSchema` widened type.
5. **`packages/contracts/src/entities/lms/block/`** — Step 7.0 contracts reused as-is.
6. **`packages/contracts/src/entities/lms/session/`** — Session schema unchanged. Extension lives in `lms/day/sessionWithLabelSchema`, NOT в base sessionSchema (preserves Step 6.2 D7 embed-at-parent convention).
7. **`packages/api-server/src/endpoints/lms/block/`** — Step 7.1 CRUD unchanged.
8. **`packages/api-server/src/mappers/lms/block.mapper.ts`** — Step 7.1 mapper reused via import; not edited.
9. **New entity contracts** — no Schema entity contracts (Step 8 scope); no new shared VOs (Step 7.0 shipped Intensity + TimeCap).
10. **Test framework changes** — Vitest config unchanged; no new test helper utilities.

## § 5. Acceptance criteria (executor self-checks)

Numbered list — verify all before declaring Phase E done:

1. **Files edited exactly per § 2**: 5 EDIT (day.schema.ts + day.schema.test.ts + admin.ts + admin.test.ts + day.mapper.ts). No other files touched.
2. **0 new files created.**
3. **Contract `sessionWithLabelSchema.shape.blocks`** is `z.array(blockSchema)` (NOT `.optional()`, NOT `.nullable()`). Empty array valid.
4. **`blockSchema` imported from `"../block"` barrel** (NOT deep `"../block/block.schema"`).
5. **api-server Prisma include** nested `blocks: {orderBy: {order: "asc"}, include: {labelAssignments: {orderBy: {order: "asc"}, include: {label: true}}}}` exactly per § 0.2.
6. **`mapToSessionWithLabelAndBlocks` exported helper** exists в `day.mapper.ts` with return type `SessionWithLabel` and signature `(s: SessionWithRelations) => SessionWithLabel`.
7. **`mapToDaySlot.sessions.map(mapToSessionWithLabelAndBlocks)`** replaces previous inline spread.
8. **`DayWithRelations.sessions: SessionWithRelations[]`** Prisma type extended for nested blocks.
9. **`mapToBlockWithLabels` reused** from `./block.mapper` import (NOT re-implemented inline).
10. **`pnpm check-types`** 16/16 packages green.
11. **`pnpm lint`** 16/16 packages green, 0 warnings.
12. **`pnpm test`** ≥ 1071 (1068 baseline + ≥3 new cases). All passing.
13. **`pnpm --filter @repo/api-server test`** ≥ 586 (583 baseline + 3 new cases).
14. **`pnpm dep:check`** 0 violations / 1175 modules exact (no new files).
15. **3 new api-server test cases**: D-1 (embedded shape happy path) + D-2 (empty blocks) + D-3 (cross-Session isolation). All passing.
16. **1-2 new contract test cases** in `day.schema.test.ts`: blocks field present + empty array. All passing.
17. **No code comments** in any edited file (per CLAUDE.md + manifesto).
18. **No `as any` / `as unknown` / `!` non-null assertions** in any edited file (per `[[type-quality]]`).
19. **1 atomic commit** on `feat/training-domain` (squash per `[[husky-cross-package-squash]]`). Subject ≤80 chars, fully lowercase, no acronyms. Body lists per-layer subsections (contracts + api-server + mapper + tests).
20. **Husky pre-commit + commit-msg + pre-push clean** without `--no-verify` / `--no-edit` / `--no-gpg-sign`.
21. **Branch HEAD = `feat/training-domain`** (no `feat/<slug>` cut).
22. **Zero foreign refs** in `git log feat/training-domain ^main --oneline` post-step: 6 commits expected = Step 7.3 (3 commits: 845b276c + e02235aa + 4f84cddf) + Step 7.3 planning close (c7e95e44) + Step 7.3.5 code commit (THIS step) + post-step planner docs close.

## § 6. Anti-patterns (DO NOT)

Per CLAUDE.md + manifesto + memory rules:

- **No new files** — Step 7.3.5 is pure EDIT scope.
- **No `as any` / `as unknown` / `!` non-null assertions** — Zod-inferred types + Prisma include shape propagate cleanly without casts. Per `[[type-quality]]` zero tolerance.
- **No code comments** — self-documenting (per CLAUDE.md global preferences).
- **No deep-import** from `@repo/contracts/lms/block/block.schema` — use barrel `@repo/contracts/lms/block`.
- **No `mapToBlock` (без labels) call inside mapToDaySlot** — Step 7.3.5 needs `mapToBlockWithLabels` since session response carries `Block` with `labels: Label[]` embedded.
- **No Prisma `select` projection** — use `include` (consistency с current query shape; `select` would require manually enumerating every field; brittle vs schema evolution).
- **No `orderBy` omission** on Block or labelAssignments — sparse-integer order needs explicit `asc` для stable response.
- **No inline mapper spread** — extract `mapToSessionWithLabelAndBlocks` per OQ (b) ratification (closes Step 6.2 D-2 carry-forward).
- **No barrel `mappers/lms/index.ts` export change** for `mapToSessionWithLabelAndBlocks` — keep helper internal to `day.mapper.ts` (no downstream consumer yet).
- **No Co-Authored-By / Generated-with trailers** — per CLAUDE.md.
- **No `--no-verify` / `--no-edit` / `--no-gpg-sign`** — fix root cause if hook fails.
- **No analysis-artifact edits** — no Prisma schema change → no `06-formalization/` touch.
- **No platform/UI/route changes** — strictly contracts + api-server.

## § 7. Commit strategy (verified against husky + turbo)

**Hook config verified at prompt-write time** (per `[[husky-cross-package-squash]]`):

- `.husky/pre-commit` = `node scripts/check-secrets.mjs` + `npx lint-staged` + `SKIP_ENV_VALIDATION=1 pnpm turbo run check-types --filter="...[HEAD]"`
- `.husky/pre-push` = `pnpm dep:check` + `SKIP_ENV_VALIDATION=1 pnpm turbo run lint check-types --filter="...[origin/main]"`
- `.husky/commit-msg` = `npx --no -- commitlint --edit $1`
- `turbo.json` — `check-types.dependsOn: ["^check-types"]`; cross-package fan-out triggers.

**Cross-package squash REQUIRED** per `[[husky-cross-package-squash]]`:

- Step 7.3.5 touches both `packages/contracts/` AND `packages/api-server/`.
- If Phase A (contracts) committed first: Zod-inferred `SessionWithLabel.blocks: Block[]` becomes required field в `@repo/contracts/lms/day` exports. Downstream `@repo/api-server` Prisma mapper `mapToDaySlot` returns objects WITHOUT `blocks` field → TS2741 missing property error → `pre-commit turbo check-types --filter="...[HEAD]"` fails on api-server package.
- If Phase B+C (api-server) committed first: `mapToDaySlot.sessions[].blocks` references Prisma `blocks` relation that exists in DB (no schema change), но returns object с `blocks: Block[]` property which contract schema rejects (no field defined) → Zod parse warning (но не TS error since contract still narrow type until field added). Actually no — contract is narrow; mapper return type would error against `SessionWithLabel` type narrowing. Either way, intermediate broken tree.
- **Solution: single atomic commit covering all 5 file edits**. No phase splitting. Body lists logical layers as subsections для revertability narrative.

**Final commit**:

| #   | Subject                                                        | Files                                                                 | Notes                                           |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| 1   | `feat(training-domain): embed blocks in session week response` | 5 (day.schema + day.schema.test + admin.ts + admin.test + day.mapper) | Squash per cross-package check-types invariant. |

Subject length check: `feat(training-domain): embed blocks in session week response` = 60 chars ✓ (well under 80 soft / 100 commitlint).

Commit body convention (per Step 6.1.5 D8 + Step 6.2 D7 squash precedent):

```
- contracts/lms/day: sessionWithLabelSchema += blocks: z.array(blockSchema)
  + 1-2 schema test cases (blocks field + empty array)
- api-server/lms/week: extend prisma include with nested blocks
  (orderBy + labelAssignments include + label include)
- api-server/mappers/lms/day: extract mapToSessionWithLabelAndBlocks helper
  (closes step 6.2 D-2 carry-forward); chain mapToBlockWithLabels per session
- api-server/lms/week tests: +3 cases (embedded shape + empty + cross-session)
- closes step 7.4 read-surface gap per [[planner-read-surface-trace]]
```

Body line length ≤100 chars (commitlint footer-max-line-length); subject ≤80 chars.

## § 8. Execution mode

**`/feature small` pipeline** invoked at executor session start. Stage 0 will attempt to cut a feature branch from main; **STOP and surface** the planner override (this step lives on `feat/training-domain`).

Stage flow (per `/feature small` definition):

1. Stage 0 (branch-cut) — **override per § Execution mode header**; stay on `feat/training-domain`.
2. Stage 1 (research) — read § 0 verbatim quotes; verify zero-state; understand Block contract reuse + mapper extraction shape.
3. Stage 2 (design) — implicit; planner-locked at thesis-time.
4. Stage 3 (plan) — derive from § 3 logical phases; bundle into single squash commit.
5. Stage 4 (build) — implement all 5 file edits; verify check-types passes BEFORE staging (per phase-internal preview).
6. Stage 5 (review) — independent reviewer pass on shipped code; address findings inline or escalate per § 0.
7. Stage 6 (QA) — N/A for `/feature small` thin-wrapper read-surface scope (no new entity; no concurrency surface; existing Step 7.1 QA covers Block write surface).
8. Stage 7 (output) — write `implementation/step-07.3.5/output.md` per WORKFLOW.md § "`output.md` format".

**Branch invariants** (verify before final hand-off):

- Current branch = `feat/training-domain`. NOT `feat/<slug>`. NOT detached HEAD.
- `git log feat/training-domain ^main --oneline` shows expected commits (Step 7.3 + Step 7.3 planning + Step 7.3.5 code commit).
- Working tree clean (`git status` returns "nothing to commit, working tree clean").
- All commits husky-clean (no `--no-verify` / `--no-edit` / `--no-gpg-sign`).
- No accidental `pnpm install` side-effects committed (per Step 7.3 close-out lesson: pnpm install may write `pnpm.onlyBuiltDependencies` to package.json + `allowBuilds` к pnpm-workspace.yaml; if these surface — revert before commit).
- `package.json` `packageManager` field unchanged (10.33.2 — preserve; do NOT let local corepack/pnpm-11 bump it silently).

## § 9. Output report

After Phase E verification green, write `implementation/step-07.3.5/output.md` per WORKFLOW.md § "`output.md` format":

Sections (Russian prose where natural, English for code/paths):

- `## Что сделано` — 3-5 line summary.
- `## Изменённые/созданные файлы` — file list with LOC delta.
- `## Принятые решения` — D-1, D-2, ... numbered list of any decisions made (e.g., commit body wording, lint-staged auto-format, contract test case granularity).
- `## Возникшие вопросы и как решены` — OQ list (expected: none; if any, link to `AskUserQuestion` exchange).
- `## Что отложено` — carry-forwards (expected: 0 new; pre-existing 5 from Step 7.3 unchanged; QA-001 → Step 7.3.6).
- `` ## Ссылка на `.feature-dev/<ts>/` `` — feature-dev artifacts directory.
- `## Verification notes` — `pnpm` outputs + grep regression checks per § 5.
- `## Acceptance criteria self-check` — numbered against § 5 list (22 items).

No `## Сценарий смоук-теста` section — Step 7.3.5 has no UI surface (read-shape backend slice). Smoke remains deferred to Step 7.4 (BlockList UI surface — first scenario-based browser smoke since Step 6.7).

---

## End of prompt

Planner reads `output.md` + `.feature-dev/<ts>/` artifacts post-execution; spot-checks 5 file edits + contract+api-server shape correctness; closes step via PLANNING_STATE.md + IMPLEMENTATION_LOG.md updates + `docs(step-07.3.5): write executor output report` commit (adds both `prompt.md` + `output.md` per Step 7.0/7.1/7.2/7.3 precedent).

Next step in queue: **Step 7.3.6** — `@@unique([sessionId, order])` schema constraint on Block + analysis-artifacts sync. `db:reset` per ADR-0019. Then **Step 7.4** — UI BlockList + BlockCard + AddBlockButton + BlockLabelSelect + React Context refactor (consumes widened response shape from THIS step).
