import { describe, expect, it } from "vitest";

import { coachDashboardDataSchema } from "./coach-dashboard-api.schema";

const zeroOverview = {
  totalActiveAthletes: 0,
  activePlansCount: 0,
  workoutsPlannedToday: 0,
  workoutsCompletedToday: 0,
  workoutsPlannedThisWeek: 0,
  workoutsCompletedThisWeek: 0,
  openActionItemsCount: 0,
  newAthletesCount: 0,
};

const emptyBuckets = {
  onTrack: [],
  steady: [],
  fallingBehind: [],
  avgEngagementRate: 0,
};

describe("coach-dashboard-api schema empty payloads", () => {
  it("coachDashboardDataSchema accepts zeroed overview and empty lists", () => {
    const result = coachDashboardDataSchema.safeParse({
      overview: zeroOverview,
      actionItems: [],
      athletesSummary: [],
      progressBuckets: emptyBuckets,
    });

    expect(result.success).toBe(true);
  });

  it("coachDashboardDataSchema rejects missing progressBuckets", () => {
    const result = coachDashboardDataSchema.safeParse({
      overview: zeroOverview,
      actionItems: [],
      athletesSummary: [],
    });

    expect(result.success).toBe(false);
  });

  it("coachDashboardDataSchema rejects avgEngagementRate above 1", () => {
    const result = coachDashboardDataSchema.safeParse({
      overview: zeroOverview,
      actionItems: [],
      athletesSummary: [],
      progressBuckets: { ...emptyBuckets, avgEngagementRate: 1.5 },
    });

    expect(result.success).toBe(false);
  });

  it("coachDashboardDataSchema rejects null", () => {
    const result = coachDashboardDataSchema.safeParse(null);

    expect(result.success).toBe(false);
  });
});
