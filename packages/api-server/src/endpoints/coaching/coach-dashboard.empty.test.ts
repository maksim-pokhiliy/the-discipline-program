import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { coachDashboardDataSchema } from "@repo/contracts/coaching/coach-dashboard";

import { cleanup, cleanupRaw, createTestCoach } from "../../test/helpers";

import { coachingCoachDashboardApi } from "./coach-dashboard";

describe("coachingCoachDashboardApi.getDashboard — empty DB", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;

  beforeAll(async () => {
    coach = await createTestCoach();

    await cleanupRaw.user.update({ where: { id: coach.user.id }, data: { timezone: "UTC" } });
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

  it("returns a schema-valid zeroed shape for a coach with no roster", async () => {
    const data = await coachingCoachDashboardApi.getDashboard(coach.user.id);

    expect(coachDashboardDataSchema.safeParse(data).success).toBe(true);
    expect(data.overview.totalActiveAthletes).toBe(0);
    expect(data.overview.workoutsPlannedToday).toBe(0);
    expect(data.overview.workoutsCompletedThisWeek).toBe(0);
    expect(data.athletesSummary).toEqual([]);
    expect(data.actionItems).toEqual([]);
  });

  it("returns empty progress buckets with a zero average engagement rate", async () => {
    const data = await coachingCoachDashboardApi.getDashboard(coach.user.id);

    expect(data.progressBuckets.onTrack).toEqual([]);
    expect(data.progressBuckets.steady).toEqual([]);
    expect(data.progressBuckets.fallingBehind).toEqual([]);
    expect(data.progressBuckets.avgEngagementRate).toBe(0);
  });
});
