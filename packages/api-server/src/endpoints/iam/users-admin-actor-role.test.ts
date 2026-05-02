import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { ForbiddenError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

import { iamUserAdminApi } from "./users-admin";

describe("iamUserAdminApi — actor must be ADMIN for role-mutation paths", () => {
  let headCoachActor: Awaited<ReturnType<typeof createTestUser>>;
  let coachActor: Awaited<ReturnType<typeof createTestUser>>;
  let athleteActor: Awaited<ReturnType<typeof createTestUser>>;
  let targetUser: Awaited<ReturnType<typeof createTestUser>>;
  let targetAdmin: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    const preexistingHC = await cleanupRaw.user.findMany({
      where: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] },
      select: { id: true },
    });

    for (const hc of preexistingHC) {
      await cleanupRaw.user.update({
        where: { id: hc.id },
        data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
      });
    }

    headCoachActor = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });
    coachActor = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.COACH] });
    athleteActor = await createTestUser();
    targetUser = await createTestUser();
    targetAdmin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
  });

  afterAll(async () => {
    await cleanup(
      { table: "user", id: headCoachActor.id },
      { table: "user", id: coachActor.id },
      { table: "user", id: athleteActor.id },
      { table: "user", id: targetUser.id },
      { table: "user", id: targetAdmin.id },
    );
  });

  describe("updateUser", () => {
    it("rejects HEAD_COACH actor attempting to self-promote to ADMIN", async () => {
      await expect(
        iamUserAdminApi.updateUser(headCoachActor.id, headCoachActor.id, {
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenError);

      const after = await cleanupRaw.user.findUnique({
        where: { id: headCoachActor.id },
        select: { role: true },
      });

      expect(after?.role).toBe(ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH]);
    });

    it("rejects HEAD_COACH actor attempting to promote another user to ADMIN", async () => {
      await expect(
        iamUserAdminApi.updateUser(headCoachActor.id, targetUser.id, {
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenError);

      const after = await cleanupRaw.user.findUnique({
        where: { id: targetUser.id },
        select: { role: true },
      });

      expect(after?.role).toBe(ROLE_TO_PRISMA_MAP[UserRole.ATHLETE]);
    });

    it("rejects COACH actor attempting non-role updates", async () => {
      await expect(
        iamUserAdminApi.updateUser(coachActor.id, targetUser.id, { name: "Mutated" }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("rejects ATHLETE actor attempting role mutation", async () => {
      await expect(
        iamUserAdminApi.updateUser(athleteActor.id, targetUser.id, {
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("updateRole", () => {
    it("rejects HEAD_COACH actor attempting to self-promote to ADMIN", async () => {
      await expect(
        iamUserAdminApi.updateRole(headCoachActor.id, headCoachActor.id, {
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenError);

      const after = await cleanupRaw.user.findUnique({
        where: { id: headCoachActor.id },
        select: { role: true },
      });

      expect(after?.role).toBe(ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH]);
    });

    it("rejects HEAD_COACH actor attempting to promote another user to ADMIN", async () => {
      await expect(
        iamUserAdminApi.updateRole(headCoachActor.id, targetUser.id, {
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenError);
    });

    it("rejects COACH actor", async () => {
      await expect(
        iamUserAdminApi.updateRole(coachActor.id, targetUser.id, {
          role: UserRole.ADMIN,
        }),
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe("deleteUser", () => {
    it("rejects HEAD_COACH actor attempting to delete an ADMIN", async () => {
      await expect(iamUserAdminApi.deleteUser(headCoachActor.id, targetAdmin.id)).rejects.toThrow(
        ForbiddenError,
      );

      const after = await cleanupRaw.user.findUnique({
        where: { id: targetAdmin.id },
        select: { deletedAt: true },
      });

      expect(after?.deletedAt).toBeNull();
    });

    it("rejects HEAD_COACH actor attempting to delete a non-admin", async () => {
      await expect(iamUserAdminApi.deleteUser(headCoachActor.id, targetUser.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("rejects COACH actor", async () => {
      await expect(iamUserAdminApi.deleteUser(coachActor.id, targetUser.id)).rejects.toThrow(
        ForbiddenError,
      );
    });
  });
});
