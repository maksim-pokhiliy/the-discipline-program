import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { cleanup, createTestCoach, createTestPlan, createTestUser } from "../../test/helpers";

import { coachingCoachNoteApi } from "./coach-note";

describe("coachingCoachNoteApi.getAll — empty DB", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;
  let plan: Awaited<ReturnType<typeof createTestPlan>>;

  beforeAll(async () => {
    coach = await createTestCoach();
    athlete = await createTestUser();
    plan = await createTestPlan(coach.user.id, { status: TrainingPlanStatus.ACTIVE });
  });

  afterAll(async () => {
    await cleanup(
      { table: "trainingPlan", id: plan.id },
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
      { table: "user", id: athlete.id },
    );
  });

  it("returns empty array for coach with no notes", async () => {
    const notes = await coachingCoachNoteApi.getAll(coach.user.id);

    expect(notes).toEqual([]);
  });

  it("returns empty array when filtering by athlete with no notes", async () => {
    const notes = await coachingCoachNoteApi.getAll(coach.user.id);
    const forAthlete = notes.filter((note) => note.athleteId === athlete.id);

    expect(forAthlete).toHaveLength(0);
  });
});
