import { describe, expect, it } from "vitest";

import {
  dayContentHash,
  toHashable,
} from "../src/endpoints/coaching/mobile-publish/day-content-hash";

import { classifyBackfill } from "./legacy-days-backfill-classify";
import type { BackfillTarget } from "./legacy-days-backfill-plan";
import type { BackfillSnapshot } from "./legacy-days-backfill-snapshot";
import { parseLegacyDays } from "./legacy-days-backfill-source";

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

const individualRow = (overrides: Record<string, unknown> = {}) => ({
  id: 91,
  scheduled_date: DATE,
  user_id: 7,
  is_rest_day: true,
  daily_program: null,
  ...overrides,
});

const generalTarget = (overrides: Partial<BackfillTarget> = {}): BackfillTarget => ({
  dayId: "day_general",
  planName: "Winter Cycle",
  channel: "GENERAL",
  legacyTargetId: 2,
  scheduledDate: DATE,
  legacyRowId: 11,
  ...overrides,
});

const individualTarget = (overrides: Partial<BackfillTarget> = {}): BackfillTarget => ({
  dayId: "day_individual",
  planName: "Solo Block",
  channel: "INDIVIDUAL",
  legacyTargetId: 7,
  scheduledDate: DATE,
  legacyRowId: 91,
  ...overrides,
});

const snapshotOf = (targets: readonly BackfillTarget[], alreadyFilled = 0): BackfillSnapshot => ({
  targets,
  alreadyFilled,
});

const sourceOf = (overrides: Record<string, unknown> = {}) =>
  parseLegacyDays({ general: [generalRow()], individual: [individualRow()], ...overrides });

describe("classifyBackfill", () => {
  it("fills a day whose legacy row is the one the ledger already names", () => {
    const plan = classifyBackfill(sourceOf(), snapshotOf([generalTarget()]));

    expect(plan.conflicts).toEqual([]);
    expect(plan.warnings).toEqual([]);
    expect(plan.actions.map((action) => action.kind)).toEqual(["fill"]);
    expect(plan.actions[0]?.content).toEqual({
      legacyRowId: 11,
      isRestDay: false,
      dailyProgram: PROGRAM,
    });
  });

  it("hashes the content the way the publish path would have hashed it", () => {
    const plan = classifyBackfill(sourceOf(), snapshotOf([generalTarget()]));

    expect(plan.actions[0]?.contentHash).toBe(dayContentHash(toHashable(false, PROGRAM)));
  });

  it("hashes a rest day as a rest day, with no program in the hashed shape", () => {
    const plan = classifyBackfill(sourceOf(), snapshotOf([individualTarget()]));

    expect(plan.actions[0]?.contentHash).toBe(dayContentHash(toHashable(true, null)));
  });

  it("moves the row id when the legacy day was republished after our snapshot", () => {
    const plan = classifyBackfill(sourceOf(), snapshotOf([generalTarget({ legacyRowId: 4 })]));

    expect(plan.actions.map((action) => action.kind)).toEqual(["fill-from-newer-row"]);
    expect(plan.actions[0]?.content.legacyRowId).toBe(11);
  });

  it("leaves a day alone when the legacy table has nothing on that date", () => {
    const plan = classifyBackfill(
      sourceOf(),
      snapshotOf([generalTarget({ scheduledDate: "2026-07-02" })]),
    );

    expect(plan.actions).toEqual([]);
    expect(plan.warnings.map((warning) => warning.kind)).toEqual(["missing-in-legacy"]);
    expect(plan.warnings[0]?.planName).toBe("Winter Cycle");
  });

  it("matches a general day by training level and an individual day by athlete", () => {
    const plan = classifyBackfill(sourceOf(), snapshotOf([generalTarget(), individualTarget()]));

    expect(plan.actions.map((action) => action.content.legacyRowId)).toEqual([11, 91]);
  });

  it("never crosses the two legacy tables, even when the ids collide", () => {
    const plan = classifyBackfill(
      parseLegacyDays({ general: [generalRow({ training_level_id: 7 })], individual: [] }),
      snapshotOf([individualTarget()]),
    );

    expect(plan.actions).toEqual([]);
    expect(plan.warnings.map((warning) => warning.kind)).toEqual(["missing-in-legacy"]);
  });

  it("refuses a link that carries no legacy id for its own channel", () => {
    const plan = classifyBackfill(
      sourceOf(),
      snapshotOf([generalTarget({ legacyTargetId: null })]),
    );

    expect(plan.actions).toEqual([]);
    expect(plan.conflicts.map((conflict) => conflict.reason)).toEqual(["link-missing-channel-id"]);
    expect(plan.conflicts[0]?.planName).toBe("Winter Cycle");
  });

  it("refuses to guess when two legacy rows sit on one day", () => {
    const plan = classifyBackfill(
      parseLegacyDays({
        general: [generalRow(), generalRow({ id: 12 })],
        individual: [],
      }),
      snapshotOf([generalTarget()]),
    );

    expect(plan.actions).toEqual([]);
    expect(plan.conflicts.map((conflict) => conflict.reason)).toEqual(["duplicate-legacy-row"]);
    expect(plan.conflicts[0]?.detail).toContain("11, 12");
  });

  it("carries every source defect through as a conflict", () => {
    const plan = classifyBackfill(
      parseLegacyDays({
        general: [generalRow({ is_rest_day: true })],
        individual: [individualRow()],
      }),
      snapshotOf([individualTarget()]),
    );

    expect(plan.conflicts.map((conflict) => conflict.reason)).toEqual([
      "rest-day-carries-a-program",
    ]);
    expect(plan.conflicts[0]?.subject).toBe("general_programs #11");
    expect(plan.conflicts[0]?.planName).toBeNull();
  });

  it("reports how many rows already carry content and were never considered", () => {
    expect(classifyBackfill(sourceOf(), snapshotOf([generalTarget()], 120)).alreadyFilled).toBe(
      120,
    );
  });

  it("names the day by channel, legacy target and date", () => {
    const plan = classifyBackfill(
      sourceOf(),
      snapshotOf([generalTarget({ scheduledDate: "2026-07-02" })]),
    );

    expect(plan.warnings[0]?.subject).toBe("GENERAL level 2 · 2026-07-02");
  });
});
