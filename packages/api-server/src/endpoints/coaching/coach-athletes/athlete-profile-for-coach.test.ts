import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { athleteProfileSchema, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { ForbiddenError } from "@repo/errors";

import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../../test/helpers";

import { coachingCoachAthletesApi } from "./index";

const EPOCH_MS = 0;

describe("coachingCoachAthletesApi.getAthleteProfile", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let athleteWithProfile: Awaited<ReturnType<typeof createTestUser>>;
  let athleteWithoutProfile: Awaited<ReturnType<typeof createTestUser>>;
  let unassignedAthlete: Awaited<ReturnType<typeof createTestUser>>;
  let profileId: string;
  let assignmentWithId: string;
  let assignmentWithoutId: string;

  beforeAll(async () => {
    coach = await createTestCoach();
    athleteWithProfile = await createTestUser();
    athleteWithoutProfile = await createTestUser();
    unassignedAthlete = await createTestUser();

    const profile = await cleanupRaw.athleteProfile.create({
      data: {
        userId: athleteWithProfile.id,
        healthStatus: HealthStatus.INJURED,
        healthNote: "Left shoulder",
      },
    });

    profileId = profile.id;

    const assignmentWith = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coach.profile.id, athleteId: athleteWithProfile.id },
    });

    assignmentWithId = assignmentWith.id;

    const assignmentWithout = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coach.profile.id, athleteId: athleteWithoutProfile.id },
    });

    assignmentWithoutId = assignmentWithout.id;
  });

  afterAll(async () => {
    await cleanup(
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
      { table: "user", id: athleteWithProfile.id },
      { table: "user", id: athleteWithoutProfile.id },
      { table: "user", id: unassignedAthlete.id },
      { table: "athleteProfile", id: profileId },
      { table: "coachAthleteAssignment", id: assignmentWithId },
      { table: "coachAthleteAssignment", id: assignmentWithoutId },
    );
  });

  it("returns the stored profile for an assigned athlete who has one", async () => {
    const profile = await coachingCoachAthletesApi.getAthleteProfile(
      coach.user.id,
      athleteWithProfile.id,
    );

    expect(athleteProfileSchema.safeParse(profile).success).toBe(true);
    expect(profile.userId).toBe(athleteWithProfile.id);
    expect(profile.healthStatus).toBe(HealthStatus.INJURED);
    expect(profile.healthNote).toBe("Left shoulder");
  });

  it("synthesizes a healthy default for an assigned athlete with no profile", async () => {
    const profile = await coachingCoachAthletesApi.getAthleteProfile(
      coach.user.id,
      athleteWithoutProfile.id,
    );

    expect(athleteProfileSchema.safeParse(profile).success).toBe(true);
    expect(profile.userId).toBe(athleteWithoutProfile.id);
    expect(profile.healthStatus).toBe(HealthStatus.HEALTHY);
    expect(profile.healthNote).toBeNull();
    expect(profile.heightCm).toBeNull();
    expect(profile.weightKg).toBeNull();
    expect(profile.createdAt.getTime()).toBe(EPOCH_MS);
  });

  it("throws ForbiddenError for an athlete not assigned to the coach", async () => {
    await expect(
      coachingCoachAthletesApi.getAthleteProfile(coach.user.id, unassignedAthlete.id),
    ).rejects.toThrow(ForbiddenError);
  });
});
