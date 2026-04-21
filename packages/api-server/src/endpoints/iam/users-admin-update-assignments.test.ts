import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { baseEnv } from "@repo/env/base";
import { NotFoundError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import { iamUserAdminApi } from "./users-admin";

type MutableBaseEnv = { FEATURE_USER_INVITE_ENABLED: boolean };
const mutableEnv = baseEnv as unknown as MutableBaseEnv;

describe("iamUserAdminApi — assignment logic", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    mutableEnv.FEATURE_USER_INVITE_ENABLED = false;
    adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
  });

  afterAll(async () => {
    await cleanup({ table: "user", id: adminUser.id });
    mutableEnv.FEATURE_USER_INVITE_ENABLED = false;
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
        await cleanup({ table: "user", id: athlete.id });
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
        await cleanup({ table: "user", id: athlete.id });
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
        await cleanup({ table: "user", id: athlete.id });
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
        await cleanup({ table: "user", id: athlete.id });
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
        await cleanup({ table: "user", id: athlete.id });
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
        await cleanup({ table: "user", id: athlete.id });
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
        await cleanup({ table: "user", id: athlete.id });
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
        await cleanup({ table: "user", id: athlete.id });
      }
    });
  });
});
