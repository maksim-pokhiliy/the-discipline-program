import { describe, expect, it } from "vitest";

import { classifyBackfill } from "./legacy-days-backfill-classify";
import { backfillDigest, canonicalizeBackfillPlan } from "./legacy-days-backfill-digest";
import type { BackfillPlan, BackfillTarget } from "./legacy-days-backfill-plan";
import type { BackfillSnapshot } from "./legacy-days-backfill-snapshot";
import { parseLegacyDays } from "./legacy-days-backfill-source";
import { PLAN_DIGEST_LENGTH } from "./script-target-guard";

const DATE = "2026-07-01";
const PROGRAM = {
  dayTrainings: [{ trainingNumber: 1, blocks: [{ name: "WARM-UP", exercises: ["200 m row"] }] }],
};

const generalRow = (overrides: Record<string, unknown> = {}) => ({
  id: 11,
  scheduled_date: DATE,
  training_level_id: 2,
  is_rest_day: false,
  daily_program: PROGRAM,
  ...overrides,
});

const target = (overrides: Partial<BackfillTarget> = {}): BackfillTarget => ({
  dayId: "day_1",
  planName: "Winter Cycle",
  channel: "GENERAL",
  legacyTargetId: 2,
  scheduledDate: DATE,
  legacyRowId: 11,
  ...overrides,
});

const snapshotOf = (targets: readonly BackfillTarget[], alreadyFilled = 0): BackfillSnapshot => ({
  targets,
  alreadyFilled,
});

const planOf = (
  rows: Record<string, unknown>[],
  targets: readonly BackfillTarget[],
  alreadyFilled = 0,
): BackfillPlan =>
  classifyBackfill(
    parseLegacyDays({ general: rows, individual: [] }),
    snapshotOf(targets, alreadyFilled),
  );

const THREE_DAYS = ["2026-07-01", "2026-07-02", "2026-07-03"];

const threeRows = THREE_DAYS.map((date, index) =>
  generalRow({ id: 11 + index, scheduled_date: date }),
);

const threeTargets = THREE_DAYS.map((date, index) =>
  target({ dayId: `day_${String(index)}`, scheduledDate: date, legacyRowId: 11 + index }),
);

describe("backfillDigest — shape", () => {
  it("is twelve lower-case hexadecimal characters", () => {
    const digest = backfillDigest(planOf([generalRow()], [target()]));

    expect(digest).toHaveLength(PLAN_DIGEST_LENGTH);
    expect(digest).toMatch(/^[0-9a-f]{12}$/);
  });

  it("is stable across runs over the same plan", () => {
    expect(backfillDigest(planOf([generalRow()], [target()]))).toBe(
      backfillDigest(planOf([generalRow()], [target()])),
    );
  });

  it("canonicalises the writes and the reasons behind them, and nothing else", () => {
    expect(
      Object.keys(canonicalizeBackfillPlan(planOf([generalRow()], [target()]))).sort(),
    ).toEqual(["actions", "conflicts", "warnings"]);
  });
});

describe("backfillDigest — insensitivity", () => {
  it("ignores the order rows happen to sit in inside the export", () => {
    expect(backfillDigest(planOf([...threeRows].reverse(), threeTargets))).toBe(
      backfillDigest(planOf(threeRows, threeTargets)),
    );
  });

  it("ignores the order the ledger happens to return its rows in", () => {
    expect(backfillDigest(planOf(threeRows, [...threeTargets].reverse()))).toBe(
      backfillDigest(planOf(threeRows, threeTargets)),
    );
  });

  it("ignores how many rows already carry content, since that is not a write", () => {
    expect(backfillDigest(planOf([generalRow()], [target()], 120))).toBe(
      backfillDigest(planOf([generalRow()], [target()], 0)),
    );
  });

  it("ignores the plan's name, so renaming a plan cannot refuse an apply", () => {
    expect(backfillDigest(planOf([generalRow()], [target({ planName: "Renamed" })]))).toBe(
      backfillDigest(planOf([generalRow()], [target()])),
    );
  });

  it("ignores the ledger row's own id, which nobody can check against the report", () => {
    expect(backfillDigest(planOf([generalRow()], [target({ dayId: "day_other" })]))).toBe(
      backfillDigest(planOf([generalRow()], [target()])),
    );
  });
});

describe("backfillDigest — sensitivity", () => {
  it("moves when the content of a day changes", () => {
    const changed = generalRow({
      daily_program: {
        dayTrainings: [
          { trainingNumber: 1, blocks: [{ name: "WARM-UP", exercises: ["400 m row"] }] },
        ],
      },
    });

    expect(backfillDigest(planOf([changed], [target()]))).not.toBe(
      backfillDigest(planOf([generalRow()], [target()])),
    );
  });

  it("moves when a training day becomes a rest day", () => {
    const rest = generalRow({ is_rest_day: true, daily_program: null });

    expect(backfillDigest(planOf([rest], [target()]))).not.toBe(
      backfillDigest(planOf([generalRow()], [target()])),
    );
  });

  it("moves when the legacy row behind a day changes", () => {
    expect(backfillDigest(planOf([generalRow({ id: 12 })], [target()]))).not.toBe(
      backfillDigest(planOf([generalRow()], [target()])),
    );
  });

  it("moves when a day drops out of the plan", () => {
    expect(backfillDigest(planOf(threeRows, threeTargets.slice(1)))).not.toBe(
      backfillDigest(planOf(threeRows, threeTargets)),
    );
  });

  it("moves when a day turns into a warning", () => {
    const elsewhere = generalRow({ scheduled_date: "2026-08-01" });

    expect(backfillDigest(planOf([elsewhere], [target()]))).not.toBe(
      backfillDigest(planOf([generalRow()], [target()])),
    );
  });

  it("moves when a conflict appears", () => {
    expect(backfillDigest(planOf([generalRow()], [target({ legacyTargetId: null })]))).not.toBe(
      backfillDigest(planOf([generalRow()], [target()])),
    );
  });
});
