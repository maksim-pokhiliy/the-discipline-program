# Step 7.0 — Block contract slice + Intensity/TimeCap shared VOs + BlockLabelAssignment M:N contract

**Branch**: `feat/training-domain` (HEAD `a85eff4b` post-PR-#194 close-out; ahead of `main` only by this Step 7.0 close-out work going forward).
**Type**: Contracts-only step (`packages/contracts/`). Single-package surface. First entity slice of Step 7 (Block-level operations decomposition). Zero consumers in same step — Block api-server arrives Step 7.1, routes 7.2, hooks 7.3, UI 7.4+.
**Scope**: ship `lms/block` contract slice (Block entity + 5 operations: create / update / delete / reorder / assignLabels) + cross-entity VOs `intensitySchema` + `timeCapSchema` in `lms/_shared` (Schema entity Step 8 also uses Intensity; pre-extracting now per shared-from-day-one rationale).
**Execution mode**: **`/feature small` pipeline** per `[[always-via-feature-skill]]` (contract-only slice, ≤12 files, no schema/api-server/UI change, single package). **Branch-cut override mandatory**: this step lives on long-lived `feat/training-domain` per `[[training-domain-workflow]]`. If `/feature small` Stage 0 attempts `git checkout -b feat/<slug>` from main, STOP and surface via `AskUserQuestion`, then continue on current branch (do NOT create a new feature branch).

---

## § 0. Hard triggers — read-then-act gate

Before any code, verify EVERY verbatim quote in § 0.1-0.8 against the actual HEAD `a85eff4b` byte-for-byte. If any quote diverges, STOP, run `AskUserQuestion` showing the actual content + this prompt's claim, wait for planner ratification. Do NOT silently adapt.

Zero-state re-verification at executor launch:

```bash
ls packages/contracts/src/entities/lms/block/ 2>/dev/null
# Expected: directory does NOT exist. If exists, STOP and surface — Step 7.0 was partially done earlier.

grep -rln "blockSchema\|intensitySchema\|timeCapSchema\|BLOCK_CONSTANTS" packages/contracts/src/
# Expected: 0 hits. If non-zero, STOP and surface.

grep -rln "@repo/contracts/lms/block" packages/ apps/
# Expected: 0 hits. If non-zero, STOP and surface — consumer present pre-contract.
```

### § 0.1 Canonical Session contract slice (mirror target — `packages/contracts/src/entities/lms/session/`)

8 files (`ls` output verified):

```
index.ts
session-api.schema.test.ts
session-api.schema.ts
session-api.types.ts
session.constants.ts
session.schema.test.ts
session.schema.ts
session.types.ts
```

Block slice mirrors this 1:1 (8 files in `lms/block/`).

#### `session/session.schema.ts` (full — Phase 2 entity schema pattern)

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
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});
```

#### `session/session.constants.ts` (full)

```ts
export const SESSION_CONSTANTS = {
  MAX_NOTES_LENGTH: 2000,
} as const;
```

#### `session/session.types.ts` (full)

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

#### `session/session-api.schema.ts` (full — Phase 3 API params + request/response pattern)

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

#### `session/session-api.types.ts` (full)

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

#### `session/index.ts` (full barrel)

```ts
export * from "./session.constants";
export * from "./session.schema";
export * from "./session.types";
export * from "./session-api.schema";
export * from "./session-api.types";
```

#### `session/session.schema.test.ts` (relevant test groups — full quoted; mirror in `block.schema.test.ts`)

Test cases follow `describe("<schemaName>", () => { it("accepts/rejects ...", ...) })` pattern:

```ts
describe("sessionSchema", () => {
  it("accepts a fully-populated valid object", ...);
  it("accepts labelId: null and notes: null", ...);
  it("rejects order: 0 and order: -1", ...);
  it("rejects order: 1.5 (non-integer)", ...);
  it("rejects a non-cuid id", ...);
  it("does not expose freezeLoadsAtCreation (Q10 guardrail)", ...);
  it("does not expose name (Session.name guardrail)", ...);
});

describe("createSessionSchema", () => {
  it("accepts an empty object (empty slot creation)", ...);
  it("accepts { labelId } alone", ...);
  it("accepts { notes } alone", ...);
  it("accepts { labelId: null, notes: null } (explicit clear)", ...);
  it("accepts notes at MAX_NOTES_LENGTH", ...);
  it("rejects notes longer than MAX_NOTES_LENGTH", ...);
  it("rejects a non-cuid labelId", ...);
  it("does not expose freezeLoadsAtCreation (Q10 guardrail)", ...);
  it("does not expose name (Session.name guardrail)", ...);
});

describe("updateSessionSchema", () => {
  it("is an alias of createSessionSchema (identity)", ...);
  // ... etc, mirror createSessionSchema cases
});

describe("reorderSessionsSchema", () => {
  it("accepts an array of three cuids", ...);
  it("rejects an empty array (min(1))", ...);
  it("rejects an array containing a non-cuid string", ...);
  it("rejects duplicate cuids", ...);
});
```

Full file at `packages/contracts/src/entities/lms/session/session.schema.test.ts:1-249`. Read at executor-launch time to verify exact `it` count + literal cases.

#### `session/session-api.schema.test.ts` (relevant test groups)

```ts
describe("sessionByDayParamsSchema", () => {
  it("accepts a fully-populated valid object", ...);
  it("rejects a lowercase dayOfWeek", ...);
  it("rejects a null dayOfWeek", ...);
  it("rejects a startDate without leading zeros", ...);
  it("rejects a non-cuid planId", ...);
});

describe("sessionByIdParamsSchema", () => {
  it("accepts two cuids", ...);
  it("rejects a non-cuid sessionId", ...);
  it("rejects a missing sessionId", ...);
});

describe("request/response wrapper aliases", () => {
  it("createSessionRequestSchema is createSessionSchema", ...);
  it("createSessionResponseSchema is sessionSchema", ...);
  // ... etc, alias identity checks
});

