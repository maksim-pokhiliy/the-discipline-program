import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { NotFoundError } from "@repo/errors";

import {
  cleanup,
  cleanupRaw,
  createTestAssignment,
  createTestCoach,
  createTestCredential,
  createTestPlan,
  createTestUser,
} from "../../test/helpers";

import { coachingCoachProfileApi, computeMonthsActive } from "./coach-profile";

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

  describe("computeMonthsActive", () => {
    it("counts whole months since createdAt", () => {
      const createdAt = new Date("2024-01-15T00:00:00.000Z");
      const now = new Date("2024-04-15T00:00:00.000Z");

      expect(computeMonthsActive(createdAt, now)).toBe(3);
    });

    it("does not count a partial final month", () => {
      const createdAt = new Date("2024-01-15T00:00:00.000Z");
      const now = new Date("2024-04-10T00:00:00.000Z");

      expect(computeMonthsActive(createdAt, now)).toBe(2);
    });

    it("clamps to zero for a future createdAt", () => {
      const createdAt = new Date("2024-04-15T00:00:00.000Z");
      const now = new Date("2024-01-15T00:00:00.000Z");

      expect(computeMonthsActive(createdAt, now)).toBe(0);
    });
  });

  describe("getPageData", () => {
    let scopedCoach: Awaited<ReturnType<typeof createTestCoach>>;
    let athleteA: Awaited<ReturnType<typeof createTestUser>>;
    let athleteB: Awaited<ReturnType<typeof createTestUser>>;
    let activePlan: Awaited<ReturnType<typeof createTestPlan>>;
    let deletedPlan: Awaited<ReturnType<typeof createTestPlan>>;
    let firstCredential: Awaited<ReturnType<typeof createTestCredential>>;
    let secondCredential: Awaited<ReturnType<typeof createTestCredential>>;
    const createdAt = new Date("2024-01-15T00:00:00.000Z");

    beforeAll(async () => {
      scopedCoach = await createTestCoach();

      await cleanupRaw.user.update({ where: { id: scopedCoach.user.id }, data: { createdAt } });

      athleteA = await createTestUser();
      athleteB = await createTestUser();

      await createTestAssignment(scopedCoach.profile.id, athleteA.id);
      await createTestAssignment(scopedCoach.profile.id, athleteB.id);

      activePlan = await createTestPlan(scopedCoach.user.id);
      deletedPlan = await createTestPlan(scopedCoach.user.id, { deletedAt: new Date() });

      firstCredential = await createTestCredential(scopedCoach.profile.id, {
        title: "L1 Trainer",
        createdAt: new Date("2024-02-01T00:00:00.000Z"),
      });
      secondCredential = await createTestCredential(scopedCoach.profile.id, {
        title: "L2 Trainer",
        createdAt: new Date("2024-03-01T00:00:00.000Z"),
      });
    });

    afterAll(async () => {
      await cleanup(
        { table: "coachCredential", id: firstCredential.id },
        { table: "coachCredential", id: secondCredential.id },
        { table: "trainingPlan", id: activePlan.id },
        { table: "trainingPlan", id: deletedPlan.id },
        { table: "user", id: athleteA.id },
        { table: "user", id: athleteB.id },
        { table: "coachProfile", id: scopedCoach.profile.id },
        { table: "user", id: scopedCoach.user.id },
      );
    });

    it("returns the three derived track-record numbers", async () => {
      const pageData = await coachingCoachProfileApi.getPageData(scopedCoach.user.id);

      expect(pageData.trackRecord.athletesCoached).toBe(2);
      expect(pageData.trackRecord.plansAuthored).toBe(1);
      expect(pageData.trackRecord.monthsActive).toBe(computeMonthsActive(createdAt, new Date()));
    });

    it("embeds credentials ordered by createdAt ascending", async () => {
      const pageData = await coachingCoachProfileApi.getPageData(scopedCoach.user.id);

      expect(pageData.credentials.map((c) => c.id)).toEqual([
        firstCredential.id,
        secondCredential.id,
      ]);
    });

    it("counts only non-deleted plans", async () => {
      const pageData = await coachingCoachProfileApi.getPageData(scopedCoach.user.id);

      expect(pageData.trackRecord.plansAuthored).toBe(1);
    });

    it("exposes the coach role and email read-only fields", async () => {
      const pageData = await coachingCoachProfileApi.getPageData(scopedCoach.user.id);

      expect(pageData.user.role).toBe(UserRole.COACH);
      expect(pageData.user.email).toBe(scopedCoach.user.email);
    });
  });

  describe("update", () => {
    let editCoach: Awaited<ReturnType<typeof createTestCoach>>;

    beforeAll(async () => {
      editCoach = await createTestCoach();
    });

    afterAll(async () => {
      await cleanup(
        { table: "coachProfile", id: editCoach.profile.id },
        { table: "user", id: editCoach.user.id },
      );
    });

    it("writes both User and CoachProfile fields in one update", async () => {
      const pageData = await coachingCoachProfileApi.update(editCoach.user.id, {
        name: "Updated Coach",
        timezone: "Europe/Kyiv",
        bio: "New bio",
        location: "Kyiv, UA",
        specialties: ["CrossFit", "Powerlifting"],
      });

      expect(pageData.user.name).toBe("Updated Coach");
      expect(pageData.user.timezone).toBe("Europe/Kyiv");
      expect(pageData.profile.bio).toBe("New bio");
      expect(pageData.profile.location).toBe("Kyiv, UA");
      expect(pageData.profile.specialties).toEqual(["CrossFit", "Powerlifting"]);
    });

    it("clears bio and location to null", async () => {
      const pageData = await coachingCoachProfileApi.update(editCoach.user.id, {
        bio: null,
        location: null,
      });

      expect(pageData.profile.bio).toBeNull();
      expect(pageData.profile.location).toBeNull();
    });

    it("never changes role or email", async () => {
      const before = await cleanupRaw.user.findUniqueOrThrow({
        where: { id: editCoach.user.id },
        select: { role: true, email: true },
      });

      await coachingCoachProfileApi.update(editCoach.user.id, { name: "Another Name" });

      const after = await cleanupRaw.user.findUniqueOrThrow({
        where: { id: editCoach.user.id },
        select: { role: true, email: true },
      });

      expect(after.role).toBe(before.role);
      expect(after.email).toBe(before.email);
    });
  });
});
