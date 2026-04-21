import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { cleanup, cleanupRaw, createTestCoach } from "../../test/helpers";

import { iamAdminCoachListApi } from "./admin-coach-list";

describe("iamAdminCoachListApi", () => {
  const marker = crypto.randomUUID().slice(0, 8);

  let aliceCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let bobCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let nullNameCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let softDeletedCoach: Awaited<ReturnType<typeof createTestCoach>>;

  beforeAll(async () => {
    aliceCoach = await createTestCoach();
    await cleanupRaw.user.update({
      where: { id: aliceCoach.user.id },
      data: { name: `Alice ${marker}`, email: `alice-${marker}@test.local` },
    });

    bobCoach = await createTestCoach();
    await cleanupRaw.user.update({
      where: { id: bobCoach.user.id },
      data: { name: `Bob ${marker}`, email: `bob-${marker}@test.local` },
    });

    nullNameCoach = await createTestCoach();
    await cleanupRaw.user.update({
      where: { id: nullNameCoach.user.id },
      data: { name: null, email: `zzz-${marker}@test.local` },
    });

    softDeletedCoach = await createTestCoach();
    await cleanupRaw.user.update({
      where: { id: softDeletedCoach.user.id },
      data: { name: `Soft-Deleted ${marker}`, email: `soft-${marker}@test.local` },
    });
    await cleanupRaw.coachProfile.update({
      where: { id: softDeletedCoach.profile.id },
      data: { deletedAt: new Date() },
    });
  });

  afterAll(async () => {
    await cleanup(
      { table: "user", id: aliceCoach.user.id },
      { table: "user", id: bobCoach.user.id },
      { table: "user", id: nullNameCoach.user.id },
      { table: "user", id: softDeletedCoach.user.id },
    );
  });

  describe("getAll", () => {
    it("returns coaches ordered by user name asc then email asc", async () => {
      const coaches = await iamAdminCoachListApi.getAll();

      const seeded = coaches.filter((c) =>
        [aliceCoach.profile.id, bobCoach.profile.id, nullNameCoach.profile.id].includes(c.id),
      );

      expect(seeded.map((c) => c.id)).toEqual([
        aliceCoach.profile.id,
        bobCoach.profile.id,
        nullNameCoach.profile.id,
      ]);
    });

    it("excludes soft-deleted coach profiles", async () => {
      const coaches = await iamAdminCoachListApi.getAll();

      expect(coaches.some((c) => c.id === softDeletedCoach.profile.id)).toBe(false);
    });

    it("returns CoachListItem shape with id, userId, name, email per entry", async () => {
      const coaches = await iamAdminCoachListApi.getAll();

      const alice = coaches.find((c) => c.id === aliceCoach.profile.id);

      expect(alice).toBeDefined();
      expect(alice?.id).toBe(aliceCoach.profile.id);
      expect(alice?.userId).toBe(aliceCoach.user.id);
      expect(alice?.name).toBe(`Alice ${marker}`);
      expect(alice?.email).toBe(`alice-${marker}@test.local`);
    });
  });
});
