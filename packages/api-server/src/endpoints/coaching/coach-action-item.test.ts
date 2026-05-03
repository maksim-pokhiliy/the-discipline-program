import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { HealthStatus } from "@repo/contracts/coaching/athlete-profile";
import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coaching/coach-action-item";
import { NotFoundError } from "@repo/errors";

import { inMemoryCache } from "../../infrastructure/cache";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import { coachingCoachActionItemApi } from "./coach-action-item";
import { daysAgo } from "./coach-action-item.test-helpers";

describe("coachingCoachActionItemApi", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;

  let athleteMissed: Awaited<ReturnType<typeof createTestUser>>;
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

    athleteMissed = await createTestUser();
    athleteHealth = await createTestUser();
    athleteResolve = await createTestUser();

    const profile = await cleanupRaw.athleteProfile.create({
      data: { userId: athleteHealth.id, healthStatus: HealthStatus.INJURED },
    });

    trackCleanup("athleteProfile", profile.id);

    const athleteIds = [athleteMissed.id, athleteHealth.id, athleteResolve.id];

    await cleanupRaw.coachAthleteAssignment.createMany({
      data: athleteIds.map((athleteId) => ({ coachId: coach.profile.id, athleteId })),
    });

    await cleanupRaw.workoutSession.createMany({
      data: [
        {
          userId: athleteMissed.id,
          status: "COMPLETED",
          startedAt: daysAgo(1),
          completedAt: daysAgo(1),
          completionRatio: 0.1,
          durationSec: 600,
        },
        {
          userId: athleteMissed.id,
          status: "COMPLETED",
          startedAt: daysAgo(3),
          completedAt: daysAgo(3),
          completionRatio: 0.2,
          durationSec: 600,
        },
      ],
    });
  });

  afterAll(async () => {
    await cleanupRaw.coachActionItem
      .deleteMany({ where: { coachId: coach.profile.id } })
      .catch(() => {});

    await cleanupRaw.coachAthleteAssignment
      .deleteMany({ where: { coachId: coach.profile.id } })
      .catch(() => {});

    await cleanupRaw.workoutSession
      .deleteMany({ where: { userId: { in: [athleteMissed.id, athleteHealth.id] } } })
      .catch(() => {});

    await cleanup(
      ...toCleanup,
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
      { table: "user", id: athleteMissed.id },
      { table: "user", id: athleteHealth.id },
      { table: "user", id: athleteResolve.id },
    );
  });

  describe("reconcile", () => {
    beforeEach(async () => {
      await inMemoryCache.delete(`reconcile:${coach.profile.id}`);
    });

    it("creates action items for detected conditions", async () => {
      const result = await coachingCoachActionItemApi.reconcile(coach.user.id);

      expect(result.created).toBeGreaterThanOrEqual(2);

      const items = await cleanupRaw.coachActionItem.findMany({
        where: { coachId: coach.profile.id, status: ActionItemStatus.OPEN },
      });

      const types = items.map((i) => i.type);

      expect(types).toContain(ActionItemType.MISSED_WORKOUTS);
      expect(types).toContain(ActionItemType.HEALTH_REPORT);
    });

    it("creates MISSED_WORKOUTS for athlete with low completionRatio sessions", async () => {
      const items = await cleanupRaw.coachActionItem.findMany({
        where: {
          coachId: coach.profile.id,
          athleteId: athleteMissed.id,
          type: ActionItemType.MISSED_WORKOUTS,
          status: ActionItemStatus.OPEN,
        },
      });

      expect(items).toHaveLength(1);
      expect(items[0]?.severity).toBe(ActionItemSeverity.WARNING);
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
      const result = await coachingCoachActionItemApi.reconcile(coach.user.id);

      expect(result.created).toBe(0);
    });

    it("resolves open items when condition clears", async () => {
      await cleanupRaw.athleteProfile.update({
        where: { userId: athleteHealth.id },
        data: { healthStatus: HealthStatus.HEALTHY },
      });

      const result = await coachingCoachActionItemApi.reconcile(coach.user.id);

      expect(result.resolved).toBeGreaterThanOrEqual(1);

      const healthItems = await cleanupRaw.coachActionItem.findMany({
        where: {
          coachId: coach.profile.id,
          athleteId: athleteHealth.id,
          type: ActionItemType.HEALTH_REPORT,
        },
      });

      expect(healthItems.filter((i) => i.status === ActionItemStatus.OPEN)).toHaveLength(0);

      await cleanupRaw.athleteProfile.update({
        where: { userId: athleteHealth.id },
        data: { healthStatus: HealthStatus.INJURED },
      });
    });

    it("does NOT recreate recently resolved items with same metadata", async () => {
      await cleanupRaw.athleteProfile.update({
        where: { userId: athleteHealth.id },
        data: { healthStatus: HealthStatus.INJURED },
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
        const result = await coachingCoachActionItemApi.reconcile(coach.user.id);
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
      const result = await coachingCoachActionItemApi.reconcile(coach.user.id);

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
          type: ActionItemType.HEALTH_REPORT,
          severity: ActionItemSeverity.WARNING,
          message: "Test resolve item",
          metadata: { healthStatus: HealthStatus.INJURED },
        },
      });

      const resolved = await coachingCoachActionItemApi.resolve(coach.user.id, item.id);

      expect(resolved.status).toBe(ActionItemStatus.RESOLVED);
      expect(resolved.resolveReason).toBe(ActionItemResolveReason.MANUAL_CONTACTED);
      expect(resolved.resolvedAt).toBeInstanceOf(Date);
    });

    it("returns already-resolved item without changes", async () => {
      const item = await cleanupRaw.coachActionItem.create({
        data: {
          coachId: coach.profile.id,
          athleteId: athleteResolve.id,
          type: ActionItemType.HEALTH_REPORT,
          severity: ActionItemSeverity.WARNING,
          status: ActionItemStatus.RESOLVED,
          message: "Already resolved",
          resolvedAt: new Date(),
          resolveReason: ActionItemResolveReason.AUTO_CONDITION_CLEARED,
        },
      });

      const result = await coachingCoachActionItemApi.resolve(coach.user.id, item.id);

      expect(result.status).toBe(ActionItemStatus.RESOLVED);
      expect(result.resolveReason).toBe(ActionItemResolveReason.AUTO_CONDITION_CLEARED);
    });

    it("throws NotFoundError for non-existent item", async () => {
      await expect(
        coachingCoachActionItemApi.resolve(coach.user.id, "cl000000000000000000000000"),
      ).rejects.toThrow(NotFoundError);
    });
  });
});
