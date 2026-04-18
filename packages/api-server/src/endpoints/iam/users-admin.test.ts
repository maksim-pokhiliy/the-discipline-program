import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { ConflictError, NotFoundError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, createTestUser } from "../../test/helpers";

import { iamUserAdminApi } from "./users-admin";

describe("iamUserAdminApi", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let coachUser: Awaited<ReturnType<typeof createTestUser>>;
  let regularUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
    coachUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.COACH] });
    regularUser = await createTestUser();
  });

  afterAll(async () => {
    await cleanup(
      { table: "user", id: adminUser.id },
      { table: "user", id: coachUser.id },
      { table: "user", id: regularUser.id },
    );
  });

  describe("getAll", () => {
    it("returns all users with mapped roles", async () => {
      const users = await iamUserAdminApi.getAll();

      const testIds = [adminUser.id, coachUser.id, regularUser.id];
      const testUsers = users.filter((u) => testIds.includes(u.id));

      expect(testUsers).toHaveLength(3);

      const admin = testUsers.find((u) => u.id === adminUser.id);
      const coach = testUsers.find((u) => u.id === coachUser.id);
      const regular = testUsers.find((u) => u.id === regularUser.id);

      expect(admin?.role).toBe(UserRole.ADMIN);
      expect(coach?.role).toBe(UserRole.COACH);
      expect(regular?.role).toBe(UserRole.USER);
    });

    it("returns users ordered by createdAt desc", async () => {
      const users = await iamUserAdminApi.getAll();

      const testIds = [adminUser.id, coachUser.id, regularUser.id];
      const testUsers = users.filter((u) => testIds.includes(u.id));

      const createdAtTimestamps = testUsers.map((u) => u.createdAt.getTime());

      for (let i = 0; i < createdAtTimestamps.length - 1; i++) {
        const current = createdAtTimestamps[i] ?? 0;
        const next = createdAtTimestamps[i + 1] ?? 0;

        expect(current).toBeGreaterThanOrEqual(next);
      }
    });
  });

  describe("getPageData", () => {
    it("returns users wrapped in page data response", async () => {
      const pageData = await iamUserAdminApi.getPageData();

      expect(pageData).toHaveProperty("users");
      expect(Array.isArray(pageData.users)).toBe(true);

      const testUser = pageData.users.find((u) => u.id === regularUser.id);

      expect(testUser).toBeDefined();
      expect(testUser?.email).toBe(regularUser.email);
    });
  });

  describe("updateRole", () => {
    it("changes user role from USER to COACH", async () => {
      const updated = await iamUserAdminApi.updateRole(adminUser.id, regularUser.id, {
        role: UserRole.COACH,
      });

      expect(updated.role).toBe(UserRole.COACH);
      expect(updated.id).toBe(regularUser.id);

      await iamUserAdminApi.updateRole(adminUser.id, regularUser.id, { role: UserRole.USER });
    });

    it("throws NotFoundError for non-existent user", async () => {
      const fakeId = crypto.randomUUID();

      await expect(
        iamUserAdminApi.updateRole(adminUser.id, fakeId, { role: UserRole.ADMIN }),
      ).rejects.toThrow(NotFoundError);
    });

    it("throws ConflictError when demoting the last admin", async () => {
      const soloAdmin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });

      const allUsers = await iamUserAdminApi.getAll();
      const admins = allUsers.filter((u) => u.role === UserRole.ADMIN);

      const otherAdminIds = admins.filter((a) => a.id !== soloAdmin.id).map((a) => a.id);

      for (const id of otherAdminIds) {
        await iamUserAdminApi.updateRole(soloAdmin.id, id, { role: UserRole.USER });
      }

      try {
        await expect(
          iamUserAdminApi.updateRole(adminUser.id, soloAdmin.id, { role: UserRole.USER }),
        ).rejects.toThrow(ConflictError);
      } finally {
        for (const id of otherAdminIds) {
          await iamUserAdminApi.updateRole(soloAdmin.id, id, { role: UserRole.ADMIN });
        }

        await cleanup({ table: "user", id: soloAdmin.id });
      }
    });

    it("allows demoting admin when other admins exist", async () => {
      const secondAdmin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });

      try {
        const updated = await iamUserAdminApi.updateRole(secondAdmin.id, adminUser.id, {
          role: UserRole.USER,
        });

        expect(updated.role).toBe(UserRole.USER);
      } finally {
        await iamUserAdminApi.updateRole(secondAdmin.id, adminUser.id, { role: UserRole.ADMIN });
        await cleanup({ table: "user", id: secondAdmin.id });
      }
    });
  });
});