describe("reorderSessionsResponseSchema", () => {
  it("accepts a wrapper { sessions: [] }", ...);
  it("rejects a bare array", ...);
});
```

Full file at `packages/contracts/src/entities/lms/session/session-api.schema.test.ts:1-133`. Read at executor-launch time.

### § 0.2 LMS barrel + `_shared` current state (Phase 4 registration targets)

#### `packages/contracts/src/entities/lms/index.ts` (current — 8 entries)

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

**Final state** (alphabetic insert of `./block` between `./_shared` and `./day`):

```ts
export * from "./_shared";
export * from "./block";
export * from "./day";
export * from "./exercise";
export * from "./label";
export * from "./plan-enrollment";
export * from "./session";
export * from "./training-plan";
export * from "./week";
```

#### `packages/contracts/src/entities/lms/_shared/` current state

```
day-of-week.test.ts
day-of-week.ts
index.ts
```

Index barrel:

```ts
export * from "./day-of-week";
```

**Phase 1 additions**:

```
day-of-week.test.ts        (unchanged)
day-of-week.ts             (unchanged)
index.ts                   (3 → final state below)
intensity.test.ts          (NEW)
intensity.ts               (NEW)
time-cap.test.ts           (NEW)
time-cap.ts                (NEW)
```

**Final `_shared/index.ts`** (alphabetic):

```ts
export * from "./day-of-week";
export * from "./intensity";
export * from "./time-cap";
```

### § 0.3 `packages/contracts/package.json` exports map (Phase 4 target)

Current LMS subpath entries (relevant block — 8 entries):

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

**Final state** (insert `./lms/block` alphabetically between `./lms/_shared` and `./lms/day`):

```json
"./lms": "./src/entities/lms/index.ts",
"./lms/_shared": "./src/entities/lms/_shared/index.ts",
"./lms/block": "./src/entities/lms/block/index.ts",
"./lms/day": "./src/entities/lms/day/index.ts",
"./lms/exercise": "./src/entities/lms/exercise/index.ts",
... (rest unchanged)
```

### § 0.4 `packages/contracts/README.md` (Phase 4 target — minor edit)

LMS taxonomy bullet (current):

```
- `lms/<entity>` — LMS context: `plan-enrollment`, `session`, `training-plan`, `week`. Shared primitives (e.g. `dayOfWeekSchema`) live under `lms/_shared`.
```

**Final**:

```
- `lms/<entity>` — LMS context: `block`, `plan-enrollment`, `session`, `training-plan`, `week`. Shared primitives (e.g. `dayOfWeekSchema`, `intensitySchema`, `timeCapSchema`) live under `lms/_shared`.
```

(Note: `day`, `exercise`, `label` are missing from this README list currently — pre-existing inconsistency from Step 6.1.5 D8 namespace move; do NOT fix in Step 7.0, scope is Block-additive only. Flag as deferred housekeeping in `output.md`.)

### § 0.5 Domain citations (per `[[coach-pov-first]]`)

#### `analysis/artifacts/05-synthesis/domain-model.md §1.3 Block` (lines 124-150, verbatim)

```
**Purpose**: раздел сессии — группа schemas объединённых тренерским labelом и/или intent (strength-endurance / pump / core / warm-up).

**Attributes**:
- `id`.
- `order` — позиция внутри Session.
- `labels` — ordered array of LabelRef, 0..N (set semantics: dedup по identity, presentation-order).
- `intensity` — optional Intensity VO (block-level scope, inherits to schemas).
- `notes` — optional free-text.
- `time_cap` — optional TimeCap VO (для `PRACTICE [ 5-10 min ]`-style block-level time hint; см. edge-cases). **Эскалация Phase 4** — финализация Phase 6.
- `schemas` — ordered children, 0..N.

**Invariants**:
- `labels.length === 0` → implicit block (sample: 75 occurrences, 24 unique).
- `labels.length > 1` → multi-label (sample: 13 instances).
- `schemas.length === 0` → empty-body block (sample: 6 occurrences).
- Labels — set по identity (no duplicates), list по presentation.
- Intensity при schemas-inheritance: partial overlay (см. §2.3).

**Sample evidence**:
- 17 distinct labels (canonical, после case-insensitive dedup).
- 1 instance с block-level intensity (block-055).
```

Coach mental model:

- **0..N labels per Block** (M:N) with presentation order; deduplicated by identity. Step 7.0 contract surface = `labels: Label[]` embedded in blockSchema response + `assignBlockLabelsSchema = { labelIds: cuid[] }` request (full-set replace per OQ-2A).
- **Optional Intensity** — 5 additive optional sub-fields (see § 0.6); `null` valid; `{}` (empty object with no sub-fields) NOT valid — refine at-least-one-key per OQ-1 hypothesis A1 below.
- **Optional TimeCap** — `{min, max?, unit}`; nullable.
- **Optional notes** — free-text, cap 2000 (mirror Session/Day).
- **Empty schemas[] valid** — Step 7.0 ships Block with empty body always (Schema slice = Step 8).

#### `analysis/artifacts/06-formalization/types.ts:57-79` (Intensity + TimeCap source-of-truth)

```ts
// Lines 57-71
export type PaceValue = "easy" | "moderate" | "hard" | "recovery";
export type EffortPercent = { value: number } | { range: { min: number; max: number } };
export type HrZone = "Z1" | "Z2" | "Z3" | "Z4" | "Z5";
export type NumericPaceDistanceUnit = "km" | "mi" | "m" | "yd" | "lap";
export type NumericPaceType = "min_per_distance" | "distance_per_min";

export interface NumericPace {
  value: string;
  distanceUnit: NumericPaceDistanceUnit;
  paceType: NumericPaceType;
}

// Lines 73-79
export interface Intensity {
  effortPercent?: EffortPercent;
  rpe?: { value: number };
  pace?: PaceValue;
  hrZone?: { zone: HrZone };
  numericPace?: NumericPace;
}

