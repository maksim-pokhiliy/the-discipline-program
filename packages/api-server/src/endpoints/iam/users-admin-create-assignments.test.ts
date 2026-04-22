import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { BadRequestError, NotFoundError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import * as sendModule from "./send-invitation-email";
import { iamUserAdminApi } from "./users-admin";

describe("iamUserAdminApi — assignment logic", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  const sendSpy = vi
    .spyOn(sendModule, "sendInvitationEmail")
    .mockImplementation(async () => undefined);
  const configSpy = vi.spyOn(sendModule, "resolveInviteEmailConfig").mockImplementation(() => ({
    apiKey: "test-key",
    from: { email: "test@example.com" },
  }));

  beforeAll(async () => {
    adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
  });

  afterAll(async () => {
    await cleanupRaw.userInviteToken
      .deleteMany({ where: { createdByAdminId: adminUser.id } })
      .catch(() => undefined);
    await cleanup({ table: "user", id: adminUser.id });
    sendSpy.mockRestore();
    configSpy.mockRestore();
  });

  describe("createUser", () => {
    let coachA: Awaited<ReturnType<typeof createTestCoach>>;
    let coachB: Awaited<ReturnType<typeof createTestCoach>>;
    let softDeletedCoach: Awaited<ReturnType<typeof createTestCoach>>;

    beforeAll(async () => {
      coachA = await createTestCoach();
      coachB = await createTestCoach();
      softDeletedCoach = await createTestCoach();

      await cleanupRaw.coachProfile.update({
        where: { id: softDeletedCoach.profile.id },
        data: { deletedAt: new Date() },
      });
    });

    afterAll(async () => {
      await cleanup(
        { table: "user", id: coachA.user.id },
        { table: "user", id: coachB.user.id },
        { table: "user", id: softDeletedCoach.user.id },
      );
    });

    it("creates an ATHLETE with an empty coachIds array and zero assignment rows", async () => {
      const email = `athlete-${crypto.randomUUID()}@test.local`;

      const created = await iamUserAdminApi.createUser(adminUser.id, {
        email,
        name: "No Coach Athlete",
        role: UserRole.ATHLETE,
        timezone: "UTC",
        coachIds: [],
      });

      try {
        const count = await cleanupRaw.coachAthleteAssignment.count({
          where: { athleteId: created.id },
        });

        expect(count).toBe(0);

        const profile = await cleanupRaw.athleteProfile.findUnique({
          where: { userId: created.id },
        });

        expect(profile).not.toBeNull();
      } finally {
        await cleanupRaw.userInviteToken.deleteMany({ where: { userId: created.id } });
        await cleanup({ table: "user", id: created.id });
      }
    });

    it("creates an ATHLETE with one coach and writes a single assignment row", async () => {
      const email = `athlete-${crypto.randomUUID()}@test.local`;

      const created = await iamUserAdminApi.createUser(adminUser.id, {
        email,
        name: "One Coach Athlete",
        role: UserRole.ATHLETE,
        timezone: "UTC",
        coachIds: [coachA.profile.id],
      });

      try {
        const rows = await cleanupRaw.coachAthleteAssignment.findMany({
          where: { athleteId: created.id },
        });

        expect(rows).toHaveLength(1);
        expect(rows[0]?.coachId).toBe(coachA.profile.id);
        expect(rows[0]?.athleteId).toBe(created.id);
      } finally {
        await cleanupRaw.userInviteToken.deleteMany({ where: { userId: created.id } });
        await cleanup({ table: "user", id: created.id });
      }
    });

    it("creates an ATHLETE with two coaches and writes both assignment rows", async () => {
      const email = `athlete-${crypto.randomUUID()}@test.local`;

      const created = await iamUserAdminApi.createUser(adminUser.id, {
        email,
        name: "Two Coach Athlete",
        role: UserRole.ATHLETE,
        timezone: "UTC",
        coachIds: [coachA.profile.id, coachB.profile.id],
      });

      try {
        const rows = await cleanupRaw.coachAthleteAssignment.findMany({
          where: { athleteId: created.id },
        });

        expect(rows).toHaveLength(2);
        expect(rows.map((r) => r.coachId).sort()).toEqual(
          [coachA.profile.id, coachB.profile.id].sort(),
        );
      } finally {
        await cleanupRaw.userInviteToken.deleteMany({ where: { userId: created.id } });
        await cleanup({ table: "user", id: created.id });
      }
    });

    it("throws BadRequestError when coachIds are provided for a non-ATHLETE role", async () => {
      const email = `coach-${crypto.randomUUID()}@test.local`;

      await expect(
        iamUserAdminApi.createUser(adminUser.id, {
          email,
          name: "Misbehaving",
          role: UserRole.COACH,
          timezone: "UTC",
          coachIds: [coachA.profile.id],
        }),
      ).rejects.toThrow(BadRequestError);

      const leaked = await cleanupRaw.user.findUnique({ where: { email } });

      expect(leaked).toBeNull();
    });

    it("throws NotFoundError with missing details when a coachId does not exist", async () => {
      const email = `athlete-${crypto.randomUUID()}@test.local`;
      const ghost = "clmissing000000000000000000";

      try {
        await iamUserAdminApi.createUser(adminUser.id, {
          email,
          name: "Ghost Coach",
          role: UserRole.ATHLETE,
          timezone: "UTC",
          coachIds: [ghost],
        });

        throw new Error("Expected NotFoundError");
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        const details = (error as NotFoundError).details as { missing?: string[] } | undefined;

        expect(details?.missing).toContain(ghost);
      }

      const leaked = await cleanupRaw.user.findUnique({ where: { email } });

      expect(leaked).toBeNull();
    });

    it("throws NotFoundError when a soft-deleted coach id is referenced", async () => {
      const email = `athlete-${crypto.randomUUID()}@test.local`;

      await expect(
        iamUserAdminApi.createUser(adminUser.id, {
          email,
          name: "Soft Deleted Coach Target",
          role: UserRole.ATHLETE,
          timezone: "UTC",
          coachIds: [softDeletedCoach.profile.id],
        }),
      ).rejects.toThrow(NotFoundError);

      const leaked = await cleanupRaw.user.findUnique({ where: { email } });

      expect(leaked).toBeNull();
    });
  });
});
