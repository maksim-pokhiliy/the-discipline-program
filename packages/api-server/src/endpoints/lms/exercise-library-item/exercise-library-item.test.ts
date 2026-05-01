import { type Prisma } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { UserRole } from "@repo/contracts/iam/auth";
import { type UpdateExerciseLibraryItemInput } from "@repo/contracts/lms/exercise-library-item";

import { ROLE_TO_PRISMA_MAP } from "../../../mappers/iam";
import { cleanup, cleanupRaw, createTestCoach, createTestUser } from "../../../test/helpers";

import { lmsExerciseLibraryItemApi } from "./exercise-library-item";

const DEFAULT_METRICS = {
  canMeasureLoad: true,
  canMeasureReps: true,
  canMeasureDuration: false,
  canMeasureDistance: false,
  canMeasureCalories: false,
} as Prisma.InputJsonValue;

describe("lmsExerciseLibraryItemApi promote/demote (integration)", () => {
  let admin: Awaited<ReturnType<typeof createTestUser>>;
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;
  let coachB: Awaited<ReturnType<typeof createTestCoach>>;
  let athlete: Awaited<ReturnType<typeof createTestUser>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    admin = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ADMIN] });
    coachA = await createTestCoach();
    coachB = await createTestCoach();
    athlete = await createTestUser({ role: ROLE_TO_PRISMA_MAP[UserRole.ATHLETE] });
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coachA.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachA.user.id } }).catch(() => {});
    await cleanupRaw.coachProfile.delete({ where: { id: coachB.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachB.user.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: admin.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: athlete.id } }).catch(() => {});
  });

  it("promote happy path: COACH → SYSTEM with ownerId nulled and FK references intact", async () => {
    const created = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: `Ex PromoteHappy ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: DEFAULT_METRICS,
      },
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: created.id });

    const plan = await cleanupRaw.trainingPlan.create({
      data: { creatorId: coachA.user.id, name: `Plan ${crypto.randomUUID().slice(0, 8)}` },
    });

    toCleanup.push({ table: "trainingPlan", id: plan.id });

    const week = await cleanupRaw.week.create({ data: { planId: plan.id, index: 0 } });
    const day = await cleanupRaw.day.create({ data: { weekId: week.id, dayOfWeek: "MON" } });
    const session = await cleanupRaw.lmsSession.create({ data: { dayId: day.id, order: 0 } });

    const blockKind = await cleanupRaw.blockKind.create({
      data: {
        scope: "SYSTEM",
        name: `BK ${crypto.randomUUID().slice(0, 8)}`,
        defaultWeight: 1,
      },
    });

    toCleanup.push({ table: "blockKind", id: blockKind.id });

    const block = await cleanupRaw.block.create({
      data: { sessionId: session.id, order: 0, kindId: blockKind.id, weight: 1 },
    });

    const segment = await cleanupRaw.blockSegment.create({
      data: {
        blockId: block.id,
        order: 0,
        archetypeKind: "COUNT_DOWN",
        schemeParams: { kind: "COUNT_DOWN", durationSec: 600 } as Prisma.InputJsonValue,
      },
    });

    const setGroup = await cleanupRaw.setGroup.create({
      data: { segmentId: segment.id, order: 0 },
    });

    await cleanupRaw.exerciseEntry.create({
      data: {
        setGroupId: setGroup.id,
        order: 0,
        exerciseId: created.id,
        exerciseSnapshot: {
          id: created.id,
          name: created.name,
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
        } as Prisma.InputJsonValue,
        prescription: { reps: { kind: "FIXED", value: 5 } } as Prisma.InputJsonValue,
        alternatives: [] as Prisma.InputJsonValue,
      },
    });

    const promoted = await lmsExerciseLibraryItemApi.promote(admin.id, created.id);

    expect(promoted.scope).toBe("SYSTEM");
    expect(promoted.ownerId).toBeNull();

    const linked = await cleanupRaw.exerciseEntry.findFirst({
      where: { exerciseId: promoted.id },
    });

    expect(linked).not.toBeNull();
  });

  it("promote rejects already-SYSTEM with 409", async () => {
    const created = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "SYSTEM",
        name: `Ex AlreadySystem ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: DEFAULT_METRICS,
      },
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: created.id });

    await expect(lmsExerciseLibraryItemApi.promote(admin.id, created.id)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("promote rejects on SYSTEM-name collision with 400", async () => {
    const sharedName = `Ex Collision ${crypto.randomUUID().slice(0, 8)}`;

    const sys = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "SYSTEM",
        name: sharedName,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: DEFAULT_METRICS,
      },
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: sys.id });

    const coachOwn = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: sharedName,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: DEFAULT_METRICS,
      },
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: coachOwn.id });

    await expect(lmsExerciseLibraryItemApi.promote(admin.id, coachOwn.id)).rejects.toMatchObject({
      statusCode: 400,
      details: { existingId: sys.id, candidateName: sharedName },
    });
  });

  it("promote rejects non-admin/non-head-coach with 403", async () => {
    const created = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: `Ex Forbidden ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: DEFAULT_METRICS,
      },
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: created.id });

    await expect(lmsExerciseLibraryItemApi.promote(athlete.id, created.id)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("demote happy path", async () => {
    const created = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "SYSTEM",
        name: `Ex DemoteHappy ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: DEFAULT_METRICS,
      },
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: created.id });

    const demoted = await lmsExerciseLibraryItemApi.demote(admin.id, created.id, {
      newOwnerId: coachA.user.id,
    });

    expect(demoted.scope).toBe("COACH");
    expect(demoted.ownerId).toBe(coachA.user.id);
  });

  it("demote rejects already-COACH with 409", async () => {
    const created = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: `Ex AlreadyCoach ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: DEFAULT_METRICS,
      },
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: created.id });

    await expect(
      lmsExerciseLibraryItemApi.demote(admin.id, created.id, { newOwnerId: coachB.user.id }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it("demote rejects non-coach newOwnerId with 400", async () => {
    const created = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "SYSTEM",
        name: `Ex WrongOwner ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: DEFAULT_METRICS,
      },
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: created.id });

    await expect(
      lmsExerciseLibraryItemApi.demote(admin.id, created.id, { newOwnerId: athlete.id }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it("demote rejects on COACH-(owner,name) collision with 400", async () => {
    const sharedName = `Ex DemoteCollision ${crypto.randomUUID().slice(0, 8)}`;

    const sys = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "SYSTEM",
        name: sharedName,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: DEFAULT_METRICS,
      },
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: sys.id });

    const coachOwn = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: sharedName,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: DEFAULT_METRICS,
      },
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: coachOwn.id });

    await expect(
      lmsExerciseLibraryItemApi.demote(admin.id, sys.id, { newOwnerId: coachA.user.id }),
    ).rejects.toMatchObject({
      statusCode: 400,
      details: { existingId: coachOwn.id, candidateName: sharedName },
    });
  });
});

