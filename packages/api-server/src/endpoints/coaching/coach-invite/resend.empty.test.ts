import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "@repo/errors";

import {
  cleanup,
  cleanupRaw,
  createTestAssignment,
  createTestCoach,
  createTestUser,
} from "../../../test/helpers";
import * as sendModule from "../../iam/send-invitation-email";

import { coachingCoachInviteApi } from "./index";

describe("coachingCoachInviteApi.resend — empty DB", () => {
  let callerWithoutProfile: Awaited<ReturnType<typeof createTestUser>>;
  let softDeletedCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoachAthlete: Awaited<ReturnType<typeof createTestUser>>;
  let otherCoachAssignmentId: string;

  const sendSpy = vi
    .spyOn(sendModule, "sendInvitationEmail")
    .mockImplementation(async () => undefined);
  const configSpy = vi.spyOn(sendModule, "resolveInviteEmailConfig").mockImplementation(() => ({
    apiKey: "test-key",
    from: { email: "test@example.com" },
  }));

  beforeAll(async () => {
    callerWithoutProfile = await createTestUser();
    softDeletedCoach = await createTestCoach();
    otherCoach = await createTestCoach();
    otherCoachAthlete = await createTestUser();

    const assignment = await createTestAssignment(otherCoach.profile.id, otherCoachAthlete.id);

    otherCoachAssignmentId = assignment.id;

    await cleanupRaw.coachProfile.update({
      where: { id: softDeletedCoach.profile.id },
      data: { deletedAt: new Date() },
    });
  });

  afterAll(async () => {
    await cleanup(
      { table: "coachAthleteAssignment", id: otherCoachAssignmentId },
      { table: "user", id: otherCoachAthlete.id },
      { table: "coachProfile", id: otherCoach.profile.id },
      { table: "user", id: otherCoach.user.id },
      { table: "user", id: callerWithoutProfile.id },
      { table: "coachProfile", id: softDeletedCoach.profile.id },
      { table: "user", id: softDeletedCoach.user.id },
    );

    sendSpy.mockRestore();
    configSpy.mockRestore();
  });

  it("exposes the resend endpoint", () => {
    expect(coachingCoachInviteApi.resend).toBeDefined();
    expect(typeof coachingCoachInviteApi.resend).toBe("function");
  });

  it("throws ForbiddenError when caller has no CoachProfile", async () => {
    await expect(
      coachingCoachInviteApi.resend(callerWithoutProfile.id, otherCoachAthlete.id),
    ).rejects.toThrow(ForbiddenError);

    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("throws ForbiddenError when caller's CoachProfile is soft-deleted", async () => {
    await expect(
      coachingCoachInviteApi.resend(softDeletedCoach.user.id, otherCoachAthlete.id),
    ).rejects.toThrow(ForbiddenError);

    expect(sendSpy).not.toHaveBeenCalled();
  });

  it("throws ForbiddenError when invitee does not exist (caller is a valid coach)", async () => {
    const coach = await createTestCoach();

    try {
      await expect(
        coachingCoachInviteApi.resend(coach.user.id, "clx000000000000000000000"),
      ).rejects.toThrow(ForbiddenError);

      expect(sendSpy).not.toHaveBeenCalled();
    } finally {
      await cleanup(
        { table: "coachProfile", id: coach.profile.id },
        { table: "user", id: coach.user.id },
      );
    }
  });

  it("throws ForbiddenError when invitee exists but is assigned to a different coach", async () => {
    const coach = await createTestCoach();

    try {
      await expect(
        coachingCoachInviteApi.resend(coach.user.id, otherCoachAthlete.id),
      ).rejects.toThrow(ForbiddenError);

      expect(sendSpy).not.toHaveBeenCalled();
    } finally {
      await cleanup(
        { table: "coachProfile", id: coach.profile.id },
        { table: "user", id: coach.user.id },
      );
    }
  });
});
