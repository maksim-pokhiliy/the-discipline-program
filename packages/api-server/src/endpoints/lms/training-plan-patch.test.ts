import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { ROLE_TO_PRISMA_MAP } from "../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach } from "../../test/helpers";

import { lmsTrainingPlanPatchApi } from "./training-plan-patch";

const COUNT_DOWN = { kind: "COUNT_DOWN", durationSec: 600 } as Prisma.InputJsonValue;
const METRICS = {
  canMeasureLoad: true,
  canMeasureReps: true,
  canMeasureDuration: false,
  canMeasureDistance: false,
  canMeasureCalories: false,
} as Prisma.InputJsonValue;
const PRESCRIPTION = {
  reps: { kind: "FIXED", value: 5 },
  sideMode: "BILATERAL",
  modifiers: [],
} as Prisma.InputJsonValue;

const snap = (id: string) =>
  ({
    id,
    name: "Snap",
    primaryMovement: "SQUAT",
    modality: "BARBELL",
    primaryBodyParts: ["QUADS"],
    defaultMetrics: {
      canMeasureLoad: true,
      canMeasureReps: true,
      canMeasureDuration: false,
      canMeasureDistance: false,
      canMeasureCalories: false,
    },
    demoVideoUrl: null,
    demoImageUrl: null,
  }) as Prisma.InputJsonValue;

