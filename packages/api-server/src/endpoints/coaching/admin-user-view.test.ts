import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import { coachingAdminUserViewApi } from "./admin-user-view";

describe("coachingAdminUserViewApi", () => {
  const marker = crypto.randomUUID().slice(0, 8);

  let alphaCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let betaCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let deletedCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let athleteWithTwo: Awaited<ReturnType<typeof createTestUser>>;
  let athleteEmpty: Awaited<ReturnType<typeof createTestUser>>;
  let athleteSoftDeletedCoach: Awaited<ReturnType<typeof createTestUser>>;
  let coachUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    alphaCoach = await createTestCoach();
    await cleanupRaw.user.update({
      where: { id: alphaCoach.user.id },
      data: { name: `Alpha ${marker}`, email: `alpha-${marker}@test.local` },
    });

    betaCoach = await createTestCoach();
    await cleanupRaw.user.update({
      where: { id: betaCoach.user.id },
      data: { name: `Beta ${marker}`, email: `beta-${marker}@test.local` },
    });

    deletedCoach = await createTestCoach();
    await cleanupRaw.user.update({
      where: { id: deletedCoach.user.id },
      data: { name: `Deleted ${marker}`, email: `deleted-${marker}@test.local` },
    });
    await cleanupRaw.coachProfile.update({
      where: { id: deletedCoach.profile.id },
      data: { deletedAt: new Date() },
    });

    athleteWithTwo = await createTestUser();
    await cleanupRaw.athleteProfile.create({ data: { userId: athleteWithTwo.id } });
    await cleanupRaw.coachAthleteAssignment.createMany({
      data: [
        { coachId: alphaCoach.profile.id, athleteId: athleteWithTwo.id },
        { coachId: betaCoach.profile.id, athleteId: athleteWithTwo.id },
      ],
    });

    athleteEmpty = await createTestUser();
    await cleanupRaw.athleteProfile.create({ data: { userId: athleteEmpty.id } });

    athleteSoftDeletedCoach = await createTestUser();
    await cleanupRaw.athleteProfile.create({ data: { userId: athleteSoftDeletedCoach.id } });
    await cleanupRaw.coachAthleteAssignment.create({
      data: {
        coachId: deletedCoach.profile.id,
        athleteId: athleteSoftDeletedCoach.id,
      },
    });

    coachUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.COACH] });
    await cleanupRaw.coachProfile.create({ data: { userId: coachUser.id } });
  });

  afterAll(async () => {
    await cleanupRaw.coachAthleteAssignment
      .deleteMany({
        where: {
          athleteId: {
            in: [athleteWithTwo.id, athleteEmpty.id, athleteSoftDeletedCoach.id],
          },
        },
      })
      .catch(() => {});

    await cleanupRaw.athleteProfile
      .deleteMany({
        where: {
          userId: { in: [athleteWithTwo.id, athleteEmpty.id, athleteSoftDeletedCoach.id] },
        },
      })
      .catch(() => {});

    await cleanupRaw.coachProfile.deleteMany({ where: { userId: coachUser.id } }).catch(() => {});

    await cleanup(
      { table: "user", id: alphaCoach.user.id },
      { table: "user", id: betaCoach.user.id },
      { table: "user", id: deletedCoach.user.id },
      { table: "user", id: athleteWithTwo.id },
      { table: "user", id: athleteEmpty.id },
      { table: "user", id: athleteSoftDeletedCoach.id },
      { table: "user", id: coachUser.id },
    );
  });

  describe("getById", () => {
    it("returns assignedCoaches ordered by coach name asc for an athlete with two assignments", async () => {
      const view = await coachingAdminUserViewApi.getById(athleteWithTwo.id);

      expect(view.athleteProfile).not.toBeNull();
      expect(view.athleteProfile?.assignedCoaches.map((c) => c.id)).toEqual([
        alphaCoach.profile.id,
        betaCoach.profile.id,
      ]);
    });

    it("returns an empty assignedCoaches array for an athlete with no assignments", async () => {
      const view = await coachingAdminUserViewApi.getById(athleteEmpty.id);

      expect(view.athleteProfile).not.toBeNull();
      expect(view.athleteProfile?.assignedCoaches).toEqual([]);
    });

    it("filters out assignments referencing a soft-deleted coach", async () => {
      const view = await coachingAdminUserViewApi.getById(athleteSoftDeletedCoach.id);

      expect(view.athleteProfile).not.toBeNull();
      expect(view.athleteProfile?.assignedCoaches).toEqual([]);
    });

    it("returns athleteProfile: null with no assignedCoaches leaked for a COACH user", async () => {
      const view = await coachingAdminUserViewApi.getById(coachUser.id);

      expect(view.athleteProfile).toBeNull();
      expect(view).not.toHaveProperty("assignedCoaches");
    });
  });
});
