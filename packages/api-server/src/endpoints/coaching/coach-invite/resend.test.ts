import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  TooManyRequestsError,
} from "@repo/errors";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import {
  cleanup,
  cleanupRaw,
  createTestAssignment,
  createTestCoach,
  createTestUser,
} from "../../../test/helpers";
import * as sendModule from "../../iam/send-invitation-email";

import { coachingCoachInviteApi } from "./index";

type Fixture = Awaited<ReturnType<typeof setupOwnedPendingAthlete>>;

const setupOwnedPendingAthlete = async (
  athleteOverrides: Parameters<typeof createTestUser>[0] = {},
) => {
  const coach = await createTestCoach();
  const athlete = await createTestUser({
    password: null,
    emailVerified: null,
    ...athleteOverrides,
  });
  const assignment = await createTestAssignment(coach.profile.id, athlete.id);

  return { coach, athlete, assignment };
};

const cleanupFixture = async (fixture: Fixture) => {
  await cleanupRaw.userInviteToken
    .deleteMany({ where: { userId: fixture.athlete.id } })
    .catch(() => undefined);
  await cleanup(
    { table: "coachAthleteAssignment", id: fixture.assignment.id },
    { table: "user", id: fixture.athlete.id },
    { table: "coachProfile", id: fixture.coach.profile.id },
    { table: "user", id: fixture.coach.user.id },
  );
};

