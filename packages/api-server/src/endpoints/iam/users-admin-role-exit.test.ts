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

describe("iamUserAdminApi.updateRole — role-exit action-item cleanup", () => {
  let adminUser: Awaited<ReturnType<typeof createTestUser>>;

  beforeAll(async () => {
    adminUser = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
  });

  afterAll(async () => {
    await cleanup({ table: "user", id: adminUser.id });
  });

  it("closes coach's open action items when COACH role is exited", async () => {
    const coachTarget = await createTestCoach();
    const otherCoach = await createTestCoach();
    const athlete = await createTestUser();

    await cleanupRaw.coachAthleteAssignment.createMany({
      data: [
        { coachId: coachTarget.profile.id, athleteId: athlete.id },
        { coachId: otherCoach.profile.id, athleteId: athlete.id },
      ],
    });

    const coachItem = await cleanupRaw.coachActionItem.create({
      data: {
        coachId: coachTarget.profile.id,
        athleteId: athlete.id,
        type: ActionItemType.HEALTH_REPORT,
        severity: ActionItemSeverity.CRITICAL,
        message: "Coach target open item",
        status: ActionItemStatus.OPEN,
      },
    });

    const otherCoachItem = await cleanupRaw.coachActionItem.create({
      data: {
        coachId: otherCoach.profile.id,
        athleteId: athlete.id,
        type: ActionItemType.HEALTH_REPORT,
        severity: ActionItemSeverity.CRITICAL,
        message: "Other coach open item",
        status: ActionItemStatus.OPEN,
      },
    });

    try {
      await iamUserAdminApi.updateRole(adminUser.id, coachTarget.user.id, {
        role: UserRole.ATHLETE,
      });

      const reloadedCoachItem = await cleanupRaw.coachActionItem.findUnique({
        where: { id: coachItem.id },
      });
      const reloadedOtherItem = await cleanupRaw.coachActionItem.findUnique({
        where: { id: otherCoachItem.id },
      });

      expect(reloadedCoachItem?.status).toBe(ActionItemStatus.RESOLVED);
      expect(reloadedCoachItem?.resolveReason).toBe(ActionItemResolveReason.AUTO_ENROLLMENT_ENDED);
      expect(reloadedCoachItem?.resolvedAt).toBeInstanceOf(Date);

      expect(reloadedOtherItem?.status).toBe(ActionItemStatus.OPEN);

      const profile = await cleanupRaw.coachProfile.findUnique({
        where: { id: coachTarget.profile.id },
      });

      expect(profile?.deletedAt).not.toBeNull();

      const coachSideAssignments = await cleanupRaw.coachAthleteAssignment.count({
        where: { coachId: coachTarget.profile.id },
      });

      expect(coachSideAssignments).toBe(0);
    } finally {
      await cleanupRaw.coachActionItem
        .deleteMany({ where: { athleteId: athlete.id } })
        .catch(() => {});
      await cleanupRaw.coachAthleteAssignment
        .deleteMany({ where: { athleteId: athlete.id } })
        .catch(() => {});
      await cleanupRaw.athleteProfile
        .delete({ where: { userId: coachTarget.user.id } })
        .catch(() => {});
      await cleanupRaw.coachProfile
        .delete({ where: { id: coachTarget.profile.id } })
        .catch(() => {});
      await cleanupRaw.coachProfile
        .delete({ where: { id: otherCoach.profile.id } })
        .catch(() => {});
      await cleanup(
        { table: "user", id: coachTarget.user.id },
        { table: "user", id: otherCoach.user.id },
        { table: "user", id: athlete.id },
      );
    }
  });

  it("closes athlete's open action items when ATHLETE role is exited", async () => {
    const athleteTarget = await createTestUser();
    const coachOne = await createTestCoach();
    const coachTwo = await createTestCoach();

    await cleanupRaw.coachAthleteAssignment.createMany({
      data: [
        { coachId: coachOne.profile.id, athleteId: athleteTarget.id },
        { coachId: coachTwo.profile.id, athleteId: athleteTarget.id },
      ],
    });

    const itemOne = await cleanupRaw.coachActionItem.create({
      data: {
        coachId: coachOne.profile.id,
        athleteId: athleteTarget.id,
        type: ActionItemType.HEALTH_REPORT,
        severity: ActionItemSeverity.CRITICAL,
        message: "From coach one",
        status: ActionItemStatus.OPEN,
      },
    });

    const itemTwo = await cleanupRaw.coachActionItem.create({
      data: {
        coachId: coachTwo.profile.id,
        athleteId: athleteTarget.id,
        type: ActionItemType.MISSED_WORKOUTS,
        severity: ActionItemSeverity.WARNING,
        message: "From coach two",
        status: ActionItemStatus.OPEN,
      },
    });

    try {
      await iamUserAdminApi.updateRole(adminUser.id, athleteTarget.id, {
        role: UserRole.COACH,
      });

      const reloadedOne = await cleanupRaw.coachActionItem.findUnique({
        where: { id: itemOne.id },
      });
      const reloadedTwo = await cleanupRaw.coachActionItem.findUnique({
        where: { id: itemTwo.id },
      });

      expect(reloadedOne?.status).toBe(ActionItemStatus.RESOLVED);
      expect(reloadedOne?.resolveReason).toBe(ActionItemResolveReason.AUTO_ENROLLMENT_ENDED);
      expect(reloadedTwo?.status).toBe(ActionItemStatus.RESOLVED);
      expect(reloadedTwo?.resolveReason).toBe(ActionItemResolveReason.AUTO_ENROLLMENT_ENDED);

      const assignmentCount = await cleanupRaw.coachAthleteAssignment.count({
        where: { athleteId: athleteTarget.id },
      });

      expect(assignmentCount).toBe(0);
    } finally {
      await cleanupRaw.coachActionItem
        .deleteMany({ where: { athleteId: athleteTarget.id } })
        .catch(() => {});
      await cleanupRaw.coachAthleteAssignment
        .deleteMany({ where: { athleteId: athleteTarget.id } })
        .catch(() => {});
      await cleanupRaw.coachProfile.delete({ where: { userId: athleteTarget.id } }).catch(() => {});
      await cleanupRaw.coachProfile.delete({ where: { id: coachOne.profile.id } }).catch(() => {});
      await cleanupRaw.coachProfile.delete({ where: { id: coachTwo.profile.id } }).catch(() => {});
      await cleanup(
        { table: "user", id: athleteTarget.id },
        { table: "user", id: coachOne.user.id },
        { table: "user", id: coachTwo.user.id },
      );
    }
  });
});
