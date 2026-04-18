import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { coachDashboardDataSchema } from "@repo/contracts/coaching/coach-dashboard";

import { cleanup, cleanupRaw, createTestCoach } from "../../test/helpers";

import { coachingCoachDashboardApi } from "./coach-dashboard";

describe("coachingCoachDashboardApi.getDashboard — empty DB", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;

  beforeAll(async () => {
    coach = await createTestCoach();

    await cleanupRaw.user.update({
      where: { id: coach.user.id },
      data: { timezone: "UTC" },
    });
  });

  afterAll(async () => {
    await cleanupRaw.coachActionItem
      .deleteMany({ where: { coachId: coach.profile.id } })
      .catch(() => {});

    await cleanup(
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
    );
  });

  it("returns zeroed overview and empty collections for coach with no plans", async () => {
    const result = await coachingCoachDashboardApi.getDashboard(coach.user.id);

    expect(result.overview.totalActiveAthletes).toBe(0);
    expect(result.overview.activePlansCount).toBe(0);
    expect(result.overview.workoutsPlannedToday).toBe(0);
    expect(result.overview.workoutsCompletedToday).toBe(0);
    expect(result.overview.workoutsPlannedThisWeek).toBe(0);
    expect(result.overview.workoutsCompletedThisWeek).toBe(0);
    expect(result.overview.openActionItemsCount).toBe(0);
    expect(result.overview.newAthletesCount).toBe(0);

    expect(result.actionItems).toHaveLength(0);
    expect(result.athletesSummary).toHaveLength(0);

    expect(result.progressBuckets.onTrack).toHaveLength(0);
    expect(result.progressBuckets.steady).toHaveLength(0);
    expect(result.progressBuckets.fallingBehind).toHaveLength(0);
    expect(result.progressBuckets.avgEngagementRate).toBe(0);
  });

  it("roundtrips through coachDashboardDataSchema", async () => {
    const result = await coachingCoachDashboardApi.getDashboard(coach.user.id);
    const parsed = coachDashboardDataSchema.safeParse(result);

    expect(parsed.success).toBe(true);
  });
});
