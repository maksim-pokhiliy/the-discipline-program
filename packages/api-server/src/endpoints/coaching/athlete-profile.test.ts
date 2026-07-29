import { ProfileAxisBinding } from "@prisma/client";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { Gender, HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import { NotFoundError, ValidationError } from "@repo/errors";

import { prisma } from "../../db/client";
import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

import { coachingAthleteProfileApi } from "./athlete-profile";

const DELETED_AXIS_ID = "cdeletedaxis000000000001";

describe("coachingAthleteProfileApi", () => {
  let userWithProfile: Awaited<ReturnType<typeof createTestUser>>;
  let userWithoutProfile: Awaited<ReturnType<typeof createTestUser>>;
  let guardUser: Awaited<ReturnType<typeof createTestUser>>;
  let profileId: string;
  let levelAxisId: string;
  let equipmentAxisId: string;
  let genderAxisId: string;
  let ownedGenderAxisId: string | null;

  beforeAll(async () => {
    userWithProfile = await createTestUser();
    userWithoutProfile = await createTestUser();
    guardUser = await createTestUser();

    const profile = await cleanupRaw.athleteProfile.create({
      data: { userId: userWithProfile.id },
    });

    profileId = profile.id;

    await cleanupRaw.athleteProfile.create({ data: { userId: guardUser.id } });

    const levelAxis = await cleanupRaw.profileAxis.create({
      data: {
        key: `test-level-${crypto.randomUUID()}`,
        label: "Test Level",
        values: ["RX", "Scaled"],
      },
    });

    levelAxisId = levelAxis.id;

    const equipmentAxis = await cleanupRaw.profileAxis.create({
      data: {
        key: `test-equipment-${crypto.randomUUID()}`,
        label: "Test Equipment",
        values: ["Barbell", "Dumbbell"],
      },
    });

    equipmentAxisId = equipmentAxis.id;

    const existingGenderAxis = await cleanupRaw.profileAxis.findFirst({
      where: { binding: ProfileAxisBinding.GENDER },
    });
    const genderAxis =
      existingGenderAxis ??
      (await cleanupRaw.profileAxis.create({
        data: {
          key: `test-gender-${crypto.randomUUID()}`,
          label: "Test Gender",
          values: ["Male", "Female"],
          binding: ProfileAxisBinding.GENDER,
        },
      }));

    genderAxisId = genderAxis.id;
    ownedGenderAxisId = existingGenderAxis === null ? genderAxis.id : null;
  });

  afterAll(async () => {
    await cleanupRaw.athleteProfile
      .deleteMany({
        where: { userId: { in: [userWithProfile.id, userWithoutProfile.id, guardUser.id] } },
      })
      .catch(() => {});

    await cleanupRaw.profileAxis
      .deleteMany({
        where: {
          id: {
            in: [levelAxisId, equipmentAxisId, ...(ownedGenderAxisId ? [ownedGenderAxisId] : [])],
          },
        },
      })
      .catch(() => {});

    await cleanup(
      { table: "user", id: userWithProfile.id },
      { table: "user", id: userWithoutProfile.id },
      { table: "user", id: guardUser.id },
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

  describe("upsert — profileSelections guard", () => {
    beforeEach(async () => {
      await cleanupRaw.athleteProfile.update({
        where: { userId: guardUser.id },
        data: { profileSelections: { [levelAxisId]: "RX" } },
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("rejects the whole request when a key targets a system-bound axis", async () => {
      await expect(
        coachingAthleteProfileApi.upsert(guardUser.id, {
          profileSelections: { [levelAxisId]: "Scaled", [genderAxisId]: "Female" },
        }),
      ).rejects.toThrow(ValidationError);

      const profile = await coachingAthleteProfileApi.get(guardUser.id);

      expect(profile.profileSelections).toEqual({ [levelAxisId]: "RX" });
    });

    it("names the offending axis in the validation details", async () => {
      await expect(
        coachingAthleteProfileApi.upsert(guardUser.id, {
          profileSelections: { [genderAxisId]: "Female" },
        }),
      ).rejects.toMatchObject({
        details: { field: "profileSelections", axisId: genderAxisId },
      });
    });

    it("keeps a value the catalogue no longer lists — a published plan snapshot still offers it", async () => {
      const sent = { [levelAxisId]: "Scaled", [equipmentAxisId]: "Kettlebell" };
      const updated = await coachingAthleteProfileApi.upsert(guardUser.id, {
        profileSelections: sent,
      });

      expect(updated.profileSelections).toEqual(sent);

      const reread = await coachingAthleteProfileApi.get(guardUser.id);

      expect(reread.profileSelections).toEqual(sent);
    });

    it("keeps a key whose axis was deleted — published plan snapshots still resolve weights from it", async () => {
      const sent = { [levelAxisId]: "Scaled", [DELETED_AXIS_ID]: "Anything" };
      const updated = await coachingAthleteProfileApi.upsert(guardUser.id, {
        profileSelections: sent,
      });

      expect(updated.profileSelections).toEqual(sent);

      const reread = await coachingAthleteProfileApi.get(guardUser.id);

      expect(reread.profileSelections).toEqual(sent);
    });

    it("stores a fully valid map byte-identical after exactly one axis query", async () => {
      const findManySpy = vi.spyOn(prisma.profileAxis, "findMany");
      const sent = { [levelAxisId]: "Scaled", [equipmentAxisId]: "Dumbbell" };
      const updated = await coachingAthleteProfileApi.upsert(guardUser.id, {
        profileSelections: sent,
      });

      expect(findManySpy).toHaveBeenCalledTimes(1);
      expect(updated.profileSelections).toEqual(sent);

      const reread = await coachingAthleteProfileApi.get(guardUser.id);

      expect(reread.profileSelections).toEqual(sent);
    });

    it("leaves profileSelections untouched and issues no axis query for a gender-only write", async () => {
      const findManySpy = vi.spyOn(prisma.profileAxis, "findMany");

      const updated = await coachingAthleteProfileApi.upsert(guardUser.id, {
        gender: Gender.FEMALE,
      });

      expect(findManySpy).not.toHaveBeenCalled();
      expect(updated.gender).toBe(Gender.FEMALE);
      expect(updated.profileSelections).toEqual({ [levelAxisId]: "RX" });
    });
  });
});
