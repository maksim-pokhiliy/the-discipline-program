import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coaching/coach-action-item";
import { UserRole } from "@repo/contracts/iam/auth";
import { baseEnv } from "@repo/env/base";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import { iamUserAdminApi } from "./users-admin";

type MutableBaseEnv = { FEATURE_USER_INVITE_ENABLED: boolean };
const mutableEnv = baseEnv as unknown as MutableBaseEnv;

describe("iamUserAdminApi — orphan action-item cleanup", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;

  beforeAll(async () => {
    mutableEnv.FEATURE_USER_INVITE_ENABLED = false;
    adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
    coachA = await createTestCoach();
    coachB = await createTestCoach();
  });

  afterAll(async () => {
    await cleanup(
      { table: "user", id: adminUser.id },
      { table: "user", id: coachA.user.id },
      { table: "user", id: coachB.user.id },
    );
    mutableEnv.FEATURE_USER_INVITE_ENABLED = false;
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
      await cleanup({ table: "user", id: athlete.id });
    }
  });
});
