import { type Prisma } from "@prisma/client";

import {
  cleanupRaw,
  createTestCoach,
  createTestEnrollment,
  createTestPlan,
  createTestUser,
} from "../../test/helpers";

export const COUNT_DOWN_PARAMS = { kind: "COUNT_DOWN", durationSec: 600 } as Prisma.InputJsonValue;

export const DEFAULT_METRICS = {
  canMeasureLoad: true,
  canMeasureReps: true,
  canMeasureDuration: false,
  canMeasureDistance: false,
  canMeasureCalories: false,
} as Prisma.InputJsonValue;

export const makeBlockSnapshot = (
  blockId: string,
  sessionId: string,
  kindId: string,
): Prisma.InputJsonValue => ({
  id: blockId,
  sessionId,
  order: 0,
  kindId,
  title: null,
  status: "ACTIVE",
  weight: 1,
  notes: null,
  version: 1,
});

export const makeEntrySnapshot = (
  entryId: string,
  setGroupId: string,
  exerciseId: string,
): Prisma.InputJsonValue => ({
  id: entryId,
  setGroupId,
  order: 0,
  exerciseId,
  exerciseSnapshot: {
    id: exerciseId,
    name: "Test Exercise",
    primaryMovement: "SQUAT",
    modality: "BARBELL",
    primaryBodyParts: ["QUADS"],
    defaultMetrics: DEFAULT_METRICS,
    demoVideoUrl: null,
    demoImageUrl: null,
  },
  prescription: { reps: { kind: "FIXED", value: 5 } },
  alternatives: [],
  externalUrl: null,
  notes: null,
  version: 1,
});

export type ResolverFixture = {
  coachUserId: string;
  athleteUserId: string;
  planId: string;
  enrollmentId: string;
  sessionId: string;
  blockKindId: string;
  blockId: string;
  segmentId: string;
  exerciseId: string;
  toCleanup: { table: string; id: string }[];
};

export const buildResolverFixture = async (): Promise<ResolverFixture> => {
  const toCleanup: { table: string; id: string }[] = [];

  const coach = await createTestCoach();

  toCleanup.push(
    { table: "coachProfile", id: coach.profile.id },
    { table: "user", id: coach.user.id },
  );

  const athlete = await createTestUser();

  toCleanup.push({ table: "user", id: athlete.id });

  const plan = await createTestPlan(coach.user.id);

  toCleanup.push({ table: "trainingPlan", id: plan.id });

  const enrollment = await createTestEnrollment(plan.id, athlete.id);

  toCleanup.push({ table: "planEnrollment", id: enrollment.id });

  const week = await cleanupRaw.week.create({ data: { planId: plan.id, index: 0 } });
  const day = await cleanupRaw.day.create({ data: { weekId: week.id, dayOfWeek: "MON" } });
  const session = await cleanupRaw.lmsSession.create({ data: { dayId: day.id, order: 0 } });

  const blockKind = await cleanupRaw.blockKind.create({
    data: { scope: "SYSTEM", name: `BK Res ${crypto.randomUUID().slice(0, 8)}`, defaultWeight: 1 },
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
      schemeParams: COUNT_DOWN_PARAMS,
    },
  });

  const sg = await cleanupRaw.setGroup.create({ data: { segmentId: segment.id, order: 0 } });

  const exercise = await cleanupRaw.exerciseLibraryItem.create({
    data: {
      scope: "SYSTEM",
      name: `ExRes ${crypto.randomUUID().slice(0, 8)}`,
      primaryMovement: "SQUAT",
      modality: "BARBELL",
      primaryBodyParts: ["QUADS"],
      defaultMetrics: DEFAULT_METRICS,
    },
  });

  toCleanup.push({ table: "exerciseLibraryItem", id: exercise.id });

  await cleanupRaw.exerciseEntry.create({
    data: {
      setGroupId: sg.id,
      order: 0,
      exerciseId: exercise.id,
      exerciseSnapshot: {
        id: exercise.id,
        name: exercise.name,
        primaryMovement: "SQUAT",
        modality: "BARBELL",
        primaryBodyParts: ["QUADS"],
        defaultMetrics: DEFAULT_METRICS,
        demoVideoUrl: null,
        demoImageUrl: null,
      } as Prisma.InputJsonValue,
      prescription: { reps: { kind: "FIXED", value: 5 } } as Prisma.InputJsonValue,
      alternatives: [] as Prisma.InputJsonValue,
    },
  });

  return {
    coachUserId: coach.user.id,
    athleteUserId: athlete.id,
    planId: plan.id,
    enrollmentId: enrollment.id,
    sessionId: session.id,
    blockKindId: blockKind.id,
    blockId: block.id,
    segmentId: segment.id,
    exerciseId: exercise.id,
    toCleanup,
  };
};
