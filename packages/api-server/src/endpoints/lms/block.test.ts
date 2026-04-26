import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach } from "../../test/helpers";

import { lmsBlockApi } from "./block";

describe("lmsBlockApi (integration)", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let sessionId: string;
  let blockKindId: string;
  let planId: string;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    coach = await createTestCoach();

    await cleanupRaw.user.update({
      where: { id: coach.user.id },
      data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
    });

    const plan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: coach.user.id,
        name: `Plan ${crypto.randomUUID().slice(0, 8)}`,
        status: TrainingPlanStatus.DRAFT,
      },
    });

    planId = plan.id;
    toCleanup.push({ table: "trainingPlan", id: planId });

    const week = await cleanupRaw.week.create({
      data: { planId, index: 0 },
    });

    const day = await cleanupRaw.day.create({
      data: { weekId: week.id, dayOfWeek: "MON" },
    });

    const session = await cleanupRaw.lmsSession.create({
      data: { dayId: day.id, order: 0 },
    });

    sessionId = session.id;

    const blockKind = await cleanupRaw.blockKind.create({
      data: {
        scope: "SYSTEM",
        name: `Test Kind ${crypto.randomUUID().slice(0, 8)}`,
        defaultWeight: 1,
      },
    });

    blockKindId = blockKind.id;
    toCleanup.push({ table: "blockKind", id: blockKindId });
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
  });

  it("update returns the full entity with version incremented", async () => {
    const block = await lmsBlockApi.create(coach.user.id, {
      sessionId,
      order: 0,
      kindId: blockKindId,
      status: "ACTIVE",
      weight: 1,
    });

    expect(block.version).toBe(1);

    const updated = await lmsBlockApi.update(coach.user.id, block.id, {
      expectedVersion: 1,
      order: 1,
      kindId: blockKindId,
      title: "Updated",
      status: "ACTIVE",
      weight: 2,
      notes: "note",
    });

    expect(updated.version).toBe(2);
    expect(updated.order).toBe(1);
    expect(updated.title).toBe("Updated");
    expect(updated.weight).toBe(2);
    expect(updated.notes).toBe("note");
  });

  it("update throws ConflictError on stale expectedVersion", async () => {
    const block = await lmsBlockApi.create(coach.user.id, {
      sessionId,
      order: 2,
      kindId: blockKindId,
      status: "ACTIVE",
      weight: 1,
    });

    await lmsBlockApi.update(coach.user.id, block.id, {
      expectedVersion: 1,
      order: 2,
      kindId: blockKindId,
      title: null,
      status: "ACTIVE",
      weight: 1,
      notes: null,
    });

    await expect(
      lmsBlockApi.update(coach.user.id, block.id, {
        expectedVersion: 1,
        order: 2,
        kindId: blockKindId,
        title: "stale",
        status: "ACTIVE",
        weight: 1,
        notes: null,
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
      details: { currentVersion: 2, expectedVersion: 1 },
    });
  });

  it("update throws NotFoundError when block id does not exist", async () => {
    await expect(
      lmsBlockApi.update(coach.user.id, "ckxxxxxxxxxxxxxxxxxxxxxxx", {
        expectedVersion: 1,
        order: 0,
        kindId: blockKindId,
        title: null,
        status: "ACTIVE",
        weight: 1,
        notes: null,
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