describe("coachingCoachInviteApi.resend", () => {
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

  it("happy path — issues a fresh token, supersedes the prior one, and sends exactly one email", async () => {
    const fixture = await setupOwnedPendingAthlete();
    const priorToken = await cleanupRaw.userInviteToken.create({
      data: {
        userId: fixture.athlete.id,
        tokenHash: `hash-${crypto.randomUUID()}`,
        expiresAt: new Date(Date.now() + 3_600_000),
        createdByAdminId: fixture.coach.user.id,
      },
    });

    try {
      const result = await coachingCoachInviteApi.resend(fixture.coach.user.id, fixture.athlete.id);

      expect(result.expiresAt).toBeInstanceOf(Date);

      const priorAfter = await cleanupRaw.userInviteToken.findUnique({
        where: { id: priorToken.id },
      });

      expect(priorAfter?.consumedAt).not.toBeNull();

      const active = await cleanupRaw.userInviteToken.findMany({
        where: { userId: fixture.athlete.id, consumedAt: null },
      });

      expect(active).toHaveLength(1);
      expect(active[0]?.createdByAdminId).toBe(fixture.coach.user.id);
      expect(configSpy).toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalledTimes(1);
      expect(sendSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: fixture.athlete.id,
          recipientEmail: fixture.athlete.email,
          recipientName: fixture.athlete.name,
        }),
      );
    } finally {
      await cleanupFixture(fixture);
    }
  });

  it("throws ConflictError when athlete already has a password", async () => {
    const fixture = await setupOwnedPendingAthlete({
      password: "$2a$12$somefakeBcryptHashPlaceholderValue...",
    });

    try {
      await expect(
        coachingCoachInviteApi.resend(fixture.coach.user.id, fixture.athlete.id),
      ).rejects.toThrow(ConflictError);

      const tokens = await cleanupRaw.userInviteToken.findMany({
        where: { userId: fixture.athlete.id },
      });

      expect(tokens).toHaveLength(0);
      expect(sendSpy).not.toHaveBeenCalled();
    } finally {
      await cleanupFixture(fixture);
    }
  });

  it("throws ForbiddenError when athlete is assigned to a different coach", async () => {
    const fixture = await setupOwnedPendingAthlete();
    const otherCoach = await createTestCoach();

    try {
      await expect(
        coachingCoachInviteApi.resend(otherCoach.user.id, fixture.athlete.id),
      ).rejects.toThrow(ForbiddenError);

      const tokens = await cleanupRaw.userInviteToken.findMany({
        where: { userId: fixture.athlete.id },
      });

      expect(tokens).toHaveLength(0);
      expect(sendSpy).not.toHaveBeenCalled();
    } finally {
      await cleanup(
        { table: "coachProfile", id: otherCoach.profile.id },
        { table: "user", id: otherCoach.user.id },
      );
      await cleanupFixture(fixture);
    }
  });

  it("throws NotFoundError with 'User not found' message when invitee is soft-deleted", async () => {
    const fixture = await setupOwnedPendingAthlete();

    await cleanupRaw.user.update({
      where: { id: fixture.athlete.id },
      data: { deletedAt: new Date() },
    });

    try {
      await expect(
        coachingCoachInviteApi.resend(fixture.coach.user.id, fixture.athlete.id),
      ).rejects.toMatchObject({
        name: NotFoundError.name,
        message: expect.stringContaining("User not found"),
      });

      const tokens = await cleanupRaw.userInviteToken.findMany({
        where: { userId: fixture.athlete.id },
      });

      expect(tokens).toHaveLength(0);
      expect(sendSpy).not.toHaveBeenCalled();
    } finally {
      await cleanupFixture(fixture);
    }
  });

  it("throws BadRequestError when invitee role is not ATHLETE", async () => {
    const fixture = await setupOwnedPendingAthlete({
      role: ROLE_TO_PRISMA_MAP[UserRole.COACH],
    });

    try {
      await expect(
        coachingCoachInviteApi.resend(fixture.coach.user.id, fixture.athlete.id),
      ).rejects.toThrow(BadRequestError);

      const tokens = await cleanupRaw.userInviteToken.findMany({
        where: { userId: fixture.athlete.id },
      });

      expect(tokens).toHaveLength(0);
      expect(sendSpy).not.toHaveBeenCalled();
    } finally {
      await cleanupFixture(fixture);
    }
  });

  it("throws ForbiddenError when caller has no CoachProfile (admin caller)", async () => {
    const adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
    const fixture = await setupOwnedPendingAthlete();

    try {
      await expect(coachingCoachInviteApi.resend(adminUser.id, fixture.athlete.id)).rejects.toThrow(
        ForbiddenError,
      );

      const tokens = await cleanupRaw.userInviteToken.findMany({
        where: { userId: fixture.athlete.id },
      });

      expect(tokens).toHaveLength(0);
      expect(sendSpy).not.toHaveBeenCalled();
    } finally {
      await cleanupFixture(fixture);
      await cleanup({ table: "user", id: adminUser.id });
    }
  });

  it("throws ForbiddenError when caller's CoachProfile is soft-deleted", async () => {
    const softDeletedCoach = await createTestCoach();
    const fixture = await setupOwnedPendingAthlete();

    await cleanupRaw.coachProfile.update({
      where: { id: softDeletedCoach.profile.id },
      data: { deletedAt: new Date() },
    });

    try {
      await expect(
        coachingCoachInviteApi.resend(softDeletedCoach.user.id, fixture.athlete.id),
      ).rejects.toThrow(ForbiddenError);

      const tokens = await cleanupRaw.userInviteToken.findMany({
        where: { userId: fixture.athlete.id },
      });

      expect(tokens).toHaveLength(0);
      expect(sendSpy).not.toHaveBeenCalled();
    } finally {
      await cleanup(
        { table: "coachProfile", id: softDeletedCoach.profile.id },
        { table: "user", id: softDeletedCoach.user.id },
      );
      await cleanupFixture(fixture);
    }
  });

  it("throws InternalServerError when resolveInviteEmailConfig throws", async () => {
    const fixture = await setupOwnedPendingAthlete();

    configSpy.mockImplementation(() => {
      throw new InternalServerError("RESEND_API_KEY or EMAIL_FROM missing");
    });

    try {
      await expect(
        coachingCoachInviteApi.resend(fixture.coach.user.id, fixture.athlete.id),
      ).rejects.toThrow(InternalServerError);

      const tokens = await cleanupRaw.userInviteToken.findMany({
        where: { userId: fixture.athlete.id },
      });

      expect(tokens).toHaveLength(0);
      expect(sendSpy).not.toHaveBeenCalled();
    } finally {
      await cleanupFixture(fixture);
    }
  });

  it("throws TooManyRequestsError when 3 tokens already exist in the last 24h", async () => {
    const fixture = await setupOwnedPendingAthlete();

    for (let i = 0; i < 3; i++) {
      await cleanupRaw.userInviteToken.create({
        data: {
          userId: fixture.athlete.id,
          tokenHash: `hash-${crypto.randomUUID()}`,
          expiresAt: new Date(Date.now() + 3_600_000),
          createdByAdminId: fixture.coach.user.id,
          createdAt: new Date(Date.now() - i * 60_000),
        },
      });
    }

    try {
      await expect(
        coachingCoachInviteApi.resend(fixture.coach.user.id, fixture.athlete.id),
      ).rejects.toThrow(TooManyRequestsError);

      const tokens = await cleanupRaw.userInviteToken.findMany({
        where: { userId: fixture.athlete.id },
      });

      expect(tokens).toHaveLength(3);
      expect(sendSpy).not.toHaveBeenCalled();
    } finally {
      await cleanupFixture(fixture);
    }
  });

  it("concurrent resends from the same coach both resolve and leave exactly one active token", async () => {
    const fixture = await setupOwnedPendingAthlete();

    try {
      const [resultA, resultB] = await Promise.allSettled([
        coachingCoachInviteApi.resend(fixture.coach.user.id, fixture.athlete.id),
        coachingCoachInviteApi.resend(fixture.coach.user.id, fixture.athlete.id),
      ]);

      expect(resultA.status).toBe("fulfilled");
      expect(resultB.status).toBe("fulfilled");

      const active = await cleanupRaw.userInviteToken.findMany({
        where: { userId: fixture.athlete.id, consumedAt: null },
      });

      expect(active).toHaveLength(1);
      expect(sendSpy).toHaveBeenCalledTimes(2);
    } finally {
      await cleanupFixture(fixture);
    }
  });
});
