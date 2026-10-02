import { EnrollmentStatus } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ForbiddenError } from "@repo/errors";

import { cleanupRaw, createTestLegacyIdentity, createTestPlan } from "../../../test/helpers";
import { createTestEnrollment } from "../../../test/schedule-helpers";
import { LEGACY_PLAN_INDIVIDUAL } from "../../mobile-compat/legacy-catalogs";

import { athletesApi } from "./athletes";
import {
  cleanupFixtures,
  createFixtureTracker,
  createTrackedCoach,
  createTrackedUser,
} from "./publish-fixture.test-helpers";

const LEGACY_PLAN_GENERAL = 1;

const tracker = createFixtureTracker();

describe("athletesApi.listLinkableAthletes", () => {
  let coachUserId = "";
  let foreignCoachUserId = "";
  let planId = "";
  let otherPlanId = "";
  const ids = {
    linkable: "",
    pausedLinkable: "",
    generalPlanAccount: "",
    noAccount: "",
    softDeleted: "",
    notEnrolled: "",
    enrolledElsewhere: "",
  };

  const enrolledAthlete = async (
    targetPlanId: string,
    options: { legacyPlanId?: number; status?: EnrollmentStatus } = {},
  ): Promise<string> => {
    const athleteId = await createTrackedUser(tracker);

    await createTestEnrollment(targetPlanId, athleteId, coachUserId, {
      status: options.status ?? EnrollmentStatus.ACTIVE,
    });

    if (options.legacyPlanId !== undefined) {
      await createTestLegacyIdentity(athleteId, { legacyPlanId: options.legacyPlanId });
    }

    return athleteId;
  };

  beforeAll(async () => {
    coachUserId = (await createTrackedCoach(tracker)).user.id;
    foreignCoachUserId = (await createTrackedCoach(tracker)).user.id;
    planId = (await createTestPlan(coachUserId)).id;
    otherPlanId = (await createTestPlan(coachUserId)).id;
    tracker.planIds.push(planId, otherPlanId);

    ids.linkable = await enrolledAthlete(planId, { legacyPlanId: LEGACY_PLAN_INDIVIDUAL });
    ids.pausedLinkable = await enrolledAthlete(planId, {
      legacyPlanId: LEGACY_PLAN_INDIVIDUAL,
      status: EnrollmentStatus.PAUSED,
    });
    ids.generalPlanAccount = await enrolledAthlete(planId, { legacyPlanId: LEGACY_PLAN_GENERAL });
    ids.noAccount = await enrolledAthlete(planId);
    ids.softDeleted = await enrolledAthlete(planId, { legacyPlanId: LEGACY_PLAN_INDIVIDUAL });
    ids.enrolledElsewhere = await enrolledAthlete(otherPlanId, {
      legacyPlanId: LEGACY_PLAN_INDIVIDUAL,
    });
    ids.notEnrolled = await createTrackedUser(tracker);
    await createTestLegacyIdentity(ids.notEnrolled, { legacyPlanId: LEGACY_PLAN_INDIVIDUAL });

    await cleanupRaw.user.update({
      where: { id: ids.softDeleted },
      data: { deletedAt: new Date() },
    });
  });

  afterAll(async () => {
    await cleanupFixtures(tracker);
  });

  it("returns exactly the plan's enrolled athletes with an Individual-plan account, as ids in order", async () => {
    expect(await athletesApi.listLinkableAthletes(coachUserId, planId)).toEqual(
      [ids.linkable, ids.pausedLinkable].sort().map((athleteId) => ({ athleteId })),
    );
  });

  it("leaves out an Individual-plan account that is not enrolled in this plan", async () => {
    const athleteIds = (await athletesApi.listLinkableAthletes(coachUserId, planId)).map(
      (athlete) => athlete.athleteId,
    );

    expect(athleteIds).not.toContain(ids.notEnrolled);
    expect(athleteIds).not.toContain(ids.enrolledElsewhere);
  });

  it("leaves out enrolled athletes with a General-plan account, with no account, or soft-deleted", async () => {
    const athleteIds = (await athletesApi.listLinkableAthletes(coachUserId, planId)).map(
      (athlete) => athlete.athleteId,
    );

    expect(athleteIds).not.toContain(ids.generalPlanAccount);
    expect(athleteIds).not.toContain(ids.noAccount);
    expect(athleteIds).not.toContain(ids.softDeleted);
  });

  it("refuses a coach who does not own the plan", async () => {
    await expect(
      athletesApi.listLinkableAthletes(foreignCoachUserId, planId),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