describe("lmsTrainingPlanPatchApi.patch — owned plan flows (integration)", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let planId: string;
  let sessionA: string;
  let blockKindId: string;
  let exerciseId: string;

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

    const week = await cleanupRaw.week.create({ data: { planId, index: 0 } });
    const day = await cleanupRaw.day.create({ data: { weekId: week.id, dayOfWeek: "MON" } });

    sessionA = (await cleanupRaw.lmsSession.create({ data: { dayId: day.id, order: 0 } })).id;

    const blockKind = await cleanupRaw.blockKind.create({
      data: { scope: "SYSTEM", name: `BK ${crypto.randomUUID().slice(0, 8)}`, defaultWeight: 1 },
    });

    blockKindId = blockKind.id;
    toCleanup.push({ table: "blockKind", id: blockKindId });

    const exercise = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "SYSTEM",
        name: `Ex ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: METRICS,
      },
    });

    exerciseId = exercise.id;
    toCleanup.push({ table: "exerciseLibraryItem", id: exerciseId });
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
  });

  it("happy path: 5 mixed ops succeed and the database reflects all effects", async () => {
    const block = await cleanupRaw.block.create({
      data: { sessionId: sessionA, order: 5, kindId: blockKindId, weight: 1 },
    });
    const segment = await cleanupRaw.blockSegment.create({
      data: { blockId: block.id, order: 0, archetypeKind: "COUNT_DOWN", schemeParams: COUNT_DOWN },
    });
    const setGroup = await cleanupRaw.setGroup.create({
      data: { segmentId: segment.id, order: 0 },
    });
    const entryToDelete = await cleanupRaw.exerciseEntry.create({
      data: {
        setGroupId: setGroup.id,
        order: 0,
        exerciseId,
        exerciseSnapshot: snap(exerciseId),
        prescription: PRESCRIPTION,
        alternatives: [] as Prisma.InputJsonValue,
      },
    });

    const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, {
      ops: [
        {
          kind: "update-block",
          blockId: block.id,
          expectedVersion: 1,
          fullEntity: {
            order: 6,
            kindId: blockKindId,
            title: "Bulk-updated",
            status: "ACTIVE",
            weight: 2,
            notes: null,
          },
        },
        {
          kind: "move-segment",
          segmentId: segment.id,
          expectedVersion: 1,
          targetBlockId: block.id,
          targetOrder: 1,
        },
        {
          kind: "create-entry",
          setGroupId: setGroup.id,
          payload: {
            order: 1,
            exerciseId,
            exerciseSnapshot: snap(exerciseId) as never,
            prescription: PRESCRIPTION as never,
            alternatives: [],
          },
        },
        { kind: "delete-entry", entryId: entryToDelete.id, expectedVersion: 1 },
        {
          kind: "update-segment",
          segmentId: segment.id,
          expectedVersion: 2,
          fullEntity: {
            order: 1,
            label: "After move",
            archetypeKind: "COUNT_DOWN",
            schemeParams: { kind: "COUNT_DOWN", durationSec: 900 },
            schemeTemplateId: null,
            restConfig: null,
          },
        },
      ],
    });

    expect(result.conflicts).toBeUndefined();
    expect(result.updated.blocks).toHaveLength(1);
    expect(result.updated.blocks[0]?.title).toBe("Bulk-updated");
    expect(result.updated.segments).toHaveLength(2);
    expect(result.updated.entries).toHaveLength(1);

    const blockDb = await cleanupRaw.block.findUnique({ where: { id: block.id } });

    expect(blockDb?.order).toBe(6);

    const segmentDb = await cleanupRaw.blockSegment.findUnique({ where: { id: segment.id } });

    expect(segmentDb?.label).toBe("After move");
    expect(segmentDb?.version).toBe(3);

    const deletedDb = await cleanupRaw.exerciseEntry.findUnique({
      where: { id: entryToDelete.id },
    });

    expect(deletedDb).toBeNull();
  });

  it("conflict path: stale expectedVersion rolls back the entire batch", async () => {
    const block = await cleanupRaw.block.create({
      data: { sessionId: sessionA, order: 100, kindId: blockKindId, weight: 1 },
    });
    const segment = await cleanupRaw.blockSegment.create({
      data: { blockId: block.id, order: 0, archetypeKind: "COUNT_DOWN", schemeParams: COUNT_DOWN },
    });

    const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, {
      ops: [
        {
          kind: "update-block",
          blockId: block.id,
          expectedVersion: 1,
          fullEntity: {
            order: 101,
            kindId: blockKindId,
            title: "Will-rollback",
            status: "ACTIVE",
            weight: 1,
            notes: null,
          },
        },
        {
          kind: "update-segment",
          segmentId: segment.id,
          expectedVersion: 99,
          fullEntity: {
            order: 0,
            label: "Stale",
            archetypeKind: "COUNT_DOWN",
            schemeParams: { kind: "COUNT_DOWN", durationSec: 800 },
            schemeTemplateId: null,
            restConfig: null,
          },
        },
      ],
    });

    expect(result.updated.blocks).toHaveLength(0);
    expect(result.updated.segments).toHaveLength(0);
    expect(result.conflicts).toEqual([{ opIndex: 1, kind: "update-segment", currentVersion: 1 }]);

    const blockDb = await cleanupRaw.block.findUnique({ where: { id: block.id } });

    expect(blockDb?.title).toBeNull();
    expect(blockDb?.order).toBe(100);
    expect(blockDb?.version).toBe(1);
  });

  it("atomic transaction: first op effect rolled back when later op conflicts", async () => {
    const block = await cleanupRaw.block.create({
      data: { sessionId: sessionA, order: 200, kindId: blockKindId, weight: 1 },
    });

    const result = await lmsTrainingPlanPatchApi.patch(coach.user.id, planId, {
      ops: [
        {
          kind: "create-segment",
          blockId: block.id,
          payload: {
            order: 0,
            archetypeKind: "COUNT_DOWN",
            schemeParams: { kind: "COUNT_DOWN", durationSec: 100 },
          },
        },
        {
          kind: "update-block",
          blockId: block.id,
          expectedVersion: 999,
          fullEntity: {
            order: 200,
            kindId: blockKindId,
            title: "atomic-proof",
            status: "ACTIVE",
            weight: 1,
            notes: null,
          },
        },
      ],
    });

    expect(result.conflicts).toEqual([{ opIndex: 1, kind: "update-block", currentVersion: 1 }]);

    const segments = await cleanupRaw.blockSegment.findMany({ where: { blockId: block.id } });

    expect(segments).toHaveLength(0);
  });
});