describe("lmsExerciseLibraryItemApi update scope guard (integration)", () => {
  let coachA: Awaited<ReturnType<typeof createTestCoach>>;

  const toCleanup: { table: string; id: string }[] = [];

  beforeAll(async () => {
    coachA = await createTestCoach();
  });

  afterAll(async () => {
    await cleanup(...toCleanup);
    await cleanupRaw.coachProfile.delete({ where: { id: coachA.profile.id } }).catch(() => {});
    await cleanupRaw.user.delete({ where: { id: coachA.user.id } }).catch(() => {});
  });

  it("update rejects scope in payload with 403 and leaves DB row unchanged", async () => {
    const item = await cleanupRaw.exerciseLibraryItem.create({
      data: {
        scope: "COACH",
        ownerId: coachA.user.id,
        name: `Ex ScopeGuard ${crypto.randomUUID().slice(0, 8)}`,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: DEFAULT_METRICS,
      },
    });

    toCleanup.push({ table: "exerciseLibraryItem", id: item.id });

    const payloadWithScope = {
      scope: "SYSTEM",
    } as unknown as UpdateExerciseLibraryItemInput;

    await expect(
      lmsExerciseLibraryItemApi.update(coachA.user.id, item.id, payloadWithScope),
    ).rejects.toMatchObject({ statusCode: 403 });

    const unchanged = await cleanupRaw.exerciseLibraryItem.findUnique({ where: { id: item.id } });

    expect(unchanged?.scope).toBe("COACH");
  });
});
