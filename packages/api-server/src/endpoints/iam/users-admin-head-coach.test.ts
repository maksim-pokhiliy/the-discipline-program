import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { ConflictError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { releaseHeadCoachSlotAfter, takeHeadCoachSlot } from "../../test/head-coach-slot";
import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

import { iamUserAdminApi } from "./users-admin";

const setRole = async (userId: string, role: UserRole): Promise<void> => {
  await cleanupRaw.user.update({ where: { id: userId }, data: { role: ROLE_TO_PRISMA_MAP[role] } });
};

describe("iamUserAdminApi — HEAD_COACH single-occupancy", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
  });

  afterAll(async () => {
    await cleanup({ table: "user", id: adminUser.id });
  });

  it("throws ConflictError when setting HEAD_COACH if another HEAD_COACH already exists", async () => {
    const headCoachA = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.COACH] });
    const userB = await createTestUser();
    const headCoachSlot = await takeHeadCoachSlot();

    try {
      await setRole(headCoachA.id, UserRole.HEAD_COACH);

      await expect(
        iamUserAdminApi.updateRole(adminUser.id, userB.id, { role: UserRole.HEAD_COACH }),
      ).rejects.toThrow(ConflictError);
    } finally {
      await releaseHeadCoachSlotAfter(headCoachSlot, async () => {
        await setRole(headCoachA.id, UserRole.COACH);
        await cleanup({ table: "user", id: headCoachA.id }, { table: "user", id: userB.id });
      });
    }
  });

  it("allows idempotent self-update when user is already HEAD_COACH", async () => {
    const headCoachA = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.COACH] });
    const headCoachSlot = await takeHeadCoachSlot();

    try {
      await setRole(headCoachA.id, UserRole.HEAD_COACH);

      const updated = await iamUserAdminApi.updateRole(adminUser.id, headCoachA.id, {
        role: UserRole.HEAD_COACH,
      });

      expect(updated.role).toBe(UserRole.HEAD_COACH);
    } finally {
      await releaseHeadCoachSlotAfter(headCoachSlot, async () => {
        await setRole(headCoachA.id, UserRole.COACH);
        await cleanup({ table: "user", id: headCoachA.id });
      });
    }
  });

  it("allows setting HEAD_COACH when no HEAD_COACH currently exists", async () => {
    const userB = await createTestUser();
    const headCoachSlot = await takeHeadCoachSlot();

    try {
      const updated = await iamUserAdminApi.updateRole(adminUser.id, userB.id, {
        role: UserRole.HEAD_COACH,
      });

      expect(updated.role).toBe(UserRole.HEAD_COACH);
    } finally {
      await releaseHeadCoachSlotAfter(headCoachSlot, async () => {
        await setRole(userB.id, UserRole.ATHLETE);
        await cleanup({ table: "user", id: userB.id });
      });
    }
  });
});
