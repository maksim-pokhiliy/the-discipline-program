import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { ConflictError, ForbiddenError, InternalServerError } from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../../test/helpers";
import { iamInviteTokenApi } from "../../iam/invite-token";
import * as sendModule from "../../iam/send-invitation-email";

import { coachingCoachInviteApi } from "./index";

describe("coachingCoachInviteApi.create", () => {
  const sendSpy = vi
    .spyOn(sendModule, "sendInvitationEmail")
    .mockImplementation(async () => undefined);
  const configSpy = vi.spyOn(sendModule, "resolveInviteEmailConfig").mockImplementation(() => ({
    apiKey: "test-key",
    from: { email: "test@example.com" },
  }));

  afterAll(() => {
    sendSpy.mockRestore();
    configSpy.mockRestore();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    sendSpy.mockClear();
    configSpy.mockClear();
    configSpy.mockImplementation(() => ({
      apiKey: "test-key",
      from: { email: "test@example.com" },
    }));
  });

  describe("happy path", () => {
    let coach: Awaited<ReturnType<typeof createTestCoach>>;
    let createdUserId: string | null = null;

    beforeAll(async () => {
      coach = await createTestCoach();
    });

    afterAll(async () => {
      if (createdUserId) {
        await cleanupRaw.userInviteToken
          .deleteMany({ where: { userId: createdUserId } })
          .catch(() => undefined);
        await cleanup({ table: "user", id: createdUserId });
      }

      await cleanup(
        { table: "coachProfile", id: coach.profile.id },
        { table: "user", id: coach.user.id },
      );
    });

    it("creates user, athlete profile, assignment, token, and sends one email", async () => {
      const email = `coach-invite-${crypto.randomUUID()}@test.local`;

      const user = await coachingCoachInviteApi.create(coach.user.id, {
        email,
        name: "Alex",
      });

      createdUserId = user.id;

      expect(user.role).toBe(UserRole.ATHLETE);
      expect(user.email).toBe(email);
      expect(user.name).toBe("Alex");
      expect(user.emailVerified).toBeNull();

      const row = await cleanupRaw.user.findUnique({ where: { id: user.id } });

      expect(row?.password).toBeNull();
      expect(row?.emailVerified).toBeNull();
      expect(ROLE_TO_PRISMA_MAP[UserRole.ATHLETE]).toBe(row?.role);

      const profile = await cleanupRaw.athleteProfile.findUnique({
        where: { userId: user.id },
      });

      expect(profile).not.toBeNull();

      const assignments = await cleanupRaw.coachAthleteAssignment.findMany({
        where: { athleteId: user.id },
      });

      expect(assignments).toHaveLength(1);
      expect(assignments[0]?.coachId).toBe(coach.profile.id);
      expect(assignments[0]?.athleteId).toBe(user.id);

      const tokens = await cleanupRaw.userInviteToken.findMany({
        where: { userId: user.id },
      });

      expect(tokens).toHaveLength(1);
      expect(tokens[0]?.consumedAt).toBeNull();
      expect(tokens[0]?.createdByAdminId).toBe(coach.user.id);

      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: user.id,
          recipientEmail: email,
          recipientName: "Alex",
        }),
      );
    });
  });

  describe("duplicate email", () => {
    let coach: Awaited<ReturnType<typeof createTestCoach>>;
    let existingUser: Awaited<ReturnType<typeof createTestUser>>;

    beforeAll(async () => {
      coach = await createTestCoach();
      existingUser = await createTestUser();
    });

    afterAll(async () => {
      await cleanup(
        { table: "coachProfile", id: coach.profile.id },
        { table: "user", id: coach.user.id },
        { table: "user", id: existingUser.id },
      );
    });

    it("throws ConflictError and does not leak user, assignment, or token", async () => {
      await expect(
        coachingCoachInviteApi.create(coach.user.id, {
          email: existingUser.email,
          name: "Duplicate",
        }),
      ).rejects.toThrow(ConflictError);

      const assignments = await cleanupRaw.coachAthleteAssignment.findMany({
        where: { athleteId: existingUser.id },
      });

      expect(assignments).toHaveLength(0);

      const tokens = await cleanupRaw.userInviteToken.findMany({
        where: { userId: existingUser.id },
      });

      expect(tokens).toHaveLength(0);

      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe("caller is not an active coach", () => {
    let adminUser: Awaited<ReturnType<typeof createTestUser>>;
    let softDeletedCoach: Awaited<ReturnType<typeof createTestCoach>>;

    beforeAll(async () => {
      adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
      softDeletedCoach = await createTestCoach();
      await cleanupRaw.coachProfile.update({
        where: { id: softDeletedCoach.profile.id },
        data: { deletedAt: new Date() },
      });
    });

    afterAll(async () => {
      await cleanup(
        { table: "user", id: adminUser.id },
        { table: "coachProfile", id: softDeletedCoach.profile.id },
        { table: "user", id: softDeletedCoach.user.id },
      );
    });

    it("throws ForbiddenError when caller has no CoachProfile (admin)", async () => {
      const email = `admin-caller-${crypto.randomUUID()}@test.local`;

      await expect(
        coachingCoachInviteApi.create(adminUser.id, { email, name: null }),
      ).rejects.toThrow(ForbiddenError);

      const leaked = await cleanupRaw.user.findUnique({ where: { email } });

      expect(leaked).toBeNull();
      expect(sendSpy).not.toHaveBeenCalled();
    });

    it("throws ForbiddenError when caller's CoachProfile is soft-deleted", async () => {
      const email = `soft-deleted-caller-${crypto.randomUUID()}@test.local`;

      await expect(
        coachingCoachInviteApi.create(softDeletedCoach.user.id, { email, name: null }),
      ).rejects.toThrow(ForbiddenError);

      const leaked = await cleanupRaw.user.findUnique({ where: { email } });

      expect(leaked).toBeNull();

      const assignments = await cleanupRaw.coachAthleteAssignment.findMany({
        where: { coachId: softDeletedCoach.profile.id },
      });

      expect(assignments).toHaveLength(0);
      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe("resolveInviteEmailConfig failure", () => {
    let coach: Awaited<ReturnType<typeof createTestCoach>>;

    beforeAll(async () => {
      coach = await createTestCoach();
    });

    afterAll(async () => {
      await cleanup(
        { table: "coachProfile", id: coach.profile.id },
        { table: "user", id: coach.user.id },
      );
    });

    it("throws InternalServerError and does not create user when Resend config is missing", async () => {
      configSpy.mockImplementation(() => {
        throw new InternalServerError(
          "Invite flow enabled but RESEND_API_KEY or EMAIL_FROM missing",
        );
      });

      const email = `config-fail-${crypto.randomUUID()}@test.local`;

      await expect(
        coachingCoachInviteApi.create(coach.user.id, { email, name: null }),
      ).rejects.toThrow(InternalServerError);

      const row = await cleanupRaw.user.findUnique({ where: { email } });

      expect(row).toBeNull();

      const assignments = await cleanupRaw.coachAthleteAssignment.findMany({
        where: { coachId: coach.profile.id },
      });

      expect(assignments).toHaveLength(0);
      expect(sendSpy).not.toHaveBeenCalled();
    });
  });

  describe("invite token redeem", () => {
    let coach: Awaited<ReturnType<typeof createTestCoach>>;
    let invitedUserId: string | null = null;

    beforeAll(async () => {
      coach = await createTestCoach();
    });

    afterAll(async () => {
      if (invitedUserId) {
        await cleanupRaw.userInviteToken
          .deleteMany({ where: { userId: invitedUserId } })
          .catch(() => undefined);
        await cleanup({ table: "user", id: invitedUserId });
      }

      await cleanup(
        { table: "coachProfile", id: coach.profile.id },
        { table: "user", id: coach.user.id },
      );
    });

    it("issues a redeemable token that consumes to /athlete and keeps the assignment", async () => {
      const email = `consume-${crypto.randomUUID()}@test.local`;
      const issueSpy = vi.spyOn(iamInviteTokenApi, "issue");

      try {
        const user = await coachingCoachInviteApi.create(coach.user.id, {
          email,
          name: "Consumer",
        });

        invitedUserId = user.id;

        expect(issueSpy).toHaveBeenCalledTimes(1);

        const issueResult = await issueSpy.mock.results[0]?.value;
        const plainToken = (issueResult as { plainToken: string; expiresAt: Date }).plainToken;

        expect(typeof plainToken).toBe("string");
        expect(plainToken.length).toBeGreaterThan(0);

        const consumeResult = await iamInviteTokenApi.consume(plainToken, {
          password: "secret123",
        });

        expect(consumeResult.email).toBe(email);
        expect(consumeResult.redirectTo).toBe("/athlete");

        const row = await cleanupRaw.user.findUnique({ where: { id: user.id } });

        expect(row?.password).not.toBeNull();
        expect(row?.emailVerified).not.toBeNull();

        const assignments = await cleanupRaw.coachAthleteAssignment.findMany({
          where: { athleteId: user.id },
        });

        expect(assignments).toHaveLength(1);
        expect(assignments[0]?.coachId).toBe(coach.profile.id);
      } finally {
        issueSpy.mockRestore();
      }
    });
  });

  describe("concurrent invites to the same email", () => {
    let coachA: Awaited<ReturnType<typeof createTestCoach>>;
    let coachB: Awaited<ReturnType<typeof createTestCoach>>;
    let winnerUserId: string | null = null;

    beforeAll(async () => {
      coachA = await createTestCoach();
      coachB = await createTestCoach();
    });

    afterAll(async () => {
      if (winnerUserId) {
        await cleanupRaw.userInviteToken
          .deleteMany({ where: { userId: winnerUserId } })
          .catch(() => undefined);
        await cleanup({ table: "user", id: winnerUserId });
      }

      await cleanup(
        { table: "coachProfile", id: coachA.profile.id },
        { table: "user", id: coachA.user.id },
        { table: "coachProfile", id: coachB.profile.id },
        { table: "user", id: coachB.user.id },
      );
    });

    it("exactly one call succeeds and the other gets ConflictError", async () => {
      const email = `concurrent-${crypto.randomUUID()}@test.local`;

      const [resultA, resultB] = await Promise.allSettled([
        coachingCoachInviteApi.create(coachA.user.id, { email, name: "A" }),
        coachingCoachInviteApi.create(coachB.user.id, { email, name: "B" }),
      ]);

      const fulfilled = [resultA, resultB].filter((r) => r.status === "fulfilled");
      const rejected = [resultA, resultB].filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;

      expect(rejectedReason).toBeInstanceOf(ConflictError);

      const winnerUser = (fulfilled[0] as PromiseFulfilledResult<{ id: string }>).value;

      winnerUserId = winnerUser.id;

      const users = await cleanupRaw.user.findMany({ where: { email } });

      expect(users).toHaveLength(1);

      const assignments = await cleanupRaw.coachAthleteAssignment.findMany({
        where: { athleteId: winnerUser.id },
      });

      expect(assignments).toHaveLength(1);
      expect([coachA.profile.id, coachB.profile.id]).toContain(assignments[0]?.coachId);
    });
  });
});
