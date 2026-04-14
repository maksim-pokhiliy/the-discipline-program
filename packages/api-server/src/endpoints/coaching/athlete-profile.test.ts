import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { NotFoundError } from "@repo/errors";

import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

import { coachingAthleteProfileApi } from "./athlete-profile";

describe("coachingAthleteProfileApi", () => {
  let userWithProfile: Awaited<ReturnType<typeof createTestUser>>;
  let userWithoutProfile: Awaited<ReturnType<typeof createTestUser>>;
  let profileId: string;

  beforeAll(async () => {
    userWithProfile = await createTestUser();
    userWithoutProfile = await createTestUser();

    const profile = await cleanupRaw.athleteProfile.create({
      data: { userId: userWithProfile.id },
    });

    profileId = profile.id;
  });

  afterAll(async () => {
    await cleanupRaw.athleteProfile
      .deleteMany({
        where: { userId: { in: [userWithProfile.id, userWithoutProfile.id] } },
      })
      .catch(() => {});

    await cleanup(
      { table: "user", id: userWithProfile.id },
      { table: "user", id: userWithoutProfile.id },
    );
  });

  describe("get", () => {
    it("returns profile for a user with an athlete profile", async () => {
      const profile = await coachingAthleteProfileApi.get(userWithProfile.id);

      expect(profile.id).toBe(profileId);
      expect(profile.userId).toBe(userWithProfile.id);
      expect(profile.healthStatus).toBe(HealthStatus.HEALTHY);
      expect(profile.gender).toBeNull();
      expect(profile.heightCm).toBeNull();
      expect(profile.weightKg).toBeNull();
      expect(profile.healthNote).toBeNull();
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });

    it("throws NotFoundError for user without an athlete profile", async () => {
      await expect(coachingAthleteProfileApi.get(userWithoutProfile.id)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("upsert", () => {
    it("creates a profile with enum mapping when none exists", async () => {
      const created = await coachingAthleteProfileApi.upsert(userWithoutProfile.id, {
        gender: Gender.MALE,
        heightCm: 180,
        weightKg: 85,
        healthStatus: HealthStatus.HEALTHY,
      });

      expect(created.userId).toBe(userWithoutProfile.id);
      expect(created.gender).toBe(Gender.MALE);
      expect(created.heightCm).toBe(180);
      expect(created.weightKg).toBe(85);
      expect(created.healthStatus).toBe(HealthStatus.HEALTHY);
      expect(created.createdAt).toBeInstanceOf(Date);
    });

    it("updates an existing profile with new values", async () => {
      const updated = await coachingAthleteProfileApi.upsert(userWithProfile.id, {
        gender: Gender.FEMALE,
        heightCm: 165,
        weightKg: 60,
        healthStatus: HealthStatus.INJURED,
        healthNote: "Knee injury — light training only",
      });

      expect(updated.id).toBe(profileId);
      expect(updated.gender).toBe(Gender.FEMALE);
      expect(updated.heightCm).toBe(165);
      expect(updated.weightKg).toBe(60);
      expect(updated.healthStatus).toBe(HealthStatus.INJURED);
      expect(updated.healthNote).toBe("Knee injury — light training only");
    });

    it("partial update preserves unchanged fields", async () => {
      await coachingAthleteProfileApi.upsert(userWithProfile.id, {
        healthStatus: HealthStatus.RESTRICTED,
      });

      const profile = await coachingAthleteProfileApi.get(userWithProfile.id);

      expect(profile.healthStatus).toBe(HealthStatus.RESTRICTED);
      expect(profile.gender).toBe(Gender.FEMALE);
      expect(profile.heightCm).toBe(165);
    });
  });
});
