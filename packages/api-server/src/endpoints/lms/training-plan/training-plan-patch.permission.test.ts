import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { TrainingPlanStatus } from "@repo/contracts/lms/training-plan";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach } from "../../../test/helpers";

import { lmsTrainingPlanPatchApi } from "./training-plan-patch";

const COUNT_DOWN = { kind: "COUNT_DOWN", durationSec: 600 } as Prisma.InputJsonValue;

describe("lmsTrainingPlanPatchApi.patch — permissions and cross-plan (integration)", () => {
  let coach: Awaited<ReturnType<typeof createTestCoach>>;
  let otherCoach: Awaited<ReturnType<typeof createTestCoach>>;
  let planId: string;
  let otherPlanBlockId: string;
  let blockKindId: string;
  let sessionId: string;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    coach = await createTestCoach();
    otherCoach = await createTestCoach();

    await cleanupRaw.user.update({
      where: { id: coach.user.id },
      data: { role: ROLE_TO_PRISMA_MAP[UserRole.COACH] },
    });
    await cleanupRaw.user.update({
      where: { id: otherCoach.user.id },
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

    sessionId = (await cleanupRaw.lmsSession.create({ data: { dayId: day.id, order: 0 } })).id;

    const blockKind = await cleanupRaw.blockKind.create({
      data: { scope: "SYSTEM", name: `BK ${crypto.randomUUID().slice(0, 8)}`, defaultWeight: 1 },
    });

    blockKindId = blockKind.id;
    toCleanup.push({ table: "blockKind", id: blockKindId });

    const otherPlan = await cleanupRaw.trainingPlan.create({
      data: {
        creatorId: otherCoach.user.id,
        name: `Other Plan ${crypto.randomUUID().slice(0, 8)}`,
        status: TrainingPlanStatus.DRAFT,
      },
    });

    toCleanup.push({ table: "trainingPlan", id: otherPlan.id });

    const otherWeek = await cleanupRaw.week.create({ data: { planId: otherPlan.id, index: 0 } });
    const otherDay = await cleanupRaw.day.create({
      data: { weekId: otherWeek.id, dayOfWeek: "MON" },
    });
    const otherSess = await cleanupRaw.lmsSession.create({
      data: { dayId: otherDay.id, order: 0 },
    });
    const otherBlock = await cleanupRaw.block.create({
      data: { sessionId: otherSess.id, order: 0, kindId: blockKindId, weight: 1 },
    });

    otherPlanBlockId = otherBlock.id;

    await cleanupRaw.blockSegment.create({
      data: {
        blockId: otherBlock.id,
        order: 0,
        archetypeKind: "COUNT_DOWN",
        schemeParams: COUNT_DOWN,
      },
    });
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coach.user.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: otherCoach.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: otherCoach.user.id } }).catch(() => {});
  });

  it("cross-plan op fails with 404", async () => {
    await expect(
      lmsTrainingPlanPatchApi.patch(coach.user.id, planId, {
        ops: [
          {
            kind: "update-block",
            blockId: otherPlanBlockId,
            expectedVersion: 1,
            fullEntity: {
              order: 0,
              kindId: blockKindId,
              title: "X",
              status: "ACTIVE",
              weight: 1,
              notes: null,
            },
          },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it("non-owner is rejected with 403", async () => {
    await expect(
      lmsTrainingPlanPatchApi.patch(otherCoach.user.id, planId, {
        ops: [
          {
            kind: "create-block",
            sessionId,
            payload: {
              order: 1000,
              kindId: blockKindId,
              status: "ACTIVE",
              weight: 1,
            },
          },
        ],
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});
