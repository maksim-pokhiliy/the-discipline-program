import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { NotFoundError } from "@repo/errors";

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

  describe("updateUser", () => {
    let coachA: Awaited<ReturnType<typeof createTestCoach>>;
    let coachB: Awaited<ReturnType<typeof createTestCoach>>;
    let coachC: Awaited<ReturnType<typeof createTestCoach>>;

    beforeAll(async () => {
      coachA = await createTestCoach();
      coachB = await createTestCoach();
      coachC = await createTestCoach();
    });

    afterAll(async () => {
      await cleanup(
        { table: "user", id: coachA.user.id },
        { table: "user", id: coachB.user.id },
        { table: "user", id: coachC.user.id },
      );
    });

    const createAthleteWithCoaches = async (coachIds: string[]) => {
      const email = `athlete-${crypto.randomUUID()}@test.local`;

      return iamUserAdminApi.createUser(adminUser.id, {
        email,
        name: "Assignment Test Athlete",
        role: UserRole.ATHLETE,
        timezone: "UTC",
        coachIds,
      });
    };

    const cleanupAthlete = async (athleteId: string) => {
      await cleanupRaw.userInviteToken.deleteMany({ where: { userId: athleteId } }).catch(() => {});
      await cleanup({ table: "user", id: athleteId });
    };

    it("leaves assignments untouched when coachIds is undefined", async () => {
      const athlete = await createAthleteWithCoaches([coachA.profile.id, coachB.profile.id]);

      try {
        const before = await cleanupRaw.coachAthleteAssignment.count({
          where: { athleteId: athlete.id },
        });

        await iamUserAdminApi.updateUser(adminUser.id, athlete.id, { name: "New Name" });

        const after = await cleanupRaw.coachAthleteAssignment.count({
          where: { athleteId: athlete.id },
        });

        expect(after).toBe(before);
      } finally {
        await cleanupAthlete(athlete.id);
      }
    });

    it("removes all assignments when coachIds is an empty array", async () => {
      const athlete = await createAthleteWithCoaches([coachA.profile.id, coachB.profile.id]);

      try {
        await iamUserAdminApi.updateUser(adminUser.id, athlete.id, { coachIds: [] });

        const count = await cleanupRaw.coachAthleteAssignment.count({
          where: { athleteId: athlete.id },
        });

        expect(count).toBe(0);
      } finally {
        await cleanupAthlete(athlete.id);
      }
    });

    it("applies an add-only diff ({A} -> {A, B})", async () => {
      const athlete = await createAthleteWithCoaches([coachA.profile.id]);

      try {
        await iamUserAdminApi.updateUser(adminUser.id, athlete.id, {
          coachIds: [coachA.profile.id, coachB.profile.id],
        });

        const rows = await cleanupRaw.coachAthleteAssignment.findMany({
          where: { athleteId: athlete.id },
        });

        expect(rows.map((r) => r.coachId).sort()).toEqual(
          [coachA.profile.id, coachB.profile.id].sort(),
        );
      } finally {
        await cleanupAthlete(athlete.id);
      }
    });

    it("applies a remove-only diff ({A, B} -> {A})", async () => {
      const athlete = await createAthleteWithCoaches([coachA.profile.id, coachB.profile.id]);

      try {
        await iamUserAdminApi.updateUser(adminUser.id, athlete.id, {
          coachIds: [coachA.profile.id],
        });

        const rows = await cleanupRaw.coachAthleteAssignment.findMany({
          where: { athleteId: athlete.id },
        });

        expect(rows).toHaveLength(1);
        expect(rows[0]?.coachId).toBe(coachA.profile.id);
      } finally {
        await cleanupAthlete(athlete.id);
      }
    });

    it("applies a mixed diff ({A, B} -> {B, C})", async () => {
      const athlete = await createAthleteWithCoaches([coachA.profile.id, coachB.profile.id]);

      try {
        await iamUserAdminApi.updateUser(adminUser.id, athlete.id, {
          coachIds: [coachB.profile.id, coachC.profile.id],
        });

        const rows = await cleanupRaw.coachAthleteAssignment.findMany({
          where: { athleteId: athlete.id },
        });

        expect(rows.map((r) => r.coachId).sort()).toEqual(
          [coachB.profile.id, coachC.profile.id].sort(),
        );
      } finally {
        await cleanupAthlete(athlete.id);
      }
    });

    it("hard-deletes all assignments when an athlete is transitioned to COACH", async () => {
      const athlete = await createAthleteWithCoaches([coachA.profile.id, coachB.profile.id]);

      try {
        await iamUserAdminApi.updateUser(adminUser.id, athlete.id, { role: UserRole.COACH });

        const count = await cleanupRaw.coachAthleteAssignment.count({
          where: { athleteId: athlete.id },
        });

        expect(count).toBe(0);
      } finally {
        await cleanupAthlete(athlete.id);
      }
    });

    it("upserts athleteProfile with no assignments when COACH -> ATHLETE without coachIds", async () => {
      const coachTarget = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.COACH] });

      try {
        await iamUserAdminApi.updateUser(adminUser.id, coachTarget.id, {
          role: UserRole.ATHLETE,
        });

        const profile = await cleanupRaw.athleteProfile.findUnique({
          where: { userId: coachTarget.id },
        });
        const count = await cleanupRaw.coachAthleteAssignment.count({
          where: { athleteId: coachTarget.id },
        });

        expect(profile).not.toBeNull();
        expect(count).toBe(0);
      } finally {
        await cleanupRaw.athleteProfile
          .delete({ where: { userId: coachTarget.id } })
          .catch(() => {});
        await cleanup({ table: "user", id: coachTarget.id });
      }
    });

    it("upserts athleteProfile and writes one assignment when COACH -> ATHLETE with coachIds=[A]", async () => {
      const coachTarget = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.COACH] });

      try {
        await iamUserAdminApi.updateUser(adminUser.id, coachTarget.id, {
          role: UserRole.ATHLETE,
          coachIds: [coachA.profile.id],
        });

        const profile = await cleanupRaw.athleteProfile.findUnique({
          where: { userId: coachTarget.id },
        });
        const rows = await cleanupRaw.coachAthleteAssignment.findMany({
          where: { athleteId: coachTarget.id },
        });

        expect(profile).not.toBeNull();
        expect(rows).toHaveLength(1);
        expect(rows[0]?.coachId).toBe(coachA.profile.id);
      } finally {
        await cleanupRaw.coachAthleteAssignment
          .deleteMany({ where: { athleteId: coachTarget.id } })
          .catch(() => {});
        await cleanupRaw.athleteProfile
          .delete({ where: { userId: coachTarget.id } })
          .catch(() => {});
        await cleanup({ table: "user", id: coachTarget.id });
      }
    });

    it("throws NotFoundError for an unknown coachId and rolls back user changes", async () => {
      const athlete = await createAthleteWithCoaches([coachA.profile.id]);
      const ghost = "clmissing000000000000000000";
      const before = await cleanupRaw.user.findUnique({ where: { id: athlete.id } });

      try {
        await expect(
          iamUserAdminApi.updateUser(adminUser.id, athlete.id, {
            name: "Should Not Persist",
            coachIds: [ghost],
          }),
        ).rejects.toThrow(NotFoundError);

        const after = await cleanupRaw.user.findUnique({ where: { id: athlete.id } });

        expect(after?.name).toBe(before?.name);

        const rows = await cleanupRaw.coachAthleteAssignment.findMany({
          where: { athleteId: athlete.id },
        });

        expect(rows.map((r) => r.coachId)).toEqual([coachA.profile.id]);
      } finally {
        await cleanupAthlete(athlete.id);
      }
    });

    it("dedupes coachIds so a duplicated id creates exactly one row", async () => {
      const athlete = await createAthleteWithCoaches([]);

      try {
        await iamUserAdminApi.updateUser(adminUser.id, athlete.id, {
          coachIds: [coachA.profile.id, coachA.profile.id],
        });

        const rows = await cleanupRaw.coachAthleteAssignment.findMany({
          where: { athleteId: athlete.id },
        });

        expect(rows).toHaveLength(1);
        expect(rows[0]?.coachId).toBe(coachA.profile.id);
      } finally {
        await cleanupAthlete(athlete.id);
      }
    });

    it("soft-deletes CoachProfile and drops coach-side assignments when COACH -> ATHLETE", async () => {
      const demoted = await createTestCoach();
      const athlete = await createAthleteWithCoaches([demoted.profile.id]);

      try {
        await iamUserAdminApi.updateUser(adminUser.id, demoted.user.id, {
          role: UserRole.ATHLETE,
        });

        const profile = await cleanupRaw.coachProfile.findUnique({
          where: { id: demoted.profile.id },
        });
        const coachSideAssignments = await cleanupRaw.coachAthleteAssignment.count({
          where: { coachId: demoted.profile.id },
        });

        expect(profile?.deletedAt).toBeInstanceOf(Date);
        expect(coachSideAssignments).toBe(0);
      } finally {
        await cleanupRaw.coachAthleteAssignment
          .deleteMany({ where: { athleteId: athlete.id } })
          .catch(() => {});
        await cleanupRaw.athleteProfile
          .delete({ where: { userId: demoted.user.id } })
          .catch(() => {});
        await cleanupRaw.coachProfile.delete({ where: { id: demoted.profile.id } }).catch(() => {});
        await cleanupAthlete(athlete.id);
        await cleanup({ table: "user", id: demoted.user.id });
      }
    });

    it("soft-deletes CoachProfile and drops coach-side assignments when COACH -> ADMIN", async () => {
      const demoted = await createTestCoach();
      const athlete = await createAthleteWithCoaches([demoted.profile.id]);

      try {
        await iamUserAdminApi.updateUser(adminUser.id, demoted.user.id, {
          role: UserRole.ADMIN,
        });

        const profile = await cleanupRaw.coachProfile.findUnique({
          where: { id: demoted.profile.id },
        });
        const coachSideAssignments = await cleanupRaw.coachAthleteAssignment.count({
          where: { coachId: demoted.profile.id },
        });

        expect(profile?.deletedAt).toBeInstanceOf(Date);
        expect(coachSideAssignments).toBe(0);
      } finally {
        await cleanupRaw.coachProfile.delete({ where: { id: demoted.profile.id } }).catch(() => {});
        await cleanupAthlete(athlete.id);
        await cleanup({ table: "user", id: demoted.user.id });
      }
    });

    it("leaves CoachProfile intact when a COACH is updated with role unchanged", async () => {
      const coachTarget = await createTestCoach();

      try {
        await iamUserAdminApi.updateUser(adminUser.id, coachTarget.user.id, {
          name: "Renamed Coach",
        });

        const profile = await cleanupRaw.coachProfile.findUnique({
          where: { id: coachTarget.profile.id },
        });

        expect(profile?.deletedAt).toBeNull();
      } finally {
        await cleanupRaw.coachProfile
          .delete({ where: { id: coachTarget.profile.id } })
          .catch(() => {});
        await cleanup({ table: "user", id: coachTarget.user.id });
      }
    });
  });
});
