import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { ForbiddenError } from "@repo/errors";

import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../../test/helpers";
import * as sendModule from "../../iam/send-invitation-email";

import { coachingCoachInviteApi } from "./index";

describe("coachingCoachInviteApi.create — empty DB", () => {
  let callerWithoutProfile: Awaited<ReturnType<typeof createTestUser>>;
  let softDeletedCoach: Awaited<ReturnType<typeof createTestCoach>>;

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

    await cleanupRaw.coachProfile.update({
      where: { id: softDeletedCoach.profile.id },
      data: { deletedAt: new Date() },
    });
  });

  afterAll(async () => {
    await cleanup(
      { table: "user", id: callerWithoutProfile.id },
      { table: "coachProfile", id: softDeletedCoach.profile.id },
      { table: "user", id: softDeletedCoach.user.id },
    );

    sendSpy.mockRestore();
    configSpy.mockRestore();
  });

  it("exposes the create endpoint", () => {
    expect(coachingCoachInviteApi.create).toBeDefined();
    expect(typeof coachingCoachInviteApi.create).toBe("function");
  });

  it("throws ForbiddenError when caller has no CoachProfile", async () => {
    await expect(
      coachingCoachInviteApi.create(callerWithoutProfile.id, {
        email: `empty-${crypto.randomUUID()}@test.local`,
        name: null,
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("throws ForbiddenError when caller's CoachProfile is soft-deleted", async () => {
    await expect(
      coachingCoachInviteApi.create(softDeletedCoach.user.id, {
        email: `empty-soft-${crypto.randomUUID()}@test.local`,
        name: null,
      }),
    ).rejects.toThrow(ForbiddenError);
  });
});
