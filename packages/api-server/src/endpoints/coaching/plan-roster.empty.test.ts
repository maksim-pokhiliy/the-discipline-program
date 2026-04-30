import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { cleanup, createTestCoach, createTestPlan } from "../../test/helpers";

import { coachingPlanRosterApi } from "./plan-roster";

describe("coachingPlanRosterApi.list — empty DB", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let plan: Awaited<ReturnType<typeof createTestPlan>>;

  beforeAll(async () => {
    coach = await createTestCoach();
    plan = await createTestPlan(coach.user.id, { status: TrainingPlanStatus.ACTIVE });
  });

  afterAll(async () => {
    await cleanup(
      { table: "trainingPlan", id: plan.id },
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
    );
  });

  it("returns empty roster for plan with no enrollments", async () => {
    const entries = await coachingPlanRosterApi.list(coach.user.id, plan.id);

    expect(entries).toEqual([]);
  });
});