// Lines 253-257
export interface TimeCap {
  min: number;
  max?: number;
  unit: "min" | "sec";
}
```

### § 0.6 Real Prisma `Block` + `BlockLabelAssignment` (`packages/api-server/prisma/schema.prisma:653-684`)

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

model BlockLabelAssignment {
  id      String @id @default(cuid())
  blockId String
  labelId String
  order   Int

  block Block @relation(fields: [blockId], references: [id], onDelete: Cascade)
  label Label @relation(fields: [labelId], references: [id], onDelete: Restrict)

  @@unique([blockId, labelId])
  @@index([blockId, order])
  @@index([labelId])
  @@map("training_block_label_assignments")
}
```

Persistence:

- `intensity Json?` ← serialized `Intensity | null` per § 0.6 types.
- `timeCap Json?` ← serialized `TimeCap | null`.
- `BlockLabelAssignment` is M:N junction with `@@unique([blockId, labelId])` (no duplicate labels per block) + `order Int` (presentation-order, sparse-int 10/20/30 per Phase 4 Q6 sparse-int rule).
- Cascade: Session→Block→BlockLabelAssignment all `onDelete: Cascade`. Label→BlockLabelAssignment is `onDelete: Restrict` (matches Day.labelId Restrict).

### § 0.7 Resolved planner decisions for Step 7.0

| OQ                                  | Resolution                                                                                                                                                                                                                                                     | Rationale                                                                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1A** (Intensity empty object)     | At contract level, `intensitySchema.refine((v) => Object.keys(v).length > 0, "intensity must set at least one dimension")`. Empty `{}` rejected; `null` valid at parent (blockSchema.intensity is nullable). UI must send `null` when clearing all sub-fields. | Empty Intensity object is meaningless (pollution). Refine enforces "at least one dimension or null". Server normalizes empty→null is alternative; planner picks refine for explicit error. |
| **2A** (M:N labels via replace-all) | `assignBlockLabelsRequestSchema = { labelIds: cuid[].max(MAX_LABELS_PER_BLOCK).unique }`; server tx delete-all + bulk-create with sequential order 10/20/30. Empty array valid (= clear all labels).                                                           | Mirrors Step 6.1 reorder pattern (complete-set check + server-recompute). Coach POV: "set the labels for this block" = full set replace. 2-tab LWW acceptable.                             |
| **3** (BlockLabelMulti widget)      | Deferred to Step 7.4 thesis (UI concern, not 7.0 contract).                                                                                                                                                                                                    | Step 7.0 ships data shape only.                                                                                                                                                            |
| **MAX_LABELS_PER_BLOCK**            | `10` (Block.constants).                                                                                                                                                                                                                                        | Sample evidence: 4-5 labels max per block. 10 = safety cap with comfortable headroom.                                                                                                      |
| **MAX_NOTES_LENGTH**                | `2000` (mirror Session/Day).                                                                                                                                                                                                                                   | Consistency across LMS notes fields.                                                                                                                                                       |
| **Intensity / TimeCap location**    | `lms/_shared/intensity.ts` + `lms/_shared/time-cap.ts` (cross-entity primitives).                                                                                                                                                                              | Schema entity (Step 8) also uses `intensity` field per Prisma `schema.prisma:695`. Pre-extract to \_shared per dayOfWeek precedent — avoids Step 8 having to move them.                    |

### § 0.8 STOP-and-surface protocol

If during any Phase you find:

- Verbatim quote in § 0.1-0.6 diverges from HEAD `a85eff4b` byte-for-byte.
- `packages/contracts/src/entities/lms/block/` already exists (Step 7.0 partial).
- Any `intensitySchema` / `timeCapSchema` / `BLOCK_CONSTANTS` symbol already exported in contracts (zero-state grep gives non-zero hits).
- Block Prisma model surface diverges from § 0.6 (e.g. new field appeared since `a85eff4b`).
- `intensitySchema.refine` chosen approach fails Zod typing — surface alternative hypothesis (e.g. preprocess + transform).
- A prior-attempt trace per WORKFLOW.md § Forbidden (vocab: `coach always edit mode`, `plan-editor rollback`, `SETS_REPS as 9th archetype`).

STOP. Run `AskUserQuestion` showing the divergence + hypothesis. Wait for planner ratification.

---

## § 1. Goal

Ship `lms/block` contract slice — Block entity schema (id, sessionId, order, intensity?, timeCap?, notes?, labels[], timestamps) + 5 operations contracts (`createBlockSchema`, `updateBlockSchema`, `reorderBlocksSchema`, `assignBlockLabelsSchema` + 4 wrapper request/response shapes) — plus cross-entity VOs `intensitySchema` + `timeCapSchema` in `lms/_shared` (pre-extracted for Schema entity Step 8 reuse). Mirror Step 6.0 Session slice 1:1 on file layout; mirror domain `§1.3` invariants on Zod shape; mirror Step 6.0 + 6.2 regression-guard discipline on `it("does not expose ...")` test pattern.

Zero consumers in same step — Block api-server arrives Step 7.1.

---

## § 2. Context — decision lineage

- **D1 (2026-05-12)** — Block has `id, order, intensity?, timeCap?, notes?` plus relations to Session (parent), BlockLabelAssignment (M:N labels), Schema (children).
- **Step 6.0** (2026-05-15) — Session contract slice + `lms/_shared/day-of-week.ts` precedent; canonical mirror target.
- **Step 6.2** (2026-05-16) — embedded relations pattern (`Session.label: Label | null` in 7-day GET) — Block follows: embedded `labels: Label[]` in blockSchema response.
- **Step 7 decomposition thesis** (2026-05-17) — Step 7.0 = first sub-step, contracts-only, `/feature small`.
- **OQ resolutions** (§ 0.7): 1A refine min-1-key intensity, 2A replace-all M:N labels, 3 deferred to 7.4, plus const decisions (MAX_LABELS_PER_BLOCK=10, MAX_NOTES_LENGTH=2000, Intensity/TimeCap in \_shared).

