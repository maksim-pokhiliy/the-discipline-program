import { afterEach, describe, expect, it } from "vitest";

import {
  ActionItemResolveReason,
  ActionItemSeverity,
  ActionItemStatus,
  ActionItemType,
} from "@repo/contracts/coaching/coach-action-item";
import { ForbiddenError, NotFoundError } from "@repo/errors";

import { inMemoryCache } from "../../infrastructure/cache";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../test/helpers";

import { buildCoachMetricsCacheKey, coachingCoachActionItemApi } from "./coach-action-item";

type ActionItemSeed = {
  coach: Awaited<ReturnType<typeof createTestCoach>>;
  athlete: Awaited<ReturnType<typeof createTestUser>>;
  itemId: string;
  assignmentId: string;
};

describe("coachingCoachActionItemApi.resolve", () => {
  const createdItemIds: string[] = [];
  const createdNoteCoachIds: string[] = [];
  const toCleanup: { table: string; id: string }[] = [];

  const seedActionItem = async (options?: {
    status?: ActionItemStatus;
  }): Promise<ActionItemSeed> => {
    const coach = await createTestCoach();
    const athlete = await createTestUser();

    const assignment = await cleanupRaw.coachAthleteAssignment.create({
      data: { coachId: coach.profile.id, athleteId: athlete.id },
    });

    const item = await cleanupRaw.coachActionItem.create({
      data: {
        coachId: coach.profile.id,
        athleteId: athlete.id,
        type: ActionItemType.MISSED_WORKOUTS,
        severity: ActionItemSeverity.WARNING,
        status: options?.status ?? ActionItemStatus.OPEN,
        message: "3 consecutive days missed — reach out",
      },
    });

    createdItemIds.push(item.id);
    createdNoteCoachIds.push(coach.profile.id);
    toCleanup.push(
      { table: "coachProfile", id: coach.profile.id },
      { table: "user", id: coach.user.id },
      { table: "user", id: athlete.id },
      { table: "coachAthleteAssignment", id: assignment.id },
    );

    return { coach, athlete, itemId: item.id, assignmentId: assignment.id };
  };

  afterEach(async () => {
    await cleanupRaw.coachActionItem
      .deleteMany({ where: { id: { in: createdItemIds } } })
      .catch(() => {});
    await cleanupRaw.coachNote
      .deleteMany({ where: { coachId: { in: createdNoteCoachIds } } })
      .catch(() => {});
    await cleanup(...toCleanup);

    createdItemIds.length = 0;
    createdNoteCoachIds.length = 0;
    toCleanup.length = 0;
  });

  it("resolves an open item with the manual reason and no note when no body is given", async () => {
    const seed = await seedActionItem();

    const resolved = await coachingCoachActionItemApi.resolve(seed.coach.user.id, seed.itemId);

    expect(resolved.status).toBe(ActionItemStatus.RESOLVED);
    expect(resolved.resolveReason).toBe(ActionItemResolveReason.MANUAL_CONTACTED);

    const notes = await cleanupRaw.coachNote.findMany({
      where: { coachId: seed.coach.profile.id },
    });

    expect(notes).toHaveLength(0);
  });

  it("resolves and creates a coach note in one transaction when a note is supplied", async () => {
    const seed = await seedActionItem();

    const resolved = await coachingCoachActionItemApi.resolve(seed.coach.user.id, seed.itemId, {
      note: "Called the athlete, back next week",
    });

    expect(resolved.status).toBe(ActionItemStatus.RESOLVED);

    const notes = await cleanupRaw.coachNote.findMany({
      where: { coachId: seed.coach.profile.id, athleteId: seed.athlete.id },
    });

    expect(notes).toHaveLength(1);
    expect(notes[0]?.content).toBe("Called the athlete, back next week");
  });

  it("busts the coach metrics cache after a successful resolve", async () => {
    const seed = await seedActionItem();
    const cacheKey = buildCoachMetricsCacheKey(seed.coach.profile.id);

    await inMemoryCache.set(cacheKey, { sentinel: true }, { ttlSeconds: 60 });

    await coachingCoachActionItemApi.resolve(seed.coach.user.id, seed.itemId);

    expect(await inMemoryCache.get(cacheKey)).toBeNull();
  });

  it("rolls back the resolve when the in-transaction guard rejects the note write", async () => {
    const seed = await seedActionItem();

    await cleanupRaw.coachAthleteAssignment.delete({ where: { id: seed.assignmentId } });

    await expect(
      coachingCoachActionItemApi.resolve(seed.coach.user.id, seed.itemId, {
        note: "Should roll back",
      }),
    ).rejects.toThrow(ForbiddenError);

    const item = await cleanupRaw.coachActionItem.findUnique({ where: { id: seed.itemId } });
    const notes = await cleanupRaw.coachNote.findMany({
      where: { coachId: seed.coach.profile.id },
    });

    expect(item?.status).toBe(ActionItemStatus.OPEN);
    expect(notes).toHaveLength(0);
  });

  it("is idempotent and creates no note when the item is already resolved", async () => {
    const seed = await seedActionItem({ status: ActionItemStatus.RESOLVED });

    const resolved = await coachingCoachActionItemApi.resolve(seed.coach.user.id, seed.itemId, {
      note: "Ignored on already-resolved",
    });

    expect(resolved.status).toBe(ActionItemStatus.RESOLVED);

    const notes = await cleanupRaw.coachNote.findMany({
      where: { coachId: seed.coach.profile.id },
    });

    expect(notes).toHaveLength(0);
  });

  it("throws NotFoundError when resolving another coach's item", async () => {
    const seed = await seedActionItem();
    const otherCoach = await createTestCoach();

    toCleanup.push(
      { table: "coachProfile", id: otherCoach.profile.id },
      { table: "user", id: otherCoach.user.id },
    );

    await expect(
      coachingCoachActionItemApi.resolve(otherCoach.user.id, seed.itemId),
    ).rejects.toThrow(NotFoundError);
  });
});
