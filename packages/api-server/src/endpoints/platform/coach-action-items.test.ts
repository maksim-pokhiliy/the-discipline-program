import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coach-action-item";
import { MISSED_DAYS_CRITICAL, MISSED_DAYS_WARNING } from "@repo/contracts/coach-dashboard";
import { PlanEnrollmentStatus } from "@repo/contracts/plan-enrollment";
import { NotFoundError } from "@repo/errors";

import { cleanupRaw, createTestCoach, createTestPlan, createTestUser } from "../../test/helpers";

import { platformCoachActionItemsApi } from "./coach-action-items";

const daysAgo = (n: number): Date => {
  const d = new Date();

  d.setUTCDate(d.getUTCDate() - n);
  d.setUTCHours(0, 0, 0, 0);

  return d;
};

describe("platformCoachActionItemsApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let plan: Awaited<ReturnType<typeof createTestPlan>>;

  let athleteMissed: Awaited<ReturnType<typeof createTestUser>>;
  let athleteNew: Awaited<ReturnType<typeof createTestUser>>;
  let athleteHealth: Awaited<ReturnType<typeof createTestUser>>;
  let athleteResolve: Awaited<ReturnType<typeof createTestUser>>;

  const toCleanup: { table: string; id: string }[] = [];

  const trackCleanup = (table: string, id: string) => {
    toCleanup.push({ table, id });
  };

  beforeAll(async () => {
    coach = await createTestCoach();
    await cleanupRaw.user.update({
      where: { id: coach.user.id },
      data: { timezone: "UTC" },
    });

    plan = await createTestPlan(coach.profile.id, { status: "ACTIVE" });

    athleteMissed = await createTestUser();
    athleteNew = await createTestUser();
    athleteHealth = await createTestUser();
    athleteResolve = await createTestUser();

    const workout = await cleanupRaw.workout.create({
      data: { planId: plan.id, title: "Log target", sortOrder: 0 },
    });

    trackCleanup("workout", workout.id);

    const enr1 = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: plan.id,
        userId: athleteMissed.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startDate: daysAgo(30),
      },
    });

    trackCleanup("planEnrollment", enr1.id);

    const log = await cleanupRaw.workoutLog.create({
      data: {
        userId: athleteMissed.id,
        workoutId: workout.id,
        date: daysAgo(MISSED_DAYS_WARNING + 1),
      },
    });

    trackCleanup("workoutLog", log.id);

    const enr2 = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: plan.id,
        userId: athleteNew.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startDate: daysAgo(1),
      },
    });

    trackCleanup("planEnrollment", enr2.id);

    const enr3 = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: plan.id,
        userId: athleteHealth.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startDate: daysAgo(5),
      },
    });

    trackCleanup("planEnrollment", enr3.id);

    const profile = await cleanupRaw.athleteProfile.create({
      data: { userId: athleteHealth.id, healthStatus: "INJURED" },
    });

    trackCleanup("athleteProfile", profile.id);

    const enr4 = await cleanupRaw.planEnrollment.create({
      data: {
        trainingPlanId: plan.id,
        userId: athleteResolve.id,
        status: PlanEnrollmentStatus.ACTIVE,
        startDate: daysAgo(1),
      },
    });

    trackCleanup("planEnrollment", enr4.id);
  });

  afterAll(async () => {
    await cleanupRaw.coachActionItem
      .deleteMany({ where: { coachId: coach.profile.id } })
      .catch(() => {});

    for (const { table, id } of toCleanup.reverse()) {
      const delegate = (
        cleanupRaw as unknown as Record<
          string,
          { delete: (args: { where: { id: string } }) => Promise<unknown> }
        >
      )[table];

      if (delegate) {
        await delegate.delete({ where: { id } }).catch(() => {});
      }
    }

    await cleanupRaw.trainingPlan.delete({ where: { id: plan.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athleteMissed.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athleteNew.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athleteHealth.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athleteResolve.id } }).catch(() => {});
  });

  describe("reconcile", () => {
    it("creates action items for detected conditions", async () => {
      const result = await platformCoachActionItemsApi.reconcile(coach.user.id);

      expect(result.created).toBeGreaterThanOrEqual(3);

      const items = await cleanupRaw.coachActionItem.findMany({
        where: { coachId: coach.profile.id, status: ActionItemStatus.OPEN },
      });

      const types = items.map((i) => i.type);

      expect(types).toContain(ActionItemType.MISSED_WORKOUTS);
      expect(types).toContain(ActionItemType.NEW_NO_START);
      expect(types).toContain(ActionItemType.HEALTH_REPORT);
    });

    it("creates MISSED_WORKOUTS for athlete with old activity", async () => {
      const items = await cleanupRaw.coachActionItem.findMany({
        where: {
          coachId: coach.profile.id,
          athleteId: athleteMissed.id,
          type: ActionItemType.MISSED_WORKOUTS,
          status: ActionItemStatus.OPEN,
        },
      });

      expect(items).toHaveLength(1);
      expect([ActionItemSeverity.WARNING, ActionItemSeverity.CRITICAL]).toContain(
        items[0]?.severity,
      );
    });

    it("creates NEW_NO_START for newly enrolled athlete with no logs", async () => {
      const items = await cleanupRaw.coachActionItem.findMany({
        where: {
          coachId: coach.profile.id,
          athleteId: athleteNew.id,
          type: ActionItemType.NEW_NO_START,
          status: ActionItemStatus.OPEN,
        },
      });

      expect(items).toHaveLength(1);
      expect(items[0]?.severity).toBe(ActionItemSeverity.INFO);
    });

    it("creates HEALTH_REPORT for injured athlete", async () => {
      const items = await cleanupRaw.coachActionItem.findMany({
        where: {
          coachId: coach.profile.id,
          athleteId: athleteHealth.id,
          type: ActionItemType.HEALTH_REPORT,
          status: ActionItemStatus.OPEN,
        },
      });

      expect(items).toHaveLength(1);
      expect(items[0]?.severity).toBe(ActionItemSeverity.CRITICAL);
    });

    it("does not create duplicates on second reconcile", async () => {
      const result = await platformCoachActionItemsApi.reconcile(coach.user.id);

      expect(result.created).toBe(0);
    });

    it("updates severity when condition changes", async () => {
      const missedItem = await cleanupRaw.coachActionItem.findFirst({
        where: {
          coachId: coach.profile.id,
          athleteId: athleteMissed.id,
          type: ActionItemType.MISSED_WORKOUTS,
          status: ActionItemStatus.OPEN,
        },
      });

      if (!missedItem) {
        throw new Error("Expected missed workouts item to exist");
      }

      const originalSeverity = missedItem.severity;

      const logEntry = await cleanupRaw.workoutLog.findFirst({
        where: { userId: athleteMissed.id },
      });

      if (!logEntry) {
        throw new Error("Expected workout log to exist");
      }

      const newDate =
        originalSeverity === ActionItemSeverity.WARNING
          ? daysAgo(MISSED_DAYS_CRITICAL + 1)
          : daysAgo(MISSED_DAYS_WARNING + 1);

      await cleanupRaw.workoutLog.update({
        where: { id: logEntry.id },
        data: { date: newDate },
      });

      const result = await platformCoachActionItemsApi.reconcile(coach.user.id);

      expect(result.updated).toBeGreaterThanOrEqual(1);

      const updated = await cleanupRaw.coachActionItem.findUnique({
        where: { id: missedItem.id },
      });

      expect(updated?.severity).not.toBe(originalSeverity);
    });

    it("resolves open items when condition clears", async () => {
      await cleanupRaw.athleteProfile.update({
        where: { userId: athleteHealth.id },
        data: { healthStatus: "HEALTHY" },
      });

      const result = await platformCoachActionItemsApi.reconcile(coach.user.id);

      expect(result.resolved).toBeGreaterThanOrEqual(1);

      const healthItems = await cleanupRaw.coachActionItem.findMany({
        where: {
          coachId: coach.profile.id,
          athleteId: athleteHealth.id,
          type: ActionItemType.HEALTH_REPORT,
        },
      });

      const openHealth = healthItems.filter((i) => i.status === ActionItemStatus.OPEN);

      expect(openHealth).toHaveLength(0);

      await cleanupRaw.athleteProfile.update({
        where: { userId: athleteHealth.id },
        data: { healthStatus: "INJURED" },
      });
    });

    it("does NOT recreate recently resolved items with same metadata", async () => {
      await cleanupRaw.athleteProfile.update({
        where: { userId: athleteHealth.id },
        data: { healthStatus: "INJURED" },
      });

      const existingResolved = await cleanupRaw.coachActionItem.findFirst({
        where: {
          coachId: coach.profile.id,
          athleteId: athleteHealth.id,
          type: ActionItemType.HEALTH_REPORT,
          status: ActionItemStatus.RESOLVED,
        },
      });

      if (existingResolved) {
        const result = await platformCoachActionItemsApi.reconcile(coach.user.id);
        const newItems = await cleanupRaw.coachActionItem.findMany({
          where: {
            coachId: coach.profile.id,
            athleteId: athleteHealth.id,
            type: ActionItemType.HEALTH_REPORT,
            status: ActionItemStatus.OPEN,
          },
        });

        expect(newItems).toHaveLength(0);
        expect(result.created).toBe(0);
      }
    });

    it("returns correct counts structure", async () => {
      const result = await platformCoachActionItemsApi.reconcile(coach.user.id);

      expect(result).toHaveProperty("created");
      expect(result).toHaveProperty("updated");
      expect(result).toHaveProperty("resolved");
      expect(typeof result.created).toBe("number");
      expect(typeof result.updated).toBe("number");
      expect(typeof result.resolved).toBe("number");
    });
  });

  describe("resolve", () => {
    it("resolves an open item with MANUAL_CONTACTED reason", async () => {
      const item = await cleanupRaw.coachActionItem.create({
        data: {
          coachId: coach.profile.id,
          athleteId: athleteResolve.id,
          type: ActionItemType.NEW_NO_START,
          severity: ActionItemSeverity.INFO,
          message: "Test resolve item",
          metadata: { enrollmentId: "test-123" },
        },
      });

      const resolved = await platformCoachActionItemsApi.resolve(coach.user.id, item.id);

      expect(resolved.status).toBe(ActionItemStatus.RESOLVED);
      expect(resolved.resolveReason).toBe(ActionItemResolveReason.MANUAL_CONTACTED);
      expect(resolved.resolvedAt).toBeInstanceOf(Date);
    });

    it("returns already-resolved item without changes", async () => {
      const item = await cleanupRaw.coachActionItem.create({
        data: {
          coachId: coach.profile.id,
          athleteId: athleteResolve.id,
          type: ActionItemType.NEW_NO_START,
          severity: ActionItemSeverity.INFO,
          status: ActionItemStatus.RESOLVED,
          message: "Already resolved",
          resolvedAt: new Date(),
          resolveReason: ActionItemResolveReason.AUTO_CONDITION_CLEARED,
        },
      });

      const result = await platformCoachActionItemsApi.resolve(coach.user.id, item.id);

      expect(result.status).toBe(ActionItemStatus.RESOLVED);
      expect(result.resolveReason).toBe(ActionItemResolveReason.AUTO_CONDITION_CLEARED);
    });

    it("throws NotFoundError for non-existent item", async () => {
      await expect(
        platformCoachActionItemsApi.resolve(coach.user.id, "cl000000000000000000000000"),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