Out of scope (later sub-steps + future surfaces):

- Block api-server (`lmsBlockApi`) — **Step 7.1**.
- Block HTTP routes — **Step 7.2**.
- Block client API + hooks — **Step 7.3**.
- Block UI (BlockList, BlockCard, BlockLabelMulti, AddBlockButton) — **Step 7.4**.
- Intensity/TimeCap UI editors — **Step 7.5**.
- Schema entity contracts — **Step 8.0** (Schema entity also uses `intensitySchema` from `_shared`; Step 7.0 ships it for Step 8.0 reuse).
- SchemaRow contracts — **Step 9**.

---

## § 3. Implementation phases

4 phases in dependency order. Each phase additive; per-package check-types stays green throughout.

### Phase 1 — `_shared` VOs (intensity + timeCap)

#### `packages/contracts/src/entities/lms/_shared/intensity.ts` (NEW, ~50 LOC)

```ts
import { z } from "zod";

const HR_ZONES = ["Z1", "Z2", "Z3", "Z4", "Z5"] as const;
const NUMERIC_PACE_DISTANCE_UNITS = ["km", "mi", "m", "yd", "lap"] as const;
const NUMERIC_PACE_TYPES = ["min_per_distance", "distance_per_min"] as const;
const PACE_VALUES = ["easy", "moderate", "hard", "recovery"] as const;

export const effortPercentSchema = z.union([
  z.object({ value: z.number().positive().max(100) }),
  z.object({
    range: z
      .object({
        min: z.number().positive().max(100),
        max: z.number().positive().max(100),
      })
      .refine((r) => r.min < r.max, { message: "range.min must be < range.max" }),
  }),
]);

export const hrZoneSchema = z.object({
  zone: z.enum(HR_ZONES),
});

export const numericPaceSchema = z.object({
  value: z.string().min(1),
  distanceUnit: z.enum(NUMERIC_PACE_DISTANCE_UNITS),
  paceType: z.enum(NUMERIC_PACE_TYPES),
});

export const intensitySchema = z
  .object({
    effortPercent: effortPercentSchema.optional(),
    rpe: z.object({ value: z.number().positive().max(10) }).optional(),
    pace: z.enum(PACE_VALUES).optional(),
    hrZone: hrZoneSchema.optional(),
    numericPace: numericPaceSchema.optional(),
  })
  .refine(
    (v) =>
      v.effortPercent !== undefined ||
      v.rpe !== undefined ||
      v.pace !== undefined ||
      v.hrZone !== undefined ||
      v.numericPace !== undefined,
    { message: "intensity must set at least one dimension" },
  );

export type Intensity = z.infer<typeof intensitySchema>;
export type EffortPercent = z.infer<typeof effortPercentSchema>;
export type HrZoneIntensity = z.infer<typeof hrZoneSchema>;
export type NumericPaceIntensity = z.infer<typeof numericPaceSchema>;
```

**Note on bounds**: domain `§ 0.6 types.ts` has no explicit numeric bounds; planner adds `positive().max(100)` for `effortPercent` (% scale) and `positive().max(10)` for `rpe` (RPE scale) as engineering defaults. If executor finds analysis specifies different bounds, surface via `AskUserQuestion` (do NOT silently relax).

#### `packages/contracts/src/entities/lms/_shared/intensity.test.ts` (NEW)

Test cases per `[[planner-adversarial-review]]` axes:

```ts
describe("intensitySchema", () => {
  it("accepts effortPercent.value alone", ...);
  it("accepts effortPercent.range alone (min < max)", ...);
  it("rejects effortPercent.range when min >= max", ...);
  it("accepts rpe alone", ...);
  it("accepts pace alone (any of 4 enum values)", ...);
  it("accepts hrZone alone (any of Z1-Z5)", ...);
  it("accepts numericPace alone", ...);
  it("accepts multiple dimensions together (effort + pace)", ...);
  it("rejects empty object {} (refine at-least-one)", ...);
  it("rejects unknown dimension key (strict additivity)", ...);
  it("rejects effortPercent.value > 100", ...);
  it("rejects rpe.value > 10", ...);
  it("rejects hrZone.zone not in Z1-Z5", ...);
  it("rejects numericPace with empty value string", ...);
  it("rejects lowercase HrZone (z1)", ...);
});
```

(Mirror exact `it` count + literal text from `session.schema.test.ts` style.)

#### `packages/contracts/src/entities/lms/_shared/time-cap.ts` (NEW, ~15 LOC)

```ts
import { z } from "zod";

export const timeCapSchema = z
  .object({
    min: z.number().positive(),
    max: z.number().positive().optional(),
    unit: z.enum(["min", "sec"]),
  })
  .refine((v) => v.max === undefined || v.min < v.max, {
    message: "timeCap.max must be > min when set",
  });

export type TimeCap = z.infer<typeof timeCapSchema>;
```

#### `packages/contracts/src/entities/lms/_shared/time-cap.test.ts` (NEW)

```ts
describe("timeCapSchema", () => {
  it("accepts { min: 5, unit: 'min' } (no max)", ...);
  it("accepts { min: 5, max: 10, unit: 'min' }", ...);
  it("accepts { min: 30, max: 60, unit: 'sec' }", ...);
  it("rejects min: 0", ...);
  it("rejects min: -1", ...);
  it("rejects max <= min", ...);
  it("rejects unit not in {min, sec}", ...);
  it("rejects missing min", ...);
  it("rejects missing unit", ...);
});
```

#### `packages/contracts/src/entities/lms/_shared/index.ts` (MODIFY)

Add 2 exports alphabetic:

```ts
export * from "./day-of-week";
export * from "./intensity";
export * from "./time-cap";
```

### Phase 2 — `lms/block/` entity slice

#### `packages/contracts/src/entities/lms/block/block.constants.ts` (NEW, ~5 LOC)

