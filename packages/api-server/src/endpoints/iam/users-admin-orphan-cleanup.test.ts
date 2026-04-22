import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coaching/coach-action-item";
import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import * as sendModule from "./send-invitation-email";
import { iamUserAdminApi } from "./users-admin";

describe("iamUserAdminApi — orphan action-item cleanup", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  const sendSpy = vi
    .spyOn(sendModule, "sendInvitationEmail")
    .mockImplementation(async () => undefined);
  const configSpy = vi.spyOn(sendModule, "resolveInviteEmailConfig").mockImplementation(() => ({
    apiKey: "test-key",
    from: { email: "test@example.com" },
  }));

  beforeAll(async () => {
    adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
    coachA = await createTestCoach();
    coachB = await createTestCoach();
  });

  afterAll(async () => {
    await cleanupRaw.userInviteToken
      .deleteMany({ where: { createdByAdminId: adminUser.id } })
      .catch(() => undefined);
    await cleanup(
      { table: "user", id: adminUser.id },
      { table: "user", id: coachA.user.id },
      { table: "user", id: coachB.user.id },
    );
    sendSpy.mockRestore();
    configSpy.mockRestore();
  });

  it("closes orphan action items inline when a coach assignment is removed", async () => {
    const athlete = await iamUserAdminApi.createUser(adminUser.id, {
      email: `athlete-${crypto.randomUUID()}@test.local`,
      name: "Orphan Cleanup Athlete",
      role: UserRole.ATHLETE,
      timezone: "UTC",
      coachIds: [coachA.profile.id, coachB.profile.id],
    });

    const itemA = await cleanupRaw.coachActionItem.create({
      data: {
        coachId: coachA.profile.id,
        athleteId: athlete.id,
        type: ActionItemType.HEALTH_REPORT,
        severity: ActionItemSeverity.CRITICAL,
        message: "Coach A open item",
        status: ActionItemStatus.OPEN,
      },
    });

    const itemB = await cleanupRaw.coachActionItem.create({
      data: {
        coachId: coachB.profile.id,
        athleteId: athlete.id,
        type: ActionItemType.HEALTH_REPORT,
        severity: ActionItemSeverity.CRITICAL,
        message: "Coach B open item",
        status: ActionItemStatus.OPEN,
      },
    });

    try {
      await iamUserAdminApi.updateUser(adminUser.id, athlete.id, {
        coachIds: [coachB.profile.id],
      });

      const reloadedA = await cleanupRaw.coachActionItem.findUnique({
        where: { id: itemA.id },
      });
      const reloadedB = await cleanupRaw.coachActionItem.findUnique({
        where: { id: itemB.id },
      });

      expect(reloadedA?.status).toBe(ActionItemStatus.RESOLVED);
      expect(reloadedA?.resolveReason).toBe(ActionItemResolveReason.AUTO_ENROLLMENT_ENDED);
      expect(reloadedA?.resolvedAt).toBeInstanceOf(Date);

      expect(reloadedB?.status).toBe(ActionItemStatus.OPEN);
      expect(reloadedB?.resolveReason).toBeNull();
      expect(reloadedB?.resolvedAt).toBeNull();
    } finally {
      await cleanupRaw.coachActionItem
        .deleteMany({ where: { athleteId: athlete.id } })
        .catch(() => {});
      await cleanupRaw.userInviteToken
        .deleteMany({ where: { userId: athlete.id } })
        .catch(() => {});
      await cleanup({ table: "user", id: athlete.id });
    }
  });
});
