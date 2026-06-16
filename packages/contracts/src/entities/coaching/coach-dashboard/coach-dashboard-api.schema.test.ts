import { describe, expect, it } from "vitest";

import { progressAthleteSchema, todayStatusSchema } from "./coach-dashboard-api.schema";
import { ProcessStatus, TodayStatus } from "./coach-dashboard.constants";

const VALID_CUID = "clz00000000000000000fake1";

const buildProgressAthlete = () => ({
  userId: VALID_CUID,
  name: "Jane Doe",
  image: null,
  processStatus: ProcessStatus.FALLING_BEHIND,
});

describe("progressAthleteSchema", () => {
  it("accepts a row without the trend fields", () => {
    expect(progressAthleteSchema.safeParse(buildProgressAthlete()).success).toBe(true);
  });

  it("accepts a row with engagementPct and weeklyDelta", () => {
    const result = progressAthleteSchema.safeParse({
      ...buildProgressAthlete(),
      engagementPct: 42,
      weeklyDelta: -8,
    });

    expect(result.success).toBe(true);
  });

  it("accepts null trend fields", () => {
    const result = progressAthleteSchema.safeParse({
      ...buildProgressAthlete(),
      engagementPct: null,
      weeklyDelta: null,
    });

    expect(result.success).toBe(true);
  });

  it("accepts engagementPct at the bounds", () => {
    expect(
      progressAthleteSchema.safeParse({ ...buildProgressAthlete(), engagementPct: 0 }).success,
    ).toBe(true);
    expect(
      progressAthleteSchema.safeParse({ ...buildProgressAthlete(), engagementPct: 100 }).success,
    ).toBe(true);
  });

  it("rejects engagementPct over 100", () => {
    expect(
      progressAthleteSchema.safeParse({ ...buildProgressAthlete(), engagementPct: 101 }).success,
    ).toBe(false);
  });

  it("rejects a negative engagementPct", () => {
    expect(
      progressAthleteSchema.safeParse({ ...buildProgressAthlete(), engagementPct: -1 }).success,
    ).toBe(false);
  });

  it("rejects a non-integer engagementPct", () => {
    expect(
      progressAthleteSchema.safeParse({ ...buildProgressAthlete(), engagementPct: 1.5 }).success,
    ).toBe(false);
  });

  it("rejects a non-integer weeklyDelta", () => {
    expect(
      progressAthleteSchema.safeParse({ ...buildProgressAthlete(), weeklyDelta: 2.5 }).success,
    ).toBe(false);
  });
});

describe("todayStatusSchema", () => {
  it.each(Object.values(TodayStatus))("accepts status: %s", (status) => {
    expect(todayStatusSchema.safeParse(status).success).toBe(true);
  });

  it("rejects an invalid status", () => {
    expect(todayStatusSchema.safeParse("DONE").success).toBe(false);
  });
});
