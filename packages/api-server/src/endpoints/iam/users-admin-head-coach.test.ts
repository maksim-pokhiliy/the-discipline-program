import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { ConflictError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

import { iamUserAdminApi } from "./users-admin";

describe("iamUserAdminApi — HEAD_COACH single-occupancy", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
  });

  afterAll(async () => {
    await cleanup({ table: "user", id: adminUser.id });
  });

  it("throws ConflictError when setting HEAD_COACH if another HEAD_COACH already exists", async () => {
    const headCoachA = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });
    const userB = await createTestUser();

    try {
      await expect(
        iamUserAdminApi.updateRole(adminUser.id, userB.id, { role: UserRole.HEAD_COACH }),
      ).rejects.toThrow(ConflictError);
    } finally {
      await cleanupRaw.user.update({
        where: { id: headCoachA.id },
        data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
      });
      await cleanup({ table: "user", id: headCoachA.id }, { table: "user", id: userB.id });
    }
  });

  it("allows idempotent self-update when user is already HEAD_COACH", async () => {
    const headCoachA = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] });

    const preexisting = await cleanupRaw.user.findMany({
      where: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH], NOT: { id: headCoachA.id } },
      select: { id: true },
    });

    for (const hc of preexisting) {
      await cleanupRaw.user.update({
        where: { id: hc.id },
        data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
      });
    }

    try {
      const updated = await iamUserAdminApi.updateRole(adminUser.id, headCoachA.id, {
        role: UserRole.HEAD_COACH,
      });

      expect(updated.role).toBe(UserRole.HEAD_COACH);
    } finally {
      await cleanupRaw.user.update({
        where: { id: headCoachA.id },
        data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
      });
      await cleanup({ table: "user", id: headCoachA.id });
    }
  });

  it("allows setting HEAD_COACH when no HEAD_COACH currently exists", async () => {
    const userB = await createTestUser();

    const preexisting = await cleanupRaw.user.findMany({
      where: { role: ROLE_TO_PRISMA_MAP[UserRole.HEAD_COACH] },
      select: { id: true },
    });

    for (const hc of preexisting) {
      await cleanupRaw.user.update({
        where: { id: hc.id },
        data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
      });
    }

    try {
      const updated = await iamUserAdminApi.updateRole(adminUser.id, userB.id, {
        role: UserRole.HEAD_COACH,
      });

      expect(updated.role).toBe(UserRole.HEAD_COACH);
    } finally {
      await cleanupRaw.user.update({
        where: { id: userB.id },
        data: { role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] },
      });
      await cleanup({ table: "user", id: userB.id });
    }
  });
});
