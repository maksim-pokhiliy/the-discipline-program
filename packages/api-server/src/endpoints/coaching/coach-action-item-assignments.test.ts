import { afterEach, describe, expect, it } from "vitest";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coaching/coach-action-item";

import { cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import { coachingCoachActionItemApi } from "./coach-action-item";

describe("coachingCoachActionItemApi.reconcile — assignment-only athletes", () => {
  const createdCoachProfileIds: string[] = [];
  const createdUserIds: string[] = [];
  const createdAthleteProfileIds: string[] = [];

  const trackCoach = async () => {
    const coach = await createTestCoach();

    await cleanupRaw.user.update({
      where: { id: coach.user.id },
      data: { timezone: "UTC" },
    });

    createdCoachProfileIds.push(coach.profile.id);
    createdUserIds.push(coach.user.id);

    return coach;
  };

  const trackUser = async () => {
    const user = await createTestUser();

    createdUserIds.push(user.id);

    return user;
  };

  afterEach(async () => {
    await cleanupRaw.coachActionItem
      .deleteMany({ where: { coachId: { in: createdCoachProfileIds } } })
      .catch(() => {});
    await cleanupRaw.coachAthleteAssignment
      .deleteMany({ where: { coachId: { in: createdCoachProfileIds } } })
      .catch(() => {});
    await cleanupRaw.athleteProfile
      .deleteMany({ where: { id: { in: createdAthleteProfileIds } } })
      .catch(() => {});
    await cleanupRaw.coachProfile
      .deleteMany({ where: { id: { in: createdCoachProfileIds } } })
      .catch(() => {});
    await cleanupRaw.user.deleteMany({ where: { id: { in: createdUserIds } } }).catch(() => {});

    createdCoachProfileIds.length = 0;
    createdUserIds.length = 0;
    createdAthleteProfileIds.length = 0;
  });

  it("does not fire MISSED_WORKOUTS for an assigned athlete with no workoutLogs", async () => {
    const coach = await trackCoach();
    const athlete = await trackUser();

    await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coach.profile.id, athleteId: athlete.id },
    });

    await coachingCoachActionItemApi.reconcile(coach.user.id);

    const missed = await cleanupRaw.coachActionItem.findMany({
      where: {
        coachId: coach.profile.id,
        athleteId: athlete.id,
        type: ActionItemType.MISSED_WORKOUTS,
      },
    });

    expect(missed).toHaveLength(0);
  });

  it("creates HEALTH_REPORT for an assigned athlete regardless of enrollment state", async () => {
    const coach = await trackCoach();
    const athlete = await trackUser();

    const profile = await cleanupRaw.athleteProfile.create({
      data: { userId: athlete.id, healthStatus: HealthStatus.INJURED },
    });

    createdAthleteProfileIds.push(profile.id);

    await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coach.profile.id, athleteId: athlete.id },
    });

    await coachingCoachActionItemApi.reconcile(coach.user.id);

    const health = await cleanupRaw.coachActionItem.findMany({
      where: {
        coachId: coach.profile.id,
        athleteId: athlete.id,
        type: ActionItemType.HEALTH_REPORT,
        status: ActionItemStatus.OPEN,
      },
    });

    expect(health).toHaveLength(1);
    expect(health[0]?.severity).toBe(ActionItemSeverity.CRITICAL);
  });
});
