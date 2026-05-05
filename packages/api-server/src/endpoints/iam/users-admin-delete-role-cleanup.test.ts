import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coaching/coach-action-item";
import { UserRole } from "@repo/contracts/iam/auth";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import { iamUserAdminApi } from "./users-admin";

describe("iamUserAdminApi.deleteUser — role-cleanup side effects", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
  });

  afterAll(async () => {
    await cleanup({ table: "user", id: adminUser.id });
  });

  it("soft-deletes coach profile, removes coach-side assignments, and resolves action items when coach is deleted", async () => {
    const coachTarget = await createTestCoach();
    const athlete = await createTestUser();

    await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coachTarget.profile.id, athleteId: athlete.id },
    });

    const coachItem = await cleanupRaw.coachActionItem.create({
      data: {
        coachId: coachTarget.profile.id,
        athleteId: athlete.id,
        type: ActionItemType.HEALTH_REPORT,
        severity: ActionItemSeverity.CRITICAL,
        message: "Open item for deleted coach",
        status: ActionItemStatus.OPEN,
      },
    });

    try {
      await iamUserAdminApi.deleteUser(adminUser.id, coachTarget.user.id);

      const profile = await cleanupRaw.coachProfile.findUnique({
        where: { id: coachTarget.profile.id },
      });

      expect(profile?.deletedAt).not.toBeNull();

      const coachSideAssignments = await cleanupRaw.coachAthleteAssignment.count({
        where: { coachId: coachTarget.profile.id },
      });

      expect(coachSideAssignments).toBe(0);

      const reloadedItem = await cleanupRaw.coachActionItem.findUnique({
        where: { id: coachItem.id },
      });

      expect(reloadedItem?.status).toBe(ActionItemStatus.RESOLVED);
      expect(reloadedItem?.resolveReason).toBe(ActionItemResolveReason.AUTO_ASSIGNMENT_ENDED);
      expect(reloadedItem?.resolvedAt).toBeInstanceOf(Date);
    } finally {
      await cleanupRaw.coachActionItem
        .deleteMany({ where: { athleteId: athlete.id } })
        .catch(() => {});
      await cleanupRaw.coachAthleteAssignment
        .deleteMany({ where: { athleteId: athlete.id } })
        .catch(() => {});
      await cleanupRaw.coachProfile
        .delete({ where: { id: coachTarget.profile.id } })
        .catch(() => {});
      await cleanup({ table: "user", id: coachTarget.user.id }, { table: "user", id: athlete.id });
    }
  });

  it("removes athlete-side assignments and resolves action items when athlete is deleted", async () => {
    const athleteTarget = await createTestUser();
    const coach = await createTestCoach();

    await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coach.profile.id, athleteId: athleteTarget.id },
    });

    const item = await cleanupRaw.coachActionItem.create({
      data: {
        coachId: coach.profile.id,
        athleteId: athleteTarget.id,
        type: ActionItemType.HEALTH_REPORT,
        severity: ActionItemSeverity.CRITICAL,
        message: "Open item for deleted athlete",
        status: ActionItemStatus.OPEN,
      },
    });

    try {
      await iamUserAdminApi.deleteUser(adminUser.id, athleteTarget.id);

      const assignmentCount = await cleanupRaw.coachAthleteAssignment.count({
        where: { athleteId: athleteTarget.id },
      });

      expect(assignmentCount).toBe(0);

      const reloadedItem = await cleanupRaw.coachActionItem.findUnique({
        where: { id: item.id },
      });

      expect(reloadedItem?.status).toBe(ActionItemStatus.RESOLVED);
      expect(reloadedItem?.resolveReason).toBe(ActionItemResolveReason.AUTO_ASSIGNMENT_ENDED);
    } finally {
      await cleanupRaw.coachActionItem
        .deleteMany({ where: { athleteId: athleteTarget.id } })
        .catch(() => {});
      await cleanupRaw.coachAthleteAssignment
        .deleteMany({ where: { athleteId: athleteTarget.id } })
        .catch(() => {});
      await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
      await cleanup({ table: "user", id: athleteTarget.id }, { table: "user", id: coach.user.id });
    }
  });
});