```ts
export const BLOCK_CONSTANTS = {
  MAX_NOTES_LENGTH: 2000,
  MAX_LABELS_PER_BLOCK: 10,
} as const;
```

#### `packages/contracts/src/entities/lms/block/block.schema.ts` (NEW, ~50 LOC)

```ts
import { z } from "zod";

import { intensitySchema, timeCapSchema } from "../_shared";
import { labelSchema } from "../label";

import { BLOCK_CONSTANTS } from "./block.constants";

export const blockSchema = z.object({
  id: z.string().cuid(),
  sessionId: z.string().cuid(),
  order: z.number().int().positive(),
  intensity: intensitySchema.nullable(),
  timeCap: timeCapSchema.nullable(),
  notes: z.string().nullable(),
  labels: z.array(labelSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createBlockSchema = z.object({
  intensity: intensitySchema.nullable().optional(),
  timeCap: timeCapSchema.nullable().optional(),
  notes: z.string().max(BLOCK_CONSTANTS.MAX_NOTES_LENGTH).nullable().optional(),
  labelIds: z
    .array(z.string().cuid())
    .max(BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "labelIds must be unique",
    })
    .optional(),
});

export const updateBlockSchema = createBlockSchema;

export const reorderBlocksSchema = z.object({
  orderedIds: z
    .array(z.string().cuid())
    .min(1)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "orderedIds must be unique",
    }),
});

export const assignBlockLabelsSchema = z.object({
  labelIds: z
    .array(z.string().cuid())
    .max(BLOCK_CONSTANTS.MAX_LABELS_PER_BLOCK)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "labelIds must be unique",
    }),
});
```

**Notes**:

- `blockSchema.labels: z.array(labelSchema)` — embedded labels in response (mirrors Step 6.2 D7 embed pattern for Day/Session label).
- `createBlockSchema.labelIds.optional()` — empty array OR omitted both valid (Block with 0 labels per domain `§1.3` "labels.length === 0 → implicit block").
- `assignBlockLabelsSchema.labelIds.max(MAX_LABELS_PER_BLOCK)` — no `.min(1)` (empty array = clear all labels). Differs from `reorderBlocksSchema` which requires min 1.
- `updateBlockSchema = createBlockSchema` — identity alias (mirror Session pattern).

#### `packages/contracts/src/entities/lms/block/block.types.ts` (NEW)

```ts
import { type z } from "zod";

import {
  type assignBlockLabelsSchema,
  type blockSchema,
  type createBlockSchema,
  type reorderBlocksSchema,
  type updateBlockSchema,
} from "./block.schema";

export type Block = z.infer<typeof blockSchema>;
export type CreateBlockData = z.infer<typeof createBlockSchema>;
export type UpdateBlockData = z.infer<typeof updateBlockSchema>;
export type ReorderBlocksData = z.infer<typeof reorderBlocksSchema>;
export type AssignBlockLabelsData = z.infer<typeof assignBlockLabelsSchema>;
```

#### `packages/contracts/src/entities/lms/block/block.schema.test.ts` (NEW)

Test groups per `[[planner-adversarial-review]]`:

```ts
describe("blockSchema", () => {
  it("accepts a fully-populated valid object (with intensity + timeCap + labels)", ...);
  it("accepts intensity: null, timeCap: null, notes: null", ...);
  it("accepts labels: [] (implicit block per domain §1.3)", ...);
  it("accepts labels with multiple entries", ...);
  it("rejects order: 0 and order: -1", ...);
  it("rejects order: 1.5 (non-integer)", ...);
  it("rejects a non-cuid id", ...);
  it("rejects a non-cuid sessionId", ...);
  it("does not expose schemas (Step 8 surface; regression guard)", ...);
  it("does not expose name (Block.name guardrail, parallel to Session.name Q10)", ...);
});

describe("createBlockSchema", () => {
  it("accepts an empty object (instant-create block)", ...);
  it("accepts intensity-only payload", ...);
  it("accepts timeCap-only payload", ...);
  it("accepts notes-only payload", ...);
  it("accepts labelIds-only payload", ...);
  it("accepts labelIds: [] (empty)", ...);
  it("accepts notes at MAX_NOTES_LENGTH", ...);
  it("rejects notes longer than MAX_NOTES_LENGTH", ...);
  it("rejects labelIds longer than MAX_LABELS_PER_BLOCK", ...);
  it("rejects duplicate labelIds", ...);
  it("rejects a non-cuid in labelIds", ...);
  it("rejects intensity: {} (refine at-least-one via _shared)", ...);
});

describe("updateBlockSchema", () => {
  it("is an alias of createBlockSchema (identity)", ...);
  it("accepts an empty object", ...);
  // ... mirror createBlockSchema cases
});

describe("reorderBlocksSchema", () => {
  it("accepts an array of three cuids", ...);
  it("rejects an empty array (min(1))", ...);
  it("rejects duplicate cuids", ...);
  it("rejects a non-cuid string", ...);
});

describe("assignBlockLabelsSchema", () => {
  it("accepts labelIds: [] (clear all labels)", ...);
  it("accepts up to MAX_LABELS_PER_BLOCK", ...);
  it("rejects more than MAX_LABELS_PER_BLOCK", ...);
  it("rejects duplicate labelIds", ...);
  it("rejects a non-cuid string", ...);
});
```

### Phase 3 — `lms/block/` api-schema slice

#### `packages/contracts/src/entities/lms/block/block-api.schema.ts` (NEW)

