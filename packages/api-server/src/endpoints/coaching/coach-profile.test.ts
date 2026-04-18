import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { NotFoundError } from "@repo/errors";

import { cleanup, createTestCoach, createTestUser } from "../../test/helpers";

import { coachingCoachProfileApi } from "./coach-profile";

describe("coachingCoachProfileApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let userWithoutProfile: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    coach = await createTestCoach();
    userWithoutProfile = await createTestUser();
  });

  afterAll(async () => {
    await cleanup(
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
      { table: "user", id: userWithoutProfile.id },
    );
  });

  describe("get", () => {
    it("returns profile for a user with a coach profile", async () => {
      const profile = await coachingCoachProfileApi.get(coach.user.id);

      expect(profile.id).toBe(coach.profile.id);
      expect(profile.userId).toBe(coach.user.id);
      expect(profile.bio).toBeNull();
      expect(profile.createdAt).toBeInstanceOf(Date);
      expect(profile.updatedAt).toBeInstanceOf(Date);
    });

    it("throws NotFoundError for user without a coach profile", async () => {
      await expect(coachingCoachProfileApi.get(userWithoutProfile.id)).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("upsert", () => {
    it("updates an existing coach profile", async () => {
      const updated = await coachingCoachProfileApi.upsert(coach.user.id, {
        bio: "Experienced CrossFit coach",
      });

      expect(updated.id).toBe(coach.profile.id);
      expect(updated.userId).toBe(coach.user.id);
      expect(updated.bio).toBe("Experienced CrossFit coach");
    });

    it("creates a new profile when none exists", async () => {
      const created = await coachingCoachProfileApi.upsert(userWithoutProfile.id, {
        bio: "New coach bio",
      });

      expect(created.userId).toBe(userWithoutProfile.id);
      expect(created.bio).toBe("New coach bio");
      expect(created.createdAt).toBeInstanceOf(Date);

      await cleanup({ table: "coachProfile", id: created.id });
    });

    it("updates bio to empty string via upsert", async () => {
      await coachingCoachProfileApi.upsert(coach.user.id, {
        bio: "Temporary bio",
      });

      const cleared = await coachingCoachProfileApi.upsert(coach.user.id, {});

      expect(cleared.id).toBe(coach.profile.id);
    });
  });
});
