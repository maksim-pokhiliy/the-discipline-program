import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { getWorkoutsResponseSchema } from "@repo/contracts/lms/workout";

import { cleanup, createTestCoach, createTestPlan } from "../../test/helpers";

import { lmsWorkoutApi } from "./workout";

describe("lmsWorkoutApi.getAll — empty DB", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let plan: Awaited<ReturnType<typeof createTestPlan>>;

  beforeAll(async () => {
    coach = await createTestCoach();
    plan = await createTestPlan(coach.profile.id);
  });

  afterAll(async () => {
    await cleanup(
      { table: "trainingPlan", id: plan.id },
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
    );
  });

  it("returns empty array for plan with no workouts", async () => {
    const result = await lmsWorkoutApi.getAll(coach.user.id, plan.id);

    expect(result).toEqual([]);
  });

  it("result validates against response schema", async () => {
    const result = await lmsWorkoutApi.getAll(coach.user.id, plan.id);
    const parsed = getWorkoutsResponseSchema.safeParse(result);

    expect(parsed.success).toBe(true);
  });
});
