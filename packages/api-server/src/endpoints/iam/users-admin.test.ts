import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { ConflictError, ForbiddenError, NotFoundError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestUser } from "../../test/helpers";

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

  describe("updateUser", () => {
    it("updates name and timezone without bumping tokenVersion when role is unchanged", async () => {
      const target = await createTestUser({ timezone: "UTC" });
      const before = await cleanupRaw.user.findUnique({ where: { id: target.id } });

      try {
        const updated = await iamUserAdminApi.updateUser(adminUser.id, target.id, {
          name: "Changed Name",
          timezone: "Europe/Kiev",
        });

        expect(updated.name).toBe("Changed Name");
        expect(updated.timezone).toBe("Europe/Kiev");

        const after = await cleanupRaw.user.findUnique({ where: { id: target.id } });

        expect(after?.tokenVersion).toBe(before?.tokenVersion);
      } finally {
        await cleanup({ table: "user", id: target.id });
      }
    });

    it("bumps tokenVersion when role changes", async () => {
      const target = await createTestUser();
      const before = await cleanupRaw.user.findUnique({ where: { id: target.id } });

      try {
        await iamUserAdminApi.updateUser(adminUser.id, target.id, {
          role: UserRole.COACH,
        });

        const after = await cleanupRaw.user.findUnique({ where: { id: target.id } });

        expect(after?.tokenVersion).toBe((before?.tokenVersion ?? 0) + 1);
      } finally {
        await cleanup({ table: "user", id: target.id });
      }
    });

    it("throws ForbiddenError when an admin self-demotes", async () => {
      const selfAdmin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });

      try {
        await expect(
          iamUserAdminApi.updateUser(selfAdmin.id, selfAdmin.id, { role: UserRole.USER }),
        ).rejects.toThrow(ForbiddenError);
      } finally {
        await cleanup({ table: "user", id: selfAdmin.id });
      }
    });

    it("throws ConflictError when demoting the last admin (acting as a different actor)", async () => {
      const soloAdmin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });

      const allAdmins = (await iamUserAdminApi.getAll()).filter(
        (u) => u.role === UserRole.ADMIN && u.id !== soloAdmin.id,
      );

      for (const other of allAdmins) {
        await iamUserAdminApi.updateRole(soloAdmin.id, other.id, { role: UserRole.USER });
      }

      try {
        await expect(
          iamUserAdminApi.updateUser(adminUser.id, soloAdmin.id, { role: UserRole.USER }),
        ).rejects.toThrow(ConflictError);
      } finally {
        for (const other of allAdmins) {
          await iamUserAdminApi.updateRole(soloAdmin.id, other.id, { role: UserRole.ADMIN });
        }

        await cleanup({ table: "user", id: soloAdmin.id });
      }
    });

    it("throws NotFoundError for a non-existent id", async () => {
      await expect(
        iamUserAdminApi.updateUser(adminUser.id, crypto.randomUUID(), { name: "x" }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteUser", () => {
    it("soft-deletes the user: deletedAt, email suffix, tokenVersion increment — all in one update", async () => {
      const target = await createTestUser();
      const before = await cleanupRaw.user.findUnique({ where: { id: target.id } });
      const originalEmail = target.email;

      await iamUserAdminApi.deleteUser(adminUser.id, target.id);

      const after = await cleanupRaw.user.findUnique({ where: { id: target.id } });

      expect(after?.deletedAt).not.toBeNull();
      expect(after?.email).not.toBe(originalEmail);
      expect(after?.email).toContain(originalEmail);
      expect(after?.email).toContain("_deleted_");
      expect(after?.tokenVersion).toBe((before?.tokenVersion ?? 0) + 1);

      await cleanupRaw.user.delete({ where: { id: target.id } });
    });

    it("throws ForbiddenError when actor attempts to delete themselves", async () => {
      await expect(iamUserAdminApi.deleteUser(adminUser.id, adminUser.id)).rejects.toThrow(
        ForbiddenError,
      );
    });

    it("throws ConflictError when deleting the last admin", async () => {
      const soloAdmin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });

      const allAdmins = (await iamUserAdminApi.getAll()).filter(
        (u) => u.role === UserRole.ADMIN && u.id !== soloAdmin.id,
      );

      for (const other of allAdmins) {
        await iamUserAdminApi.updateRole(soloAdmin.id, other.id, { role: UserRole.USER });
      }

      try {
        await expect(iamUserAdminApi.deleteUser(adminUser.id, soloAdmin.id)).rejects.toThrow(
          ConflictError,
        );
      } finally {
        for (const other of allAdmins) {
          await iamUserAdminApi.updateRole(soloAdmin.id, other.id, { role: UserRole.ADMIN });
        }

        await cleanup({ table: "user", id: soloAdmin.id });
      }
    });

    it("throws NotFoundError for a non-existent id", async () => {
      await expect(iamUserAdminApi.deleteUser(adminUser.id, crypto.randomUUID())).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