```ts
import { z } from "zod";

import {
  assignBlockLabelsSchema,
  blockSchema,
  createBlockSchema,
  reorderBlocksSchema,
  updateBlockSchema,
} from "./block.schema";

export const blockBySessionParamsSchema = z.object({
  planId: z.string().cuid(),
  sessionId: z.string().cuid(),
});

export const blockByIdParamsSchema = z.object({
  planId: z.string().cuid(),
  blockId: z.string().cuid(),
});

export const createBlockRequestSchema = createBlockSchema;
export const createBlockResponseSchema = blockSchema;

export const updateBlockRequestSchema = updateBlockSchema;
export const updateBlockResponseSchema = blockSchema;

export const reorderBlocksRequestSchema = reorderBlocksSchema;
export const reorderBlocksResponseSchema = z.object({
  blocks: z.array(blockSchema),
});

export const assignBlockLabelsRequestSchema = assignBlockLabelsSchema;
export const assignBlockLabelsResponseSchema = blockSchema;
```

Note: Block addressing uses `sessionId` directly (NOT `startDate + dayOfWeek + sessionId`) per OQ-2A — sessionId is global identifier; no need to thread the day-scope ID chain through Block URLs. Step 6.0 session-byId pattern (just `{planId, sessionId}`) precedent.

#### `packages/contracts/src/entities/lms/block/block-api.types.ts` (NEW)

```ts
import { type z } from "zod";

import {
  type assignBlockLabelsRequestSchema,
  type assignBlockLabelsResponseSchema,
  type blockByIdParamsSchema,
  type blockBySessionParamsSchema,
  type createBlockRequestSchema,
  type createBlockResponseSchema,
  type reorderBlocksRequestSchema,
  type reorderBlocksResponseSchema,
  type updateBlockRequestSchema,
  type updateBlockResponseSchema,
} from "./block-api.schema";

export type BlockBySessionParams = z.infer<typeof blockBySessionParamsSchema>;
export type BlockByIdParams = z.infer<typeof blockByIdParamsSchema>;
export type CreateBlockRequest = z.infer<typeof createBlockRequestSchema>;
export type CreateBlockResponse = z.infer<typeof createBlockResponseSchema>;
export type UpdateBlockRequest = z.infer<typeof updateBlockRequestSchema>;
export type UpdateBlockResponse = z.infer<typeof updateBlockResponseSchema>;
export type ReorderBlocksRequest = z.infer<typeof reorderBlocksRequestSchema>;
export type ReorderBlocksResponse = z.infer<typeof reorderBlocksResponseSchema>;
export type AssignBlockLabelsRequest = z.infer<typeof assignBlockLabelsRequestSchema>;
export type AssignBlockLabelsResponse = z.infer<typeof assignBlockLabelsResponseSchema>;
```

#### `packages/contracts/src/entities/lms/block/block-api.schema.test.ts` (NEW)

```ts
describe("blockBySessionParamsSchema", () => {
  it("accepts two cuids", ...);
  it("rejects a non-cuid planId", ...);
  it("rejects a non-cuid sessionId", ...);
  it("rejects missing sessionId", ...);
});

describe("blockByIdParamsSchema", () => {
  it("accepts two cuids", ...);
  it("rejects a non-cuid blockId", ...);
  it("rejects missing blockId", ...);
});

describe("request/response wrapper aliases", () => {
  it("createBlockRequestSchema is createBlockSchema", ...);
  it("createBlockResponseSchema is blockSchema", ...);
  it("updateBlockRequestSchema is updateBlockSchema", ...);
  it("updateBlockResponseSchema is blockSchema", ...);
  it("reorderBlocksRequestSchema is reorderBlocksSchema", ...);
  it("assignBlockLabelsRequestSchema is assignBlockLabelsSchema", ...);
  it("assignBlockLabelsResponseSchema is blockSchema", ...);
});

describe("reorderBlocksResponseSchema", () => {
  it("accepts a wrapper { blocks: [] }", ...);
  it("rejects a bare array", ...);
});
```

### Phase 4 — Barrel + LMS index + package.json exports + README

#### `packages/contracts/src/entities/lms/block/index.ts` (NEW)

```ts
export * from "./block.constants";
export * from "./block.schema";
export * from "./block.types";
export * from "./block-api.schema";
export * from "./block-api.types";
```

#### `packages/contracts/src/entities/lms/index.ts` (MODIFY)

Insert `export * from "./block";` alphabetic between `./_shared` and `./day` per § 0.2 final state.

#### `packages/contracts/package.json` (MODIFY exports map)

Insert `"./lms/block": "./src/entities/lms/block/index.ts"` alphabetic between `./lms/_shared` and `./lms/day` per § 0.3 final state. **JSON syntactic care**: each entry comma-terminated except last; verify trailing-comma rules per existing format.

#### `packages/contracts/README.md` (MODIFY — single bullet)

Edit `lms/<entity>` bullet per § 0.4 final state. Append `block` to entity list; append `intensitySchema`, `timeCapSchema` to shared primitives parenthetical.

---

## § 4. Out of scope (do NOT do)

- ❌ Block api-server (`lmsBlockApi`) — Step 7.1.
- ❌ Platform HTTP routes for Block — Step 7.2.
- ❌ Platform client API + hooks — Step 7.3.
- ❌ UI components — Step 7.4 + 7.5.
- ❌ Schema entity contracts — Step 8.0 (will consume `intensitySchema` from `_shared`).
- ❌ Prisma schema changes (Block + BlockLabelAssignment already shipped Step 2).
- ❌ Add a `BlockNotes` / `notes` field beyond what domain `§1.3` declares.
- ❌ Add discriminator field to `intensitySchema` (domain is additive optional fields, not discriminated union).
- ❌ Fix pre-existing README inconsistency about `day` / `exercise` / `label` missing from LMS bullet — flag as deferred, do NOT touch (out of Block-additive scope).
- ❌ Cross-package edits (`@repo/api-server`, `apps/*`).
- ❌ Tests for `_shared/day-of-week.ts` (already shipped, not Step 7.0 scope).
- ❌ Add code comments (per `[[global-preferences]]`; identifiers self-document).
- ❌ Memoize / optimize anything.
- ❌ Search git history or memory for prior-implementation traces per WORKFLOW.md § Forbidden.

---

## § 5. Acceptance criteria

### § 5.1 Verification commands (run from repo root)

```bash
pnpm --filter @repo/contracts check-types
pnpm --filter @repo/contracts lint
pnpm --filter @repo/contracts test

# Root-level sweeps
pnpm check-types        # expect 16/16
pnpm lint               # expect 16/16
pnpm test               # expect 958 + new (estimate +35 to +45 tests for Phase 1 + 2 + 3; final 993-1003 range)
pnpm dep:check          # expect 0 violations / [1153 + ~10] modules
```

### § 5.2 Grep regressions

```bash
# Block contract presence
grep -rn "blockSchema\|BLOCK_CONSTANTS\|assignBlockLabelsSchema" packages/contracts/src/
# Expected: ≥ 10 hits (defs + barrel + tests)

# Cross-entity VOs in _shared
grep -rn "intensitySchema\|timeCapSchema" packages/contracts/src/
# Expected: ≥ 6 hits (_shared defs + block-schema usage + tests)

# Zero consumers (Step 7.0 invariant)
grep -rn "@repo/contracts/lms/block" packages/ apps/ | grep -v "packages/contracts/src/entities/lms/block/"
# Expected: 0 hits

# Regression guards
grep -rn "block.schemas\|block\.schemas\b" packages/contracts/src/entities/lms/block/
# Expected: 0 hits (no `schemas` field exposed; Step 8 surface)

grep -rn "block.name\|block\.name\b" packages/contracts/src/entities/lms/block/
# Expected: 0 hits (Block.name guardrail)

# File count
ls packages/contracts/src/entities/lms/block/*.ts | wc -l
# Expected: 8 (block.constants, block.schema, block.types, block.schema.test, block-api.schema, block-api.types, block-api.schema.test, index)

ls packages/contracts/src/entities/lms/_shared/*.ts | wc -l
# Expected: 7 (was 3: day-of-week + day-of-week.test + index; added 4: intensity + intensity.test + time-cap + time-cap.test)

# Barrel + exports
grep -c "export \* from" packages/contracts/src/entities/lms/index.ts
# Expected: 9 (was 8)

grep -c '"./lms/' packages/contracts/package.json
# Expected: 10 (was 9; +./lms/block)
```

### § 5.3 What "done" means

All four hold:

1. § 5.1 commands all green.
2. § 5.2 grep counts match.
3. Husky pre-commit + commit-msg clean each commit без `--no-verify`.
4. `output.md` written per § 8.

### § 5.4 No browser smoke-test (N/A)

Contract-only step, no user-visible surface, no api-server / platform / UI code. Smoke-test resumes Step 7.4.

---

## § 6. File-by-file inventory (final state)

| Path                                                                 | Change               | LOC (rough)      |
| -------------------------------------------------------------------- | -------------------- | ---------------- |
| `packages/contracts/src/entities/lms/_shared/intensity.ts`           | NEW                  | +50              |
| `packages/contracts/src/entities/lms/_shared/intensity.test.ts`      | NEW                  | +100 (~15 cases) |
| `packages/contracts/src/entities/lms/_shared/time-cap.ts`            | NEW                  | +15              |
| `packages/contracts/src/entities/lms/_shared/time-cap.test.ts`       | NEW                  | +60 (~9 cases)   |
| `packages/contracts/src/entities/lms/_shared/index.ts`               | MODIFY               | +2               |
| `packages/contracts/src/entities/lms/block/block.constants.ts`       | NEW                  | +5               |
| `packages/contracts/src/entities/lms/block/block.schema.ts`          | NEW                  | +50              |
| `packages/contracts/src/entities/lms/block/block.types.ts`           | NEW                  | +15              |
| `packages/contracts/src/entities/lms/block/block.schema.test.ts`     | NEW                  | +200 (~28 cases) |
| `packages/contracts/src/entities/lms/block/block-api.schema.ts`      | NEW                  | +30              |
| `packages/contracts/src/entities/lms/block/block-api.types.ts`       | NEW                  | +25              |
| `packages/contracts/src/entities/lms/block/block-api.schema.test.ts` | NEW                  | +90 (~13 cases)  |
| `packages/contracts/src/entities/lms/block/index.ts`                 | NEW                  | +5               |
| `packages/contracts/src/entities/lms/index.ts`                       | MODIFY               | +1               |
| `packages/contracts/package.json`                                    | MODIFY (exports map) | +1               |
| `packages/contracts/README.md`                                       | MODIFY (1 bullet)    | +1               |

**Total**: 13 new + 3 modified = 16 files. ~+650 LOC net.

---

## § 7. Commit strategy

Per `[[husky-cross-package-squash]]` check: single-package (`packages/contracts/`) — no cross-package broken intermediate possible. Per `/feature small` Stage 7 default — single atomic commit OR per-phase if Stage 7 chooses split. Planner-side preference:

**1 atomic code commit + 1 docs commit** (mirror Step 6.0 close-out cadence):

- **Commit 1**: `feat(contracts): add lms/block slice with intensity and timecap shared vos`

  - Subject: 70 chars (under cap 100).
  - Body: lists Phase 1 (\_shared VOs: intensity + timeCap with refine validations) + Phase 2 (block entity + 5 ops + regression guards) + Phase 3 (api-schema params + request/response wrappers) + Phase 4 (barrel + lms/index + exports map + README); calls out OQ-1A intensity refine + OQ-2A M:N replace-all + BLOCK_CONSTANTS = {MAX_NOTES_LENGTH: 2000, MAX_LABELS_PER_BLOCK: 10}; zero consumers in same step.

- **Commit 2**: `docs(step-07.0): write executor output report`
  - Body: minimal — points to output.md.

Alternative: Stage 7 of `/feature small` may auto-split into per-phase commits. Acceptable — order preserved (Phase 1 → 4 = additive only, no broken intermediate). If split, each commit subject ≤ 100 chars lowercase.

**Branch override (mandatory per `[[always-via-feature-skill]]`)**: do NOT cut `feat/<slug>` from main. Stay on `feat/training-domain`. If `/feature small` Stage 0 attempts branch creation, override via Stage 0 instruction OR STOP-and-surface via `AskUserQuestion`.

---

## § 8. Output (`implementation/step-07.0/output.md`)

Standard executor report per WORKFLOW.md § "output.md format":

```markdown
## Что сделано

- <2-4 sentences narrating the Block contract slice + \_shared VOs + barrel/exports/README updates>

## Изменённые/созданные файлы

- <bullet list per § 6 inventory with paths + (new) / (modified) + brief 1-line purpose>

## Принятые решения

- D-1 — <decision name>: <1-2 sentence justification>
- D-2 — ...
  (record D-N for: any TS-narrowing approach used, Zod refine signatures landed, version-mismatch adjustments если any, README pre-existing inconsistency observation, any Stage 5/6 reviewer findings + ratification path)

## Возникшие вопросы и как решены

- (if no escalations: "Zero § 0 STOP-and-surface escalations; all verbatim quotes matched HEAD <sha> byte-for-byte.")
- Otherwise per-question entry: name, surface mechanism, resolution path.

## Что отложено

- README pre-existing inconsistency about `day` / `exercise` / `label` missing from LMS bullet (out of Block-additive scope per § 4; flag as housekeeping for next contract-touching step).
- Block api-server (Step 7.1) — first consumer of these contracts.
- Block UI (Step 7.4) — BlockLabelMulti widget shape decision (OQ-3 deferred to 7.4 thesis).
- Intensity / TimeCap UI editors (Step 7.5) — form-driven per VO additive optional fields.
- Schema entity (Step 8) — will consume `intensitySchema` from `_shared`.

## Verification notes

- `pnpm check-types`: <result>
- `pnpm lint`: <result>
- `pnpm test`: <result>
- `pnpm dep:check`: <result>
- Grep regressions per § 5.2: <table>

## Ссылка на `.feature-dev/<ts>/`

(`/feature small` pipeline writes here; link the timestamp dir; list research.md / review.md if present)

## Acceptance criteria self-check

| Criterion                                           | Status |
| --------------------------------------------------- | ------ |
| § 5.1 commands green                                | ☐      |
| § 5.2 grep counts match                             | ☐      |
| Husky pre-commit + commit-msg clean без --no-verify | ☐      |
| output.md sections complete                         | ☐      |
```

---

## § 9. Style invariants

- **No code comments** unless non-obvious WHY (single line ≤ 100 chars).
- **English** for code/commits/PRs/comments; chat-prose с user — planner side only.
- **No** `Co-Authored-By` / `Generated-with` trailers anywhere.
- **No** `--no-verify` / `--no-edit` / `--no-gpg-sign`.
- **No** `as any` / `as unknown` / unjustified `!` per `[[type-quality]]`.
- **No `@prisma/client` import** in contracts (`contracts-no-prisma` dep-cruiser rule; enforced by `pnpm dep:check`). Block + BlockLabelAssignment enums absent here — intensity uses `as const` tuples + `z.enum`, not `z.nativeEnum(IntensityDimension from prisma)`.
- **Zod schemas via `z.object({ ... })` + `z.array(...)` + `z.enum([...] as const)`** per existing slice patterns.
- **`as const` tuples** for enum-style literal arrays before `z.enum(...)` (mirror Day's `dayOfWeekValues` precedent).
- **Test file structure**: `describe("<schemaName>", () => { it("...", ...) })`. One assertion per `it` where possible.
- **Commitlint**: subject ≤ 100 chars, fully lowercase (acronyms included — `vos`, `mn` if abbreviating); body lines ≤ 100 chars (per `[[commitlint-subject-case]]` + Step 6.1 PROMPT-001 precedent).
- **`/feature small` Stage 0 instruction**: explicitly tell Stage 0 to skip `git checkout -b` — stay on `feat/training-domain`. If Stage 0 ignores, STOP-and-surface per § 0.8.

---

## § 10. Pre-flight checklist (executor runs before Phase 1)

Tick mentally before any code:

- ☐ Verified § 0.1-0.6 verbatim quotes match HEAD `a85eff4b` byte-for-byte.
- ☐ Verified `packages/contracts/src/entities/lms/block/` directory does NOT exist.
- ☐ Verified `grep -rln "blockSchema\|intensitySchema\|timeCapSchema\|BLOCK_CONSTANTS" packages/contracts/src/` returns 0 hits.
- ☐ Verified `grep -rln "@repo/contracts/lms/block" packages/ apps/` returns 0 hits.
- ☐ Read OQ resolutions table § 0.7 (1A / 2A / consts).
- ☐ Confirmed scope: `packages/contracts/src/entities/lms/block/` + `packages/contracts/src/entities/lms/_shared/` (additive) + `packages/contracts/src/entities/lms/index.ts` (1-line) + `packages/contracts/package.json` (1-line) + `packages/contracts/README.md` (1-bullet).
- ☐ Domain citations read: `domain-model.md §1.3 Block`, `types.ts:57-79 Intensity/TimeCap source-of-truth`.
- ☐ Real Prisma `Block` + `BlockLabelAssignment` shape (§ 0.6) matches contract field set.
- ☐ Branch is `feat/training-domain` (not `main`, not `feat/<slug>`). If `/feature small` Stage 0 cut a fresh branch — STOP and surface.

If any ☐ unverified — return to § 0.

---

**End of Step 7.0 prompt**.

Self-contained executor brief. `/feature small` Stage 1 (Research) should adopt § 0.1-0.8 verbatim quotes as input — DO NOT re-derive. Stage 2-4 implement Phases 1-4 per § 3. Stage 5 reviewer + Stage 6 QA should focus on Intensity refine semantics + M:N labelIds invariants. Stage 7 commits per § 7.

User runs no browser smoke-test (contract-only step, § 5.4 N/A); planner closes Step 7.0 after artifact spot-check + verification gate green. Next: Step 7.1 (api-server `lmsBlockApi`).
